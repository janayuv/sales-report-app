/**
 * Utility functions for file operations
 */

import * as XLSX from 'xlsx';

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

export const downloadExcelFile = (
  data: Record<string, unknown>[],
  filename: string,
  sheetName: string = 'Sheet1'
) => {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], {
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

export const downloadFormattedExcel = (
  data: Record<string, unknown>[],
  filename: string,
  sheetName: string = 'Sales Reports',
  includeSummary: boolean = true
) => {
  const worksheet = XLSX.utils.json_to_sheet(data);

  // Add formatting if we have data
  if (data.length > 0) {
    // Set column widths
    const colWidths = Object.keys(data[0]).map(key => ({
      wch: Math.max(key.length, 15),
    }));
    worksheet['!cols'] = colWidths;

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

      // Add summary row at the end
      const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
      const summaryRowIndex = range.e.r + 2; // Add after data with one empty row

      Object.keys(summaryRow).forEach((key, colIndex) => {
        const cellAddress = XLSX.utils.encode_cell({
          r: summaryRowIndex,
          c: colIndex,
        });
        worksheet[cellAddress] = {
          v: (summaryRow as Record<string, unknown>)[key],
          t: 's',
        };
      });
    }
  }

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], {
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

export const readExcelFile = (
  file: File
): Promise<Record<string, unknown>[]> => {
  return new Promise((resolve, reject) => {
    console.log('Starting to read Excel file:', file.name, 'Size:', file.size);

    const reader = new FileReader();
    reader.onload = e => {
      try {
        console.log('File read completed, parsing Excel data...');
        const data = e.target?.result;

        if (!data) {
          reject(new Error('No data received from file'));
          return;
        }

        const workbook = XLSX.read(data, { type: 'binary' });
        console.log('Workbook parsed, sheet names:', workbook.SheetNames);

        if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
          reject(new Error('No sheets found in Excel file'));
          return;
        }

        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        if (!worksheet) {
          reject(new Error(`Sheet "${sheetName}" not found`));
          return;
        }

        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        console.log('JSON data extracted, rows:', jsonData.length);

        if (jsonData.length < 2) {
          reject(
            new Error(
              'Excel file must contain at least a header row and one data row'
            )
          );
          return;
        }

        // Convert to object format
        const headers = jsonData[0] as string[];
        const rows = jsonData.slice(1) as unknown[][];

        const result = rows.map(row => {
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

        console.log(
          'Excel file processed successfully, records:',
          result.length
        );
        resolve(result);
      } catch (error) {
        console.error('Error parsing Excel file:', error);
        reject(new Error(`Failed to parse Excel file: ${error}`));
      }
    };
    reader.onerror = () => {
      console.error('FileReader error occurred');
      reject(new Error('Failed to read Excel file'));
    };
    reader.readAsBinaryString(file);
  });
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
