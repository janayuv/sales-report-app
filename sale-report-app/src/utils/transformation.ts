/**
 * Data transformation utilities for import mapping
 */

export interface TransformationConfig {
  yearMap: Record<number, string>;
  columnMappings: ColumnMapping[];
  synonyms: Record<string, string[]>;
}

export interface ColumnMapping {
  targetColumn: string;
  sourceColumns: string[];
  transform?: (value: unknown, row: Record<string, unknown>) => unknown;
  required?: boolean;
}

export interface TransformationResult {
  success: boolean;
  data: Record<string, unknown>[];
  errors: TransformationError[];
  warnings: string[];
  mapping: Record<string, string>;
  preview: Record<string, unknown>[];
}

export interface TransformationError {
  row: number;
  column: string;
  message: string;
  value: unknown;
}

export interface YearMapConfig {
  [year: number]: string;
}

// Standard output columns in the exact order specified
export const OUTPUT_COLUMNS = [
  'cust_code',
  'cust_name',
  'inv_date',
  'RE',
  'invno',
  'part_code',
  'part_name',
  'tariff',
  'qty',
  'bas_price',
  'ass_val',
  'c_gst',
  's_gst',
  'igst',
  'amot',
  'inv_val',
  'igst_yes_no',
  'percentage',
] as const;

// Month code mapping
export const MONTH_CODES: Record<number, string> = {
  1: 'A', // Jan
  2: 'B', // Feb
  3: 'C', // Mar
  4: 'D', // Apr
  5: 'E', // May
  6: 'F', // Jun
  7: 'G', // Jul
  8: 'H', // Aug
  9: 'I', // Sep
  10: 'J', // Oct
  11: 'K', // Nov
  12: 'L', // Dec
};

// Default column mappings for Excel format based on your requirements
export const DEFAULT_COLUMN_MAPPINGS: ColumnMapping[] = [
  {
    targetColumn: 'cust_code',
    sourceColumns: ['cust_cde', 'customer_code', 'cust_code', 'custcode'],
    required: true,
  },
  {
    targetColumn: 'cust_name',
    sourceColumns: ['cust_name', 'customer_name', 'client_name', 'custname'],
    required: false,
  },
  {
    targetColumn: 'inv_date',
    sourceColumns: [
      'io_date',
      'invoice_date',
      'inv_date',
      'date',
      'invoicedate',
    ],
    transform: (value: unknown) => parseDate(value),
    required: true,
  },
  {
    targetColumn: 'invno',
    sourceColumns: ['invno', 'invoice_number', 'invoiceno'],
    required: true,
  },
  {
    targetColumn: 'part_code',
    sourceColumns: [
      'prod_cde',
      'prod_cust_no',
      'part_code',
      'product_code',
      'prodcode',
    ],
    required: false,
  },
  {
    targetColumn: 'part_name',
    sourceColumns: ['prod_name_ko', 'part_name', 'product_name', 'prodname'],
    required: false,
  },
  {
    targetColumn: 'tariff',
    sourceColumns: ['tariff_code', 'tariff', 'hs_code', 'tariffcode'],
    required: false,
  },
  {
    targetColumn: 'qty',
    sourceColumns: ['io_qty', 'qty', 'quantity', 'ioqty'],
    transform: (value: unknown) => parseNumber(value),
    required: false,
  },
  {
    targetColumn: 'bas_price',
    sourceColumns: [
      'rate_pre_unit',
      'bas_price',
      'base_price',
      'unit_price',
      'ratepreunit',
    ],
    transform: (value: unknown) => parseNumber(value),
    required: false,
  },
  {
    targetColumn: 'ass_val',
    sourceColumns: [
      'assessable_value',
      'ass_val',
      'assessable',
      'assessablevalue',
    ],
    transform: (value: unknown) => parseNumber(value),
    required: false,
  },
  {
    targetColumn: 'c_gst',
    sourceColumns: ['cgst_amt', 'c_gst', 'cgst', 'cgstamt'],
    transform: (value: unknown) => parseNumber(value),
    required: false,
  },
  {
    targetColumn: 's_gst',
    sourceColumns: ['sgst_amt', 's_gst', 'sgst', 'sgstamt'],
    transform: (value: unknown) => parseNumber(value),
    required: false,
  },
  {
    targetColumn: 'igst',
    sourceColumns: ['igst_amt', 'igst', 'igstamt'],
    transform: (value: unknown) => parseNumber(value),
    required: false,
  },
  {
    targetColumn: 'amot',
    sourceColumns: [
      'amortisation_cost',
      'amot',
      'amortization',
      'amortisationcost',
      'Total_Amorization',
    ],
    transform: (value: unknown) => parseNumber(value),
    required: false,
  },
  {
    targetColumn: 'inv_val',
    sourceColumns: [
      'total_inv_value',
      'invoice_total',
      'grand_total',
      'inv_val',
      'totalinvvalue',
      'grandtotal',
      'Total_Inv_Value',
    ],
    transform: (value: unknown) => parseNumber(value),
    required: false,
  },
];

