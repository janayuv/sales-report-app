/**
 * Main transformation engine for data import
 */

import type {
  TransformationConfig,
  TransformationResult,
  TransformationError,
  ColumnMapping,
} from './transformation';
import {
  OUTPUT_COLUMNS,
  DEFAULT_COLUMN_MAPPINGS,
  DEFAULT_YEAR_MAP,
  generateRECode,
  calculateIGSTFlags,
  findBestMatch,
  parseNumber,
} from './transformation';

export class TransformationEngine {
  private config: TransformationConfig;

  constructor(config?: Partial<TransformationConfig>) {
    this.config = {
      yearMap: DEFAULT_YEAR_MAP,
      columnMappings: DEFAULT_COLUMN_MAPPINGS,
      synonyms: {},
      ...config,
    };
  }

  /**
   * Transform CSV data to standard format
   */
  transformData(
    inputData: Record<string, unknown>[],
    sourceHeaders: string[]
  ): TransformationResult {
    const errors: TransformationError[] = [];
    const warnings: string[] = [];
    const transformedData: Record<string, unknown>[] = [];

    // Step 1: Detect column mappings
    const detectedMappings = this.detectColumnMappings(sourceHeaders);

    // Step 2: Transform each row
    inputData.forEach((row, rowIndex) => {
      const transformedRow: Record<string, unknown> = {};
      const rowErrors: TransformationError[] = [];

      // Initialize all output columns with default values
      OUTPUT_COLUMNS.forEach(col => {
        // Set default values based on column type
        if (
          [
            'qty',
            'bas_price',
            'ass_val',
            'c_gst',
            's_gst',
            'igst',
            'amot',
            'inv_val',
            'percentage',
          ].includes(col)
        ) {
          transformedRow[col] = 0; // Numeric fields default to 0
        } else {
          transformedRow[col] = ''; // Text fields default to empty string
        }
      });

      // Map each target column
      this.config.columnMappings.forEach(mapping => {
        const sourceColumn = detectedMappings[mapping.targetColumn];

        if (sourceColumn) {
          const value = row[sourceColumn];

          try {
            let transformedValue = value;

            // Apply transformation if defined
            if (mapping.transform) {
              transformedValue = mapping.transform(value, row);
            }

            // Ensure no null/undefined values - use defaults
            if (transformedValue === null || transformedValue === undefined) {
              if (
                [
                  'qty',
                  'bas_price',
                  'ass_val',
                  'c_gst',
                  's_gst',
                  'igst',
                  'amot',
                  'inv_val',
                  'percentage',
                ].includes(mapping.targetColumn)
              ) {
                transformedValue = 0;
              } else {
                transformedValue = '';
              }
            }

            transformedRow[mapping.targetColumn] = transformedValue;

            // Validate required fields
            if (
              mapping.required &&
              (transformedValue === null ||
                transformedValue === undefined ||
                transformedValue === '')
            ) {
              rowErrors.push({
                row: rowIndex + 1,
                column: mapping.targetColumn,
                message: `Required field is missing or invalid`,
                value: value,
              });
            }
          } catch (error) {
            rowErrors.push({
              row: rowIndex + 1,
              column: mapping.targetColumn,
              message: `Transformation error: ${error}`,
              value: value,
            });
          }
        } else if (mapping.required) {
          rowErrors.push({
            row: rowIndex + 1,
            column: mapping.targetColumn,
            message: `Required column not found in source data`,
            value: null,
          });
        }
      });

      // Calculate derived fields
      this.calculateDerivedFields(transformedRow, row, rowIndex, rowErrors);

      // Recalculate total invoice value for individual rows
      const assVal = parseNumber(transformedRow.ass_val) || 0;
      const cgst = parseNumber(transformedRow.c_gst) || 0;
      const sgst = parseNumber(transformedRow.s_gst) || 0;
      const igst = parseNumber(transformedRow.igst) || 0;
      const amot = parseNumber(transformedRow.amot) || 0;

      // Total invoice value = Assessable Value + CGST + SGST + IGST + Amortization
      transformedRow.inv_val = assVal + cgst + sgst + igst + amot;

      errors.push(...rowErrors);
      transformedData.push(transformedRow);
    });

    // Step 3: Group by invoice number and sum specified fields
    const groupedData = this.groupByInvoiceAndSum(transformedData);

    // Generate preview (first 10 rows)
    const preview = groupedData.slice(0, 10);

    // Check for missing year codes
    const missingYears = this.checkMissingYearCodes(groupedData);
    if (missingYears.length > 0) {
      warnings.push(`Missing year codes for years: ${missingYears.join(', ')}`);
    }

    return {
      success: errors.length === 0,
      data: groupedData,
      errors,
      warnings,
      mapping: detectedMappings,
      preview,
    };
  }

