/**
 * Import Transform Table Component
 * Dedicated table view for import with transformation data
 */

import React, { useState } from 'react';
import { useCompanyContext } from '../contexts/CompanyContext';
import { dbManager } from '../utils/database';
import { Upload, Download, Eye, Check, AlertTriangle, X } from 'lucide-react';
import {
  downloadExcelFile,
  selectFile,
  readExcelFile,
} from '../utils/fileUtils';
import { showToast } from './Toast';
import type { TransformationResult } from '../utils/transformation';

interface ImportTransformTableProps {
  onImportComplete?: (count: number) => void;
}

export const ImportTransformTable: React.FC<ImportTransformTableProps> = ({
  onImportComplete,
}) => {
  const { selectedCompany } = useCompanyContext();

  // State for import transformation
  const [importData, setImportData] = useState<Record<string, unknown>[]>([]);
  const [importHeaders, setImportHeaders] = useState<string[]>([]);
  const [transformationResult, setTransformationResult] =
    useState<TransformationResult | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);

  const handleFileUpload = async () => {
    if (!selectedCompany) {
      showToast.error('Please select a company first.');
      return;
    }

    try {
      const file = await selectFile('.xlsx,.xls');
      if (!file) return;

      // Validate file type
      const fileName = file.name.toLowerCase();
      if (!fileName.endsWith('.xlsx') && !fileName.endsWith('.xls')) {
        showToast.error('Please select an Excel file (.xlsx or .xls).');
        return;
      }

      setLoading(true);
      const excelData = await readExcelFile(file);

      // Basic validation of Excel content
      if (!excelData || excelData.length === 0) {
        showToast.error('The selected file is empty.');
        return;
      }

      if (excelData.length < 1) {
        showToast.error('Excel file must contain at least one data row.');
        return;
      }

      // Extract headers from the first row
      const headers = Object.keys(excelData[0]);
      const data = excelData;

      console.log('Parsed Excel data:', { headers, dataCount: data.length });

      setImportData(data);
      setImportHeaders(headers);
      setTransformationResult(null);
      setShowPreview(false);

      showToast.success(
        `File uploaded successfully! ${data.length} rows loaded.`
      );
    } catch (error) {
      console.error('Failed to parse Excel file:', error);
      showToast.error(
        'Failed to parse Excel file. Please check the file format and try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleTransformPreview = async () => {
    if (!selectedCompany || importData.length === 0) {
      showToast.error('No data to preview.');
      return;
    }

    try {
      setProcessing(true);

      // Use transformation engine to preview the data
      const { TransformationEngine } = await import(
        '../utils/transformationEngine'
      );
      const engine = new TransformationEngine();

      const result = engine.transformData(importData, importHeaders);
      setTransformationResult(result);
      setShowPreview(true);

      if (result.success) {
        showToast.success(
          `Transformation completed successfully! ${result.data.length} rows processed.`
        );
      } else {
        showToast.warning(
          `Transformation completed with ${result.errors.length} errors. Please review.`
        );
      }
    } catch (error) {
      console.error('Failed to generate preview:', error);
      showToast.error('Failed to generate preview. Please check your data.');
    } finally {
      setProcessing(false);
    }
  };

  const handleImportData = async () => {
    if (
      !selectedCompany ||
      !transformationResult ||
      !transformationResult.success
    ) {
      showToast.error('No valid transformation result to import.');
      return;
    }

    try {
      const toastId = showToast.loading('Importing transformed data...');
      setLoading(true);

      // Convert transformed data to CSV format for import
      const csvContent = generateCSVForImport(transformationResult.data);

      const importedCount = await dbManager.importSalesReportsCSV(
        selectedCompany.id,
        csvContent
      );

      if (importedCount > 0) {
        showToast.dismiss(toastId);
        showToast.success(
          `Successfully imported ${importedCount} sales reports from transformed data.`
        );
        onImportComplete?.(importedCount);

        // Clear data after successful import
        setImportData([]);
        setImportHeaders([]);
        setTransformationResult(null);
        setShowPreview(false);
      } else {
        showToast.dismiss(toastId);
        showToast.warning(
          'No new reports were imported from transformed data.'
        );
      }
    } catch (error) {
      console.error('Failed to import transformed data:', error);
      showToast.error('Failed to import transformed data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const generateCSVForImport = (data: Record<string, unknown>[]): string => {
    // Use the exact header format from OUTPUT_COLUMNS
    const headers = [
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
    ];
    const csvRows = [
      headers.join(','),
      ...data.map(row =>
        headers
          .map(header => {
            const value = row[header];
            if (value === null || value === undefined) return '';
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
  };

  const handleDownloadTemplate = () => {
    const templateData = [
      {
        cust_code: 'CUST001',
        cust_name: 'ABC Company Ltd',
        inv_date: '2025-05-17',
        RE: 'RE',
        invno: 'INV001',
        part_code: 'PROD001',
        part_name: 'Product Alpha',
        tariff: '1234',
        qty: 10,
        bas_price: 100.0,
        ass_val: 1000.0,
        c_gst: 90.0,
        s_gst: 90.0,
        igst: 0.0,
        amot: 50.0,
        inv_val: 1180.0,
        igst_yes_no: 'no',
        percentage: 18.0,
      },
      {
        cust_code: 'CUST002',
        cust_name: 'XYZ Corporation',
        inv_date: '2025-05-18',
        RE: 'RE',
        invno: 'INV002',
        part_code: 'PROD002',
        part_name: 'Product Beta',
        tariff: '5678',
        qty: 5,
        bas_price: 200.0,
        ass_val: 1000.0,
        c_gst: 0.0,
        s_gst: 0.0,
        igst: 180.0,
        amot: 75.0,
        inv_val: 1180.0,
        igst_yes_no: 'yes',
        percentage: 18.0,
      },
    ];

    downloadExcelFile(templateData, 'sales_report_template.xlsx', 'Template');
    showToast.success('Template downloaded successfully!');
  };

  const handleClearData = () => {
    setImportData([]);
    setImportHeaders([]);
    setTransformationResult(null);
    setShowPreview(false);
    showToast.success('Data cleared successfully.');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">
            Import & Transform Data
          </h2>
          <p className="text-muted-foreground mt-1">
            Upload Excel files and transform them to the standard format
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleFileUpload}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload size={16} />
                Upload Excel File
              </>
            )}
          </button>
          <button
            onClick={handleDownloadTemplate}
            className="inline-flex items-center gap-2 px-4 py-2 border border-border rounded-md hover:bg-accent transition-colors"
          >
            <Download size={16} />
            Download Template
          </button>
          {importData.length > 0 && (
            <button
              onClick={handleClearData}
              className="inline-flex items-center gap-2 px-4 py-2 border border-border rounded-md hover:bg-accent transition-colors"
            >
              <X size={16} />
              Clear Data
            </button>
          )}
        </div>
      </div>

      {/* Data Preview Section */}
      {importData.length > 0 && (
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-foreground">
              Uploaded Data Preview
            </h3>
            <div className="flex gap-2">
              <button
                onClick={handleTransformPreview}
                disabled={processing}
                className="inline-flex items-center gap-2 px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {processing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Eye size={14} />
                    Generate Preview
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Data Summary */}
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="bg-muted/50 p-3 rounded-md">
              <div className="text-sm text-muted-foreground">Total Rows</div>
              <div className="text-lg font-semibold text-foreground">
                {importData.length}
              </div>
            </div>
            <div className="bg-muted/50 p-3 rounded-md">
              <div className="text-sm text-muted-foreground">Columns</div>
              <div className="text-lg font-semibold text-foreground">
                {importHeaders.length}
              </div>
            </div>
            <div className="bg-muted/50 p-3 rounded-md">
              <div className="text-sm text-muted-foreground">Status</div>
              <div className="text-lg font-semibold text-foreground">
                {transformationResult
                  ? transformationResult.success
                    ? 'Ready'
                    : 'Errors'
                  : 'Pending'}
              </div>
            </div>
          </div>

          {/* Raw Data Table */}
          <div className="border border-border rounded-md overflow-hidden">
            <div className="bg-muted/50 px-4 py-2 border-b border-border">
              <h4 className="text-sm font-medium text-foreground">
                Raw Data (First 10 rows)
              </h4>
            </div>
            <div className="overflow-x-auto max-h-96">
              <table className="w-full text-sm">
                <thead className="bg-muted/30 sticky top-0">
                  <tr>
                    {importHeaders.map(header => (
                      <th
                        key={header}
                        className="px-3 py-2 text-left text-muted-foreground border-r border-border"
                      >
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {importData.slice(0, 10).map((row, index) => (
                    <tr
                      key={index}
                      className="border-b border-border hover:bg-muted/30"
                    >
                      {importHeaders.map(header => (
                        <td
                          key={header}
                          className="px-3 py-2 text-foreground border-r border-border"
                        >
                          {row[header] === null || row[header] === undefined ? (
                            <span className="text-muted-foreground">-</span>
                          ) : (
                            String(row[header])
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Transformation Results */}
      {transformationResult && showPreview && (
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-foreground">
              Transformation Results
            </h3>
            <div className="flex gap-2">
              <button
                onClick={handleImportData}
                disabled={!transformationResult.success || loading}
                className="inline-flex items-center gap-2 px-3 py-1 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <Check size={14} />
                    Import Data
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Results Summary */}
          <div className="grid grid-cols-4 gap-4 mb-4">
            <div className="bg-muted/50 p-3 rounded-md">
              <div className="text-sm text-muted-foreground">
                Transformed Rows
              </div>
              <div className="text-lg font-semibold text-foreground">
                {transformationResult.data.length}
              </div>
            </div>
            <div className="bg-muted/50 p-3 rounded-md">
              <div className="text-sm text-muted-foreground">Errors</div>
              <div className="text-lg font-semibold text-red-600">
                {transformationResult.errors.length}
              </div>
            </div>
            <div className="bg-muted/50 p-3 rounded-md">
              <div className="text-sm text-muted-foreground">Success Rate</div>
              <div className="text-lg font-semibold text-foreground">
                {transformationResult.data.length > 0
                  ? `${Math.round(((transformationResult.data.length - transformationResult.errors.length) / transformationResult.data.length) * 100)}%`
                  : '0%'}
              </div>
            </div>
            <div className="bg-muted/50 p-3 rounded-md">
              <div className="text-sm text-muted-foreground">Status</div>
              <div
                className={`text-lg font-semibold ${transformationResult.success ? 'text-green-600' : 'text-red-600'}`}
              >
                {transformationResult.success ? 'Success' : 'Failed'}
              </div>
            </div>
          </div>

          {/* Errors Display */}
          {transformationResult.errors.length > 0 && (
            <div className="mb-4">
              <h4 className="text-md font-medium text-red-600 mb-2 flex items-center gap-2">
                <AlertTriangle size={16} />
                Transformation Errors ({transformationResult.errors.length})
              </h4>
              <div className="max-h-32 overflow-y-auto space-y-1">
                {transformationResult.errors
                  .slice(0, 10)
                  .map((error, index) => (
                    <div
                      key={index}
                      className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 p-2 rounded"
                    >
                      Row {error.row}: {error.message}
                    </div>
                  ))}
                {transformationResult.errors.length > 10 && (
                  <div className="text-sm text-muted-foreground">
                    ... and {transformationResult.errors.length - 10} more
                    errors
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Transformed Data Preview */}
          <div className="border border-border rounded-md overflow-hidden">
            <div className="bg-muted/50 px-4 py-2 border-b border-border">
              <h4 className="text-sm font-medium text-foreground">
                Transformed Data Preview (First 10 rows)
              </h4>
            </div>
            <div className="overflow-x-auto max-h-96">
              <table className="w-full text-sm">
                <thead className="bg-muted/30 sticky top-0">
                  <tr>
                    {Object.keys(transformationResult.preview[0] || {}).map(
                      header => (
                        <th
                          key={header}
                          className="px-3 py-2 text-left text-muted-foreground border-r border-border"
                        >
                          {header}
                        </th>
                      )
                    )}
                  </tr>
                </thead>
                <tbody>
                  {transformationResult.preview.map((row, index) => (
                    <tr
                      key={index}
                      className="border-b border-border hover:bg-muted/30"
                    >
                      {Object.values(row).map((value, cellIndex) => (
                        <td
                          key={cellIndex}
                          className="px-3 py-2 text-foreground border-r border-border"
                        >
                          {value === null || value === undefined ? (
                            <span className="text-muted-foreground">-</span>
                          ) : (
                            String(value)
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {importData.length === 0 && (
        <div className="flex items-center justify-center h-64 text-muted-foreground">
          <div className="text-center">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <Upload size={32} className="text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium text-foreground mb-2">
              No Data Uploaded
            </h3>
            <p className="text-muted-foreground mb-4">
              Upload an Excel file to start the transformation process
            </p>
            <button
              onClick={handleFileUpload}
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload size={16} />
                  Upload Excel File
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