// Default year map
export const DEFAULT_YEAR_MAP: YearMapConfig = {
  2025: 'R',
  2024: 'Q',
  2023: 'P',
  2022: 'O',
  2021: 'N',
};

/**
 * Normalize header names for consistent matching
 */
export function normalizeHeader(header: string): string {
  return header
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '');
}

/**
 * Parse date string to ISO format (YYYY-MM-DD)
 * Handles DD/MM/YYYY format as specified in your requirements
 */
export function parseDate(dateStr: unknown): string | null {
  if (!dateStr) return null;

  const str = String(dateStr).trim();
  if (!str) return null;

  // Try different date formats - prioritize DD/MM/YYYY as per your example
  const formats = [
    { regex: /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/, isDDMM: true }, // DD/MM/YYYY (your preferred format)
    { regex: /^(\d{4})-(\d{1,2})-(\d{1,2})$/, isDDMM: false }, // YYYY-MM-DD
    { regex: /^(\d{1,2})-(\d{1,2})-(\d{4})$/, isDDMM: true }, // DD-MM-YYYY
  ];

  for (const format of formats) {
    const match = str.match(format.regex);
    if (match) {
      let day, month, year;

      if (format.isDDMM) {
        // DD/MM/YYYY or DD-MM-YYYY format
        [, day, month, year] = match;
      } else {
        // YYYY-MM-DD format
        [, year, month, day] = match;
      }

      const parsedYear = parseInt(year);
      const parsedMonth = parseInt(month);
      const parsedDay = parseInt(day);

      // Validate date components
      if (parsedYear < 1900 || parsedYear > 2100) continue;
      if (parsedMonth < 1 || parsedMonth > 12) continue;
      if (parsedDay < 1 || parsedDay > 31) continue;

      const date = new Date(parsedYear, parsedMonth - 1, parsedDay);
      if (
        !isNaN(date.getTime()) &&
        date.getFullYear() === parsedYear &&
        date.getMonth() === parsedMonth - 1 &&
        date.getDate() === parsedDay
      ) {
        // Format as YYYY-MM-DD manually to avoid timezone issues
        const year = parsedYear.toString();
        const month = parsedMonth.toString().padStart(2, '0');
        const day = parsedDay.toString().padStart(2, '0');
        return `${year}-${month}-${day}`;
      }
    }
  }

  return null;
}

/**
 * Parse number, removing commas and handling various formats
 * Enhanced to handle Indian number formats and currency symbols
 */
export function parseNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;

  const str = String(value).trim();
  if (!str) return null;

  // Remove currency symbols, commas, and spaces
  let cleaned = str
    .replace(/[₹$€£¥]/g, '') // Remove currency symbols
    .replace(/[,\s]/g, '') // Remove commas and spaces
    .replace(/[^\d.-]/g, ''); // Keep only digits, decimal point, and minus sign

  // Handle negative numbers in parentheses (accounting format)
  if (str.includes('(') && str.includes(')')) {
    cleaned = '-' + cleaned.replace(/[()]/g, '');
  }

  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}

/**
 * Generate RE code from date and year map
 */
export function generateRECode(
  dateStr: string,
  yearMap: YearMapConfig
): string {
  if (!dateStr) return '';

  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '';

  const year = date.getFullYear();
  const month = date.getMonth() + 1; // JavaScript months are 0-based

  const yearCode = yearMap[year];
  if (!yearCode) {
    return 'year_code_missing';
  }

  const monthCode = MONTH_CODES[month];
  if (!monthCode) {
    return 'month_code_missing';
  }

  return yearCode + monthCode;
}

/**
 * Calculate IGST flag and percentage according to your requirements
 */
export function calculateIGSTFlags(row: Record<string, unknown>): {
  igst_yes_no: string;
  percentage: number | null;
} {
  const igstAmt = parseNumber(row.igst) || 0;
  const igstRate = parseNumber(row.igst_rate) || 0;
  const cgstRate = parseNumber(row.cgst_rate) || 0;
  const sgstRate = parseNumber(row.sgst_rate) || 0;
  const assVal = parseNumber(row.ass_val) || 0;

  // IGST flag: 'yes' if IGST_RATE>0 or IGST_AMT>0 else 'no'
  const igstYesNo = igstAmt > 0 || igstRate > 0 ? 'yes' : 'no';

  let percentage: number | null = null;

  if (igstYesNo === 'yes') {
    // If IGST, use IGST_RATE
    percentage = igstRate || null;
  } else {
    // If not IGST, use CGST_RATE + SGST_RATE if present
    if (cgstRate > 0 || sgstRate > 0) {
      percentage = cgstRate + sgstRate;
    } else if (assVal > 0) {
      // Otherwise compute from tax amounts / ass_val
      const cgstAmt = parseNumber(row.c_gst) || 0;
      const sgstAmt = parseNumber(row.s_gst) || 0;
      const totalTax = cgstAmt + sgstAmt;
      if (totalTax > 0) {
        percentage = Math.round((totalTax / assVal) * 100 * 100) / 100; // Round to 2 decimal places
      }
    }
  }

  return { igst_yes_no: igstYesNo, percentage };
}