  /**
   * Export-level invoice splitting: Group by invoice_no and GST rate, split with suffixes
   */
  private groupByInvoiceAndSum(
    transformedRows: Record<string, unknown>[]
  ): Record<string, unknown>[] {
    console.log(
      'Starting export-level invoice splitting with',
      transformedRows.length,
      'rows'
    );

    // Step 1: Group rows by invoice_no
    const invoiceGroups = new Map<string, Record<string, unknown>[]>();
    const skippedRows: Record<string, unknown>[] = [];

    transformedRows.forEach((row, index) => {
      const invoiceNo = String(row.invno || '');
      if (!invoiceNo || invoiceNo.trim() === '') {
        console.log(
          `Skipping row ${index + 1}: no invoice number (invno: "${invoiceNo}")`
        );
        skippedRows.push({
          row: index + 1,
          reason: 'no_invoice_number',
          data: row,
        });
        return;
      }

      if (!invoiceGroups.has(invoiceNo)) {
        invoiceGroups.set(invoiceNo, []);
      }
      invoiceGroups.get(invoiceNo)!.push(row);
    });

    console.log(`Found ${invoiceGroups.size} unique invoices`);
    console.log(`Skipped ${skippedRows.length} rows:`, skippedRows);

    // Log all invoice numbers for debugging
    const invoiceNumbers = Array.from(invoiceGroups.keys()).sort();
    console.log('Invoice numbers found:', invoiceNumbers);

    // Step 2: Process each invoice group
    const processedRows: Record<string, unknown>[] = [];
    const invoiceMappingLog = new Map<string, string[]>(); // original_invoice_no → [generated_invoice_nos]

    for (const [originalInvoiceNo, rows] of invoiceGroups) {
      console.log(
        `Processing invoice ${originalInvoiceNo} with ${rows.length} rows`
      );

      // Step 2a: Group rows by GST rate within this invoice
      const gstGroups = this.groupRowsByGstRate(rows);
      console.log(
        `Invoice ${originalInvoiceNo} has ${gstGroups.size} GST rate groups`
      );

      if (gstGroups.size === 1) {
        // Single GST rate: emit unchanged (sum all rows)
        const singleGstRows = Array.from(gstGroups.values())[0];
        const summedRow = this.sumRowsForInvoice(
          singleGstRows,
          originalInvoiceNo
        );
        processedRows.push(summedRow);
        invoiceMappingLog.set(originalInvoiceNo, [originalInvoiceNo]);
        console.log(
          `Single GST invoice ${originalInvoiceNo}: summed ${singleGstRows.length} rows`
        );
      } else {
        // Multiple GST rates: split with suffixes
        const generatedInvoiceNos: string[] = [];
        const gstGroupsArray = Array.from(gstGroups.entries());

        // Sort groups by descending taxable value (ass_val)
        gstGroupsArray.sort((a, b) => {
          const aTotal = a[1].reduce(
            (sum, row) => sum + (parseNumber(row['ass_val']) || 0),
            0
          );
          const bTotal = b[1].reduce(
            (sum, row) => sum + (parseNumber(row['ass_val']) || 0),
            0
          );
          return bTotal - aTotal;
        });

        console.log(
          `Splitting invoice ${originalInvoiceNo} into ${gstGroupsArray.length} groups`
        );

        for (let i = 0; i < gstGroupsArray.length; i++) {
          const [gstRate, gstRows] = gstGroupsArray[i];
          let generatedInvoiceNo: string;

          if (i === 0) {
            // First group: keep original invoice number
            generatedInvoiceNo = originalInvoiceNo;
            console.log(
              `First group (GST ${gstRate}%): keeping original ${generatedInvoiceNo}`
            );
          } else {
            // Subsequent groups: add suffix (A, B, C...)
            generatedInvoiceNo = this.generateUniqueInvoiceNo(
              originalInvoiceNo,
              i,
              processedRows
            );
            console.log(
              `Subsequent group (GST ${gstRate}%): creating ${generatedInvoiceNo}`
            );
          }

          // Sum rows for this GST group
          const summedRow = this.sumRowsForInvoice(gstRows, generatedInvoiceNo);
          processedRows.push(summedRow);
          generatedInvoiceNos.push(generatedInvoiceNo);

          console.log(
            `Group ${i + 1}: ${generatedInvoiceNo} (GST ${gstRate}%) - ${gstRows.length} rows, ass_val: ${summedRow['ass_val']}`
          );
        }

        invoiceMappingLog.set(originalInvoiceNo, generatedInvoiceNos);
      }
    }

    // Step 3: Log the mapping and final count
    console.log('Invoice splitting mapping:');
    for (const [original, generated] of invoiceMappingLog) {
      if (generated.length > 1) {
        console.log(`  ${original} → [${generated.join(', ')}]`);
      } else {
        console.log(`  ${original} → ${generated[0]} (no split)`);
      }
    }

    console.log(
      `Export-level splitting result: ${processedRows.length} invoice records`
    );
    console.log(
      `Input invoices: ${invoiceGroups.size}, Output invoices: ${processedRows.length}`
    );

    // Check for any missing invoices
    if (invoiceGroups.size !== processedRows.length) {
      console.warn(
        `⚠️ Invoice count mismatch: Input ${invoiceGroups.size} → Output ${processedRows.length}`
      );
      const inputInvoices = Array.from(invoiceGroups.keys()).sort();
      const outputInvoices = processedRows.map(row => row.invno).sort();
      console.log('Input invoices:', inputInvoices);
      console.log('Output invoices:', outputInvoices);
    }

    return processedRows;
  }

