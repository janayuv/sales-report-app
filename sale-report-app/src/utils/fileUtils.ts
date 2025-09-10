/**
 * Utility functions for file operations
 */

import * as ExcelJS from 'exceljs';

export const downloadFile = (
  content: string,
  filename: string,
  mimeType: string = 'text/csv'
) => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
};

export const downloadExcelFile = async (
  data: Record<string, unknown>[],
  filename: string,
  sheetName: string = 'Sheet1'
) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(sheetName);

  if (data.length > 0) {
    // Add headers
    const headers = Object.keys(data[0]);
    worksheet.addRow(headers);

    // Add data rows
    data.forEach(row => {
      const values = headers.map(header => row[header] || '');
      worksheet.addRow(values);
    });

    // Style the header row
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' },
    };
  }

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
};

export const downloadCSVFile = (
  data: Record<string, unknown>[],
  filename: string
) => {
  if (data.length === 0) {
    throw new Error('No data to export');
  }

  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row =>
      headers
        .map(header => {
          const value = row[header];
          // Escape CSV values that contain commas, quotes, or newlines
          if (
            typeof value === 'string' &&
            (value.includes(',') || value.includes('"') || value.includes('\n'))
          ) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value || '';
        })
        .join(',')
    ),
  ].join('\n');

  downloadFile(csvContent, filename, 'text/csv');
};

export const downloadJSONFile = (
  data: Record<string, unknown>[],
  filename: string
) => {
  const jsonContent = JSON.stringify(data, null, 2);
  downloadFile(jsonContent, filename, 'application/json');
};