/**
 * Find best matching column from source headers with improved matching
 */
export function findBestMatch(
  _targetColumn: string,
  sourceHeaders: string[],
  mapping: ColumnMapping
): string | null {
  const normalizedHeaders = sourceHeaders.map(h => normalizeHeader(h));

  // First try exact matches from sourceColumns
  for (const sourceCol of mapping.sourceColumns) {
    const normalizedSource = normalizeHeader(sourceCol);
    const index = normalizedHeaders.indexOf(normalizedSource);
    if (index !== -1) {
      return sourceHeaders[index];
    }
  }

  // Then try partial matches
  for (const sourceCol of mapping.sourceColumns) {
    const normalizedSource = normalizeHeader(sourceCol);
    for (let i = 0; i < normalizedHeaders.length; i++) {
      if (
        normalizedHeaders[i].includes(normalizedSource) ||
        normalizedSource.includes(normalizedHeaders[i])
      ) {
        return sourceHeaders[i];
      }
    }
  }

  return null;
}

/**
 * Validate a single row of transformed data
 */
export function validateRow(
  row: Record<string, unknown>,
  rowIndex: number
): TransformationError[] {
  const errors: TransformationError[] = [];

  // Required field validation - check source fields
  const requiredFieldMappings = [
    { target: 'cust_code', sources: ['cust_cde'] },
    { target: 'inv_date', sources: ['IO_DATE'] },
    { target: 'invno', sources: ['Invno'] },
  ];

  requiredFieldMappings.forEach(mapping => {
    let hasValue = false;
    for (const sourceField of mapping.sources) {
      const value = row[sourceField];
      if (value !== null && value !== undefined && value !== '') {
        hasValue = true;
        break;
      }
    }
    if (!hasValue) {
      errors.push({
        row: rowIndex + 1,
        column: mapping.target,
        message: `Required field '${mapping.target}' is missing (checked: ${mapping.sources.join(', ')})`,
        value: null,
      });
    }
  });

  // Date validation - check IO_DATE source field
  if (row.IO_DATE && typeof row.IO_DATE === 'string') {
    const date = new Date(row.IO_DATE);
    if (isNaN(date.getTime())) {
      errors.push({
        row: rowIndex + 1,
        column: 'inv_date',
        message: `Invalid date format in IO_DATE: ${row.IO_DATE}`,
        value: row.IO_DATE,
      });
    }
  }

  // Numeric field validation - check source fields
  const numericFieldMappings = [
    { target: 'qty', sources: ['io_qty'] },
    { target: 'bas_price', sources: ['rate_pre_unit'] },
    { target: 'ass_val', sources: ['ASSESSABLE_VALUE'] },
    { target: 'c_gst', sources: ['CGST_AMT'] },
    { target: 's_gst', sources: ['SGST_AMT'] },
    { target: 'igst', sources: ['IGST_AMT'] },
    { target: 'amot', sources: ['Amortisation_cost', 'Total_Amorization'] },
    {
      target: 'inv_val',
      sources: ['Total_Inv_Value', 'invoice_Total', 'Grand_total'],
    },
    { target: 'percentage', sources: ['CGST_RATE', 'SGST_RATE', 'IGST_RATE'] },
  ];

  numericFieldMappings.forEach(mapping => {
    for (const sourceField of mapping.sources) {
      const value = row[sourceField];
      if (value !== null && value !== undefined && value !== '') {
        const numValue = parseNumber(value);
        if (numValue === null || isNaN(numValue)) {
          errors.push({
            row: rowIndex + 1,
            column: mapping.target,
            message: `Invalid numeric value for '${sourceField}': ${value}`,
            value: value,
          });
        }
        break; // Only check the first available source field
      }
    }
  });

  return errors;
}

/**
 * Create a preset configuration for common data formats
 */
export function createPresetConfig(
  presetName: string
): Partial<TransformationConfig> {
  const presets: Record<string, Partial<TransformationConfig>> = {
    indian_export: {
      yearMap: DEFAULT_YEAR_MAP,
      columnMappings: DEFAULT_COLUMN_MAPPINGS,
      synonyms: {
        customer: ['cust', 'client', 'buyer'],
        invoice: ['inv', 'bill'],
        product: ['prod', 'item', 'part'],
        quantity: ['qty', 'qnty'],
        amount: ['amt', 'value', 'val'],
      },
    },
    basic: {
      yearMap: { [new Date().getFullYear()]: 'A' },
      columnMappings: DEFAULT_COLUMN_MAPPINGS.filter(m => m.required),
      synonyms: {},
    },
  };

  return presets[presetName] || presets['basic'];
}