  /**
   * Group rows by GST rate within an invoice
   */
  private groupRowsByGstRate(
    rows: Record<string, unknown>[]
  ): Map<number, Record<string, unknown>[]> {
    const gstGroups = new Map<number, Record<string, unknown>[]>();

    rows.forEach(row => {
      // Calculate GST rate from tax amounts
      const cgstAmt = parseNumber(row.c_gst) || 0;
      const sgstAmt = parseNumber(row.s_gst) || 0;
      const igstAmt = parseNumber(row['igst']) || 0;
      const assVal = parseNumber(row['ass_val']) || 0;

      let gstRate = 0;
      if (igstAmt > 0 && assVal > 0) {
        gstRate = Math.round((igstAmt / assVal) * 100 * 100) / 100;
      } else if ((cgstAmt > 0 || sgstAmt > 0) && assVal > 0) {
        gstRate = Math.round(((cgstAmt + sgstAmt) / assVal) * 100 * 100) / 100;
      }

      if (!gstGroups.has(gstRate)) {
        gstGroups.set(gstRate, []);
      }
      gstGroups.get(gstRate)!.push(row);
    });

    return gstGroups;
  }

  /**
   * Generate unique invoice number with suffix, avoiding collisions
   */
  private generateUniqueInvoiceNo(
    originalInvoiceNo: string,
    groupIndex: number,
    existingRows: Record<string, unknown>[]
  ): string {
    const suffixes = [
      'A',
      'B',
      'C',
      'D',
      'E',
      'F',
      'G',
      'H',
      'I',
      'J',
      'K',
      'L',
      'M',
      'N',
      'O',
      'P',
      'Q',
      'R',
      'S',
      'T',
      'U',
      'V',
      'W',
      'X',
      'Y',
      'Z',
    ];
    const suffix =
      suffixes[groupIndex - 1] || String.fromCharCode(65 + groupIndex - 1); // Fallback to ASCII

    let candidateInvoiceNo = `${originalInvoiceNo}${suffix}`;

    // Check for collisions in existing rows
    let collisionCount = 0;
    while (existingRows.some(row => row.invno === candidateInvoiceNo)) {
      collisionCount++;
      candidateInvoiceNo = `${originalInvoiceNo}${suffix}${collisionCount}`;
    }

    return candidateInvoiceNo;
  }