export const downloadPDFFile = (
  data: Record<string, unknown>[],
  filename: string,
  title: string = 'Sales Reports'
) => {
  // For PDF generation, we'll use a simple HTML to PDF approach
  // In a real application, you might want to use a library like jsPDF or Puppeteer

  const headers = Object.keys(data[0] || {});

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${title}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        h1 { color: #333; text-align: center; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; font-weight: bold; }
        tr:nth-child(even) { background-color: #f9f9f9; }
        .summary { margin: 20px 0; padding: 15px; background-color: #f0f8ff; border-radius: 5px; }
      </style>
    </head>
    <body>
      <h1>${title}</h1>
      <div class="summary">
        <h3>Summary</h3>
        <p><strong>Total Records:</strong> ${data.length}</p>
        <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
      </div>
      <table>
        <thead>
          <tr>
            ${headers.map(header => `<th>${header}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${data
            .map(
              row =>
                `<tr>${headers.map(header => `<td>${row[header] || ''}</td>`).join('')}</tr>`
            )
            .join('')}
        </tbody>
      </table>
    </body>
    </html>
  `;

  // Create a blob and download
  const blob = new Blob([htmlContent], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename.replace('.pdf', '.html'); // Download as HTML for now
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const downloadFormattedExcel = async (
  data: Record<string, unknown>[],
  filename: string,
  sheetName: string = 'Sales Reports',
  includeSummary: boolean = true
) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(sheetName);

  if (data.length > 0) {
    const headers = Object.keys(data[0]);

    // Add headers
    worksheet.addRow(headers);

    // Add data rows
    data.forEach(row => {
      const values = headers.map(header => row[header] || '');
      worksheet.addRow(values);
    });

    // Set column widths
    headers.forEach((header, index) => {
      const column = worksheet.getColumn(index + 1);
      column.width = Math.max(header.length, 15);
    });

    // Style the header row
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' },
    };

    // Add summary row if requested
    if (includeSummary) {
      const summaryRow = {
        Customer: 'SUMMARY',
        'Invoice No': '',
        Date: '',
        'Assessable Value': data.reduce(
          (sum, row) => sum + (Number(row.ass_val) || 0),
          0
        ),
        CGST: data.reduce((sum, row) => sum + (Number(row.c_gst) || 0), 0),
        SGST: data.reduce((sum, row) => sum + (Number(row.s_gst) || 0), 0),
        IGST: data.reduce((sum, row) => sum + (Number(row.igst) || 0), 0),
        'Invoice Total': data.reduce(
          (sum, row) => sum + (Number(row.inv_val) || 0),
          0
        ),
        Actions: '',
      };

      // Add empty row
      worksheet.addRow([]);

      // Add summary row
      const summaryValues = headers.map(
        header => (summaryRow as Record<string, unknown>)[header] || ''
      );
      const summaryRowIndex = worksheet.addRow(summaryValues);

      // Style summary row
      summaryRowIndex.font = { bold: true };
      summaryRowIndex.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFFFE0B2' },
      };
    }
  }

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
};

export const readFileAsText = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => {
      if (e.target?.result) {
        resolve(e.target.result as string);
      } else {
        reject(new Error('Failed to read file'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
};

export const readCSVFile = (file: File): Promise<Record<string, unknown>[]> => {
  return new Promise((resolve, reject) => {
    console.log('Starting to read CSV file:', file.name, 'Size:', file.size);

    const reader = new FileReader();
    reader.onload = e => {
      try {
        console.log('CSV file read completed, parsing data...');
        const content = e.target?.result as string;

        if (!content) {
          reject(new Error('No content received from CSV file'));
          return;
        }

        // Split into lines and filter out empty lines
        const lines = content
          .split('\n')
          .filter(line => line.trim().length > 0);

        if (lines.length < 2) {
          reject(
            new Error(
              'CSV file must contain at least a header row and one data row'
            )
          );
          return;
        }

        // Parse CSV manually (simple approach)
        const parseCSVLine = (line: string): string[] => {
          const result: string[] = [];
          let current = '';
          let inQuotes = false;

          for (let i = 0; i < line.length; i++) {
            const char = line[i];

            if (char === '"') {
              inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
              result.push(current.trim());
              current = '';
            } else {
              current += char;
            }
          }

          result.push(current.trim());
          return result;
        };

        // Parse header row
        const headers = parseCSVLine(lines[0]);
        console.log('CSV headers parsed:', headers);

        // Parse data rows
        const dataRows = lines.slice(1).map(line => parseCSVLine(line));
        console.log('CSV data rows parsed:', dataRows.length);

        // Convert to object format
        const result = dataRows.map(row => {
          const obj: Record<string, unknown> = {};
          headers.forEach((header, index) => {
            let value = row[index] || '';

            // Clean the value if it's a string
            if (typeof value === 'string') {
              // Remove currency symbols
              value = value.replace(/[₹$€£¥]/g, '');

              // Replace line breaks with spaces and normalize whitespace
              value = value.replace(/\r?\n/g, ' ').replace(/\s+/g, ' ').trim();
            }

            obj[header] = value;
          });
          return obj;
        });

        console.log('CSV file processed successfully, records:', result.length);
        resolve(result);
      } catch (error) {
        console.error('Error parsing CSV file:', error);
        reject(new Error(`Failed to parse CSV file: ${error}`));
      }
    };
    reader.onerror = () => {
      console.error('FileReader error occurred for CSV');
      reject(new Error('Failed to read CSV file'));
    };
    reader.readAsText(file);
  });
};

export const readExcelFile = async (
  file: File
): Promise<Record<string, unknown>[]> => {
  console.log('Starting to read Excel file:', file.name, 'Size:', file.size);

  try {
    const workbook = new ExcelJS.Workbook();
    const buffer = await file.arrayBuffer();

    await workbook.xlsx.load(buffer);
    console.log(
      'Workbook parsed, sheet names:',
      workbook.worksheets.map(ws => ws.name)
    );

    if (workbook.worksheets.length === 0) {
      throw new Error('No sheets found in Excel file');
    }

    const worksheet = workbook.worksheets[0];
    console.log('Using worksheet:', worksheet.name);

    const rows: unknown[][] = [];
    worksheet.eachRow(row => {
      const rowValues = row.values as unknown[];
      // Remove the first element (index 0) as ExcelJS includes it for row numbers
      rows.push(rowValues.slice(1));
    });

    console.log('Excel data extracted, rows:', rows.length);

    if (rows.length < 2) {
      throw new Error(
        'Excel file must contain at least a header row and one data row'
      );
    }

    // Convert to object format
    const headers = rows[0] as string[];
    const dataRows = rows.slice(1);

    const result = dataRows.map(row => {
      const obj: Record<string, unknown> = {};
      headers.forEach((header, index) => {
        let value: unknown = row[index] || '';

        // Clean the value if it's a string
        if (typeof value === 'string') {
          // Remove currency symbols
          value = (value as string).replace(/[₹$€£¥]/g, '');

          // Replace line breaks with spaces and normalize whitespace
          value = (value as string)
            .replace(/\r?\n/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
        } else if (typeof value !== 'string' && typeof value !== 'number') {
          // Convert other types to string
          value = String(value);
        }

        obj[header] = value;
      });
      return obj;
    });

    console.log('Excel file processed successfully, records:', result.length);
    return result;
  } catch (error) {
    console.error('Error parsing Excel file:', error);
    throw new Error(`Failed to parse Excel file: ${error}`);
  }
};

export const selectFile = (
  accept: string = '.xlsx,.xls'
): Promise<File | null> => {
  return new Promise(resolve => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = accept;
    input.onchange = e => {
      const file = (e.target as HTMLInputElement).files?.[0] || null;
      console.log('File selected:', file?.name, file?.size);
      resolve(file);
    };
    input.onerror = () => {
      console.error('Error selecting file');
      resolve(null);
    };
    input.oncancel = () => {
      console.log('File selection cancelled');
      resolve(null);
    };
    console.log('Opening file dialog...');
    input.click();
  });
};