  /**
   * Sum multiple rows into a single invoice row
   */
  private sumRowsForInvoice(
    rows: Record<string, unknown>[],
    invoiceNo: string
  ): Record<string, unknown> {
    if (rows.length === 0) {
      throw new Error('Cannot sum empty rows array');
    }

    // Use first row as template
    const template = { ...rows[0] };
    template.invno = invoiceNo;

    // Sum numeric fields (excluding inv_val which will be recalculated)
    const numericFields = [
      'qty',
      'bas_price',
      'ass_val',
      'c_gst',
      's_gst',
      'igst',
      'amot',
    ];

    numericFields.forEach(field => {
      const sum = rows.reduce((total, row) => {
        return total + (parseNumber(row[field]) || 0);
      }, 0);
      template[field] = sum;
    });

    // Recalculate total invoice value as sum of assessable value + all taxes
    const assVal = parseNumber(template.ass_val) || 0;
    const cgst = parseNumber(template.c_gst) || 0;
    const sgst = parseNumber(template.s_gst) || 0;
    const igst = parseNumber(template.igst) || 0;
    const amot = parseNumber(template.amot) || 0;

    // Total invoice value = Assessable Value + CGST + SGST + IGST + Amortization
    template.inv_val = assVal + cgst + sgst + igst + amot;

    // Recalculate derived fields
    const igstFlags = calculateIGSTFlags(template);
    template.igst_yes_no = igstFlags.igst_yes_no;
    template.percentage = igstFlags.percentage;

    // Ensure no blank cells
    OUTPUT_COLUMNS.forEach(col => {
      if (template[col] === null || template[col] === undefined) {
        if (
          numericFields.includes(col) ||
          col === 'inv_val' ||
          col === 'percentage'
        ) {
          template[col] = 0;
        } else {
          template[col] = '';
        }
      }
    });

    console.log(
      `Summed ${rows.length} rows for invoice ${invoiceNo}: ass_val=${template['ass_val']}, inv_val=${template['inv_val']}`
    );

    return template;
  }

  /**
   * Detect column mappings from source headers
   */
  private detectColumnMappings(
    sourceHeaders: string[]
  ): Record<string, string> {
    const mappings: Record<string, string> = {};

    this.config.columnMappings.forEach(mapping => {
      const bestMatch = findBestMatch(
        mapping.targetColumn,
        sourceHeaders,
        mapping
      );
      if (bestMatch) {
        mappings[mapping.targetColumn] = bestMatch;
      }
    });

    return mappings;
  }

  /**
   * Calculate derived fields (RE, IGST flags, etc.)
   */
  private calculateDerivedFields(
    transformedRow: Record<string, unknown>,
    _originalRow: Record<string, unknown>,
    rowIndex: number,
    errors: TransformationError[]
  ): void {
    try {
      // Calculate RE code
      if (transformedRow.inv_date) {
        const reCode = generateRECode(
          String(transformedRow.inv_date),
          this.config.yearMap
        );
        transformedRow.RE = reCode;

        if (reCode === 'year_code_missing') {
          errors.push({
            row: rowIndex + 1,
            column: 'RE',
            message: 'Year code missing in year map',
            value: transformedRow.inv_date,
          });
        }
      }

      // Calculate IGST flags and percentage
      const igstFlags = calculateIGSTFlags(transformedRow);
      transformedRow.igst_yes_no = igstFlags.igst_yes_no;
      transformedRow.percentage = igstFlags.percentage;
    } catch (error) {
      errors.push({
        row: rowIndex + 1,
        column: 'derived_fields',
        message: `Error calculating derived fields: ${error}`,
        value: null,
      });
    }
  }

  /**
   * Check for missing year codes in the data
   */
  private checkMissingYearCodes(data: Record<string, unknown>[]): number[] {
    const years = new Set<number>();

    data.forEach(row => {
      if (row.inv_date) {
        const date = new Date(String(row.inv_date));
        if (!isNaN(date.getTime())) {
          years.add(date.getFullYear());
        }
      }
    });

    return Array.from(years).filter(year => !this.config.yearMap[year]);
  }

  /**
   * Update year map configuration
   */
  updateYearMap(yearMap: Record<number, string>): void {
    this.config.yearMap = { ...this.config.yearMap, ...yearMap };
  }

  /**
   * Update column mappings
   */
  updateColumnMappings(mappings: ColumnMapping[]): void {
    this.config.columnMappings = mappings;
  }

  /**
   * Get current configuration
   */
  getConfig(): TransformationConfig {
    return { ...this.config };
  }

  /**
   * Validate transformation configuration
   */
  validateConfig(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check year map
    if (!this.config.yearMap || Object.keys(this.config.yearMap).length === 0) {
      errors.push('Year map is required');
    }

    // Check column mappings
    if (
      !this.config.columnMappings ||
      this.config.columnMappings.length === 0
    ) {
      errors.push('Column mappings are required');
    }

    // Check required columns
    const requiredColumns = this.config.columnMappings.filter(m => m.required);
    const requiredTargets = requiredColumns.map(m => m.targetColumn);

    if (!requiredTargets.includes('cust_code')) {
      errors.push('cust_code mapping is required');
    }
    if (!requiredTargets.includes('inv_date')) {
      errors.push('inv_date mapping is required');
    }
    if (!requiredTargets.includes('invno')) {
      errors.push('invno mapping is required');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Export transformed data to CSV with exact header format
   */
  exportToCSV(data: Record<string, unknown>[]): string {
    if (data.length === 0) return '';

    // Use the exact header format specified
    const headers = OUTPUT_COLUMNS;

    const csvRows = [
      headers.join(','),
      ...data.map(row =>
        headers
          .map(header => {
            let value = row[header];
            // Ensure no blank cells - use appropriate defaults
            if (value === null || value === undefined) {
              if (
                [
                  'qty',
                  'bas_price',
                  'ass_val',
                  'c_gst',
                  's_gst',
                  'igst',
                  'amot',
                  'inv_val',
                  'percentage',
                ].includes(header)
              ) {
                value = 0;
              } else {
                value = '';
              }
            }
            if (
              typeof value === 'string' &&
              (value.includes(',') || value.includes('"'))
            ) {
              return `"${value.replace(/"/g, '""')}"`;
            }
            return value;
          })
          .join(',')
      ),
    ];

    return csvRows.join('\n');
  }

  /**
   * Export transformed data to Excel format
   */
  exportToExcel(data: Record<string, unknown>[]): Record<string, unknown>[] {
    if (data.length === 0) return [];

    // Use the exact header format specified
    const headers = OUTPUT_COLUMNS;

    return data.map(row => {
      const excelRow: Record<string, unknown> = {};
      headers.forEach(header => {
        // Ensure no blank cells - use appropriate defaults
        if (row[header] === null || row[header] === undefined) {
          if (
            [
              'qty',
              'bas_price',
              'ass_val',
              'c_gst',
              's_gst',
              'igst',
              'amot',
              'inv_val',
              'percentage',
            ].includes(header)
          ) {
            excelRow[header] = 0;
          } else {
            excelRow[header] = '';
          }
        } else {
          excelRow[header] = row[header];
        }
      });
      return excelRow;
    });
  }
}
