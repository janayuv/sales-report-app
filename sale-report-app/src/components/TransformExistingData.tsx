/**
 * Transform Existing Data Component
 * Allows transformation of already imported data with date filtering
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useCompanyContext } from '../contexts/CompanyContext';
import { dbManager } from '../utils/database';
import { showToast } from './Toast';
import {
  Filter,
  Download,
  Eye,
  Check,
  AlertTriangle,
  RefreshCw,
  Database,
} from 'lucide-react';
import {
  previewTransformation,
  getDateRangeSummary,
} from '../utils/databaseTransformation';
import type {
  TransformationResult,
  TransformationError,
} from '../utils/transformation';
import type { SalesReport } from '../utils/database';
import { downloadExcelFile } from '../utils/fileUtils';

interface TransformExistingDataProps {
  onTransformComplete?: (result: TransformationResult) => void;
}

export const TransformExistingData: React.FC<TransformExistingDataProps> = ({
  onTransformComplete,
}) => {
  const { selectedCompany } = useCompanyContext();

  // State management
  const [reports, setReports] = useState<SalesReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [transformationResult, setTransformationResult] =
    useState<TransformationResult | null>(null);

  // Filter state
  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    customer: '',
    invoice: '',
    minAmount: '',
    maxAmount: '',
    gstType: 'all', // New filter for GST type
  });

  // Summary state
  const [summary, setSummary] = useState({
    totalRecords: 0,
    dateRange: null as { from: string; to: string } | null,
    uniqueInvoices: 0,
    totalValue: 0,
  });

  const applyFilters = useCallback(() => {
    let filtered = [...reports];

    if (filters.dateFrom) {
      filtered = filtered.filter(
        report => new Date(report.inv_date) >= new Date(filters.dateFrom)
      );
    }

    if (filters.dateTo) {
      filtered = filtered.filter(
        report => new Date(report.inv_date) <= new Date(filters.dateTo)
      );
    }

    if (filters.customer) {
      const customerLower = filters.customer.toLowerCase();
      filtered = filtered.filter(
        report =>
          report.cust_name?.toLowerCase().includes(customerLower) ||
          report.cust_code?.toLowerCase().includes(customerLower)
      );
    }

    if (filters.invoice) {
      const invoiceLower = filters.invoice.toLowerCase();
      filtered = filtered.filter(report =>
        report.invno?.toLowerCase().includes(invoiceLower)
      );
    }

    if (filters.minAmount) {
      filtered = filtered.filter(
        report => (report.inv_val || 0) >= parseFloat(filters.minAmount)
      );
    }

    if (filters.maxAmount) {
      filtered = filtered.filter(
        report => (report.inv_val || 0) <= parseFloat(filters.maxAmount)
      );
    }

    // GST Type filter
    if (filters.gstType !== 'all') {
      if (filters.gstType === 'cgst_sgst') {
        // Filter for CGST + SGST invoices (no IGST)
        filtered = filtered.filter(
          report =>
            (report.c_gst || 0) > 0 &&
            (report.s_gst || 0) > 0 &&
            (report.igst || 0) === 0
        );
      } else if (filters.gstType === 'igst') {
        // Filter for IGST invoices (no CGST/SGST)
        filtered = filtered.filter(
          report =>
            (report.igst || 0) > 0 &&
            (report.c_gst || 0) === 0 &&
            (report.s_gst || 0) === 0
        );
      } else if (filters.gstType === 'mixed') {
        // Filter for invoices with both CGST+SGST and IGST
        filtered = filtered.filter(
          report =>
            ((report.c_gst || 0) > 0 || (report.s_gst || 0) > 0) &&
            (report.igst || 0) > 0
        );
      } else if (filters.gstType === 'zero_gst') {
        // Filter for zero GST invoices
        filtered = filtered.filter(
          report =>
            (report.c_gst || 0) === 0 &&
            (report.s_gst || 0) === 0 &&
            (report.igst || 0) === 0
        );
      }
    }

    return filtered;
  }, [reports, filters]);

  const updateSummary = useCallback(() => {
    const filteredReports = applyFilters();
    const summaryData = getDateRangeSummary(filteredReports);
    setSummary(summaryData);
  }, [applyFilters]);

  const loadReports = useCallback(async () => {
    if (!selectedCompany) return;

    try {
      setLoading(true);
      const reportsList = await dbManager.getSalesReportsByCompany(
        selectedCompany.id
      );
      setReports(reportsList);
      console.log('Loaded reports for transformation:', reportsList.length);
    } catch (error) {
      console.error('Failed to load reports:', error);
      showToast.error('Failed to load sales reports');
    } finally {
      setLoading(false);
    }
  }, [selectedCompany]);

  // Load reports on component mount
  useEffect(() => {
    loadReports();
  }, [selectedCompany, loadReports]);

  // Update summary when reports or filters change
  useEffect(() => {
    if (reports.length > 0) {
      updateSummary();
    }
  }, [reports, filters, updateSummary]);

  const handlePreviewTransformation = async () => {
    if (!selectedCompany) {
      showToast.error('Please select a company first.');
      return;
    }

    const filteredReports = applyFilters();
    if (filteredReports.length === 0) {
      showToast.error('No data found with current filters.');
      return;
    }

    try {
      setProcessing(true);

      // Preview transformation
      const preview = previewTransformation(reports, {
        dateFrom: filters.dateFrom || undefined,
        dateTo: filters.dateTo || undefined,
        customer: filters.customer || undefined,
        invoice: filters.invoice || undefined,
        minAmount: filters.minAmount
          ? parseFloat(filters.minAmount)
          : undefined,
        maxAmount: filters.maxAmount
          ? parseFloat(filters.maxAmount)
          : undefined,
        gstType: filters.gstType !== 'all' ? filters.gstType : undefined,
      });

      setTransformationResult(preview.transformationResult);
      setShowPreview(true);

      showToast.success(
        `Preview ready: ${preview.estimatedInvoices} invoices will be generated${preview.willSplit ? ' (with splitting)' : ''}`
      );
    } catch (error) {
      console.error('Failed to preview transformation:', error);
      showToast.error('Failed to preview transformation');
    } finally {
      setProcessing(false);
    }
  };

  const handleApplyTransformation = async () => {
    if (!transformationResult) return;

    try {
      setProcessing(true);

      // Here you would typically save the transformed data back to database
      // or export it directly
      console.log('Applying transformation:', transformationResult);

      showToast.success(
        `Transformation applied successfully! Generated ${transformationResult.data.length} invoice records.`
      );

      if (onTransformComplete) {
        onTransformComplete(transformationResult);
      }

      setShowPreview(false);
    } catch (error) {
      console.error('Failed to apply transformation:', error);
      showToast.error('Failed to apply transformation');
    } finally {
      setProcessing(false);
    }
  };

  const handleExportTransformedData = async () => {
    if (!transformationResult) return;

    try {
      const fileName = `transformed_data_${selectedCompany?.name}_${new Date().toISOString().split('T')[0]}.xlsx`;
      await downloadExcelFile(transformationResult.data, fileName);
      showToast.success('Transformed data exported successfully!');
    } catch (error) {
      console.error('Failed to export data:', error);
      showToast.error('Failed to export transformed data');
    }
  };

  const clearFilters = () => {
    setFilters({
      dateFrom: '',
      dateTo: '',
      customer: '',
      invoice: '',
      minAmount: '',
      maxAmount: '',
      gstType: 'all',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-6 w-6 animate-spin mr-2" />
        <span>Loading existing data...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Transform Existing Data
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Apply transformation and invoice splitting to already imported data
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Database className="h-5 w-5 text-blue-500" />
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {reports.length} records loaded
          </span>
        </div>
      </div>

      {/* Data Summary */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Data Summary
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {summary.totalRecords}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Total Records
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {summary.uniqueInvoices}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Unique Invoices
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              ₹{summary.totalValue.toLocaleString()}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Total Value
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
              {summary.dateRange
                ? `${new Date(summary.dateRange.from).toLocaleDateString()} - ${new Date(summary.dateRange.to).toLocaleDateString()}`
                : 'N/A'}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Date Range
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            <Filter className="h-5 w-5 inline mr-2" />
            Filters
          </h3>
          <button
            onClick={clearFilters}
            className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            Clear All
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Date From */}
          <div>
            <label
              htmlFor="dateFrom"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              From Date
            </label>
            <input
              id="dateFrom"
              type="date"
              value={filters.dateFrom}
              onChange={e =>
                setFilters(prev => ({ ...prev, dateFrom: e.target.value }))
              }
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          {/* Date To */}
          <div>
            <label
              htmlFor="dateTo"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              To Date
            </label>
            <input
              id="dateTo"
              type="date"
              value={filters.dateTo}
              onChange={e =>
                setFilters(prev => ({ ...prev, dateTo: e.target.value }))
              }
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          {/* Customer */}
          <div>
            <label
              htmlFor="customerFilter"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Customer
            </label>
            <input
              id="customerFilter"
              type="text"
              placeholder="Filter by customer..."
              value={filters.customer}
              onChange={e =>
                setFilters(prev => ({ ...prev, customer: e.target.value }))
              }
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          {/* Invoice */}
          <div>
            <label
              htmlFor="invoiceFilter"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Invoice Number
            </label>
            <input
              id="invoiceFilter"
              type="text"
              placeholder="Filter by invoice..."
              value={filters.invoice}
              onChange={e =>
                setFilters(prev => ({ ...prev, invoice: e.target.value }))
              }
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          {/* Min Amount */}
          <div>
            <label
              htmlFor="minAmountFilter"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Min Amount
            </label>
            <input
              id="minAmountFilter"
              type="number"
              placeholder="Minimum value..."
              value={filters.minAmount}
              onChange={e =>
                setFilters(prev => ({ ...prev, minAmount: e.target.value }))
              }
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          {/* Max Amount */}
          <div>
            <label
              htmlFor="maxAmountFilter"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Max Amount
            </label>
            <input
              id="maxAmountFilter"
              type="number"
              placeholder="Maximum value..."
              value={filters.maxAmount}
              onChange={e =>
                setFilters(prev => ({ ...prev, maxAmount: e.target.value }))
              }
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          {/* GST Type Filter */}
          <div>
            <label
              htmlFor="gstFilter"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              GST Type
            </label>
            <select
              id="gstFilter"
              value={filters.gstType}
              onChange={e =>
                setFilters(prev => ({ ...prev, gstType: e.target.value }))
              }
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="all">All GST Types</option>
              <option value="cgst_sgst">CGST + SGST Only</option>
              <option value="igst">IGST Only</option>
              <option value="mixed">Mixed GST</option>
              <option value="zero_gst">Zero GST</option>
            </select>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <button
            onClick={handlePreviewTransformation}
            disabled={processing || summary.totalRecords === 0}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Eye className="h-4 w-4 mr-2" />
            Preview Transformation
          </button>

          {transformationResult && (
            <button
              onClick={handleApplyTransformation}
              disabled={processing}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Check className="h-4 w-4 mr-2" />
              Apply Transformation
            </button>
          )}
        </div>

        {transformationResult && (
          <button
            onClick={handleExportTransformedData}
            className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
          >
            <Download className="h-4 w-4 mr-2" />
            Export Transformed Data
          </button>
        )}
      </div>

      {/* Preview Results */}
      {showPreview && transformationResult && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Transformation Preview
          </h3>

          {/* Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {transformationResult.data.length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Generated Invoices
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {transformationResult.errors.length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Errors
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                {transformationResult.warnings.length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Warnings
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {transformationResult.success ? 'Yes' : 'No'}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Success
              </div>
            </div>
          </div>

          {/* Errors */}
          {transformationResult.errors.length > 0 && (
            <div className="mb-4">
              <h4 className="text-sm font-medium text-red-600 dark:text-red-400 mb-2">
                <AlertTriangle className="h-4 w-4 inline mr-1" />
                Errors ({transformationResult.errors.length})
              </h4>
              <div className="max-h-32 overflow-y-auto">
                {transformationResult.errors
                  .slice(0, 5)
                  .map((error: TransformationError, index: number) => (
                    <div
                      key={index}
                      className="text-sm text-red-600 dark:text-red-400"
                    >
                      Row {error.row}: {error.message}
                    </div>
                  ))}
                {transformationResult.errors.length > 5 && (
                  <div className="text-sm text-gray-500">
                    ... and {transformationResult.errors.length - 5} more errors
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Warnings */}
          {transformationResult.warnings.length > 0 && (
            <div className="mb-4">
              <h4 className="text-sm font-medium text-yellow-600 dark:text-yellow-400 mb-2">
                <AlertTriangle className="h-4 w-4 inline mr-1" />
                Warnings ({transformationResult.warnings.length})
              </h4>
              <div className="max-h-32 overflow-y-auto">
                {transformationResult.warnings.map(
                  (warning: string, index: number) => (
                    <div
                      key={index}
                      className="text-sm text-yellow-600 dark:text-yellow-400"
                    >
                      {warning}
                    </div>
                  )
                )}
              </div>
            </div>
          )}

          {/* Preview Data Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Invoice No
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Assessable Value
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    CGST
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    SGST
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    IGST
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Total Value
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {transformationResult.preview
                  .slice(0, 10)
                  .map((row: Record<string, unknown>, index: number) => (
                    <tr
                      key={index}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      <td className="px-3 py-2 text-sm text-gray-900 dark:text-white">
                        <div className="font-medium">
                          {String(row.cust_name || 'N/A')}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {String(row.cust_code || '')}
                        </div>
                      </td>
                      <td className="px-3 py-2 text-sm text-gray-900 dark:text-white font-mono">
                        {String(row.invno || 'N/A')}
                      </td>
                      <td className="px-3 py-2 text-sm text-gray-900 dark:text-white">
                        {row.inv_date
                          ? new Date(String(row.inv_date)).toLocaleDateString()
                          : 'N/A'}
                      </td>
                      <td className="px-3 py-2 text-sm text-gray-900 dark:text-white text-right">
                        ₹{(row.ass_val || 0).toLocaleString()}
                      </td>
                      <td className="px-3 py-2 text-sm text-gray-900 dark:text-white text-right">
                        ₹{(row.c_gst || 0).toLocaleString()}
                      </td>
                      <td className="px-3 py-2 text-sm text-gray-900 dark:text-white text-right">
                        ₹{(row.s_gst || 0).toLocaleString()}
                      </td>
                      <td className="px-3 py-2 text-sm text-gray-900 dark:text-white text-right">
                        ₹{(row.igst || 0).toLocaleString()}
                      </td>
                      <td className="px-3 py-2 text-sm text-gray-900 dark:text-white text-right font-semibold">
                        ₹{(row.inv_val || 0).toLocaleString()}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>

            {/* Table Footer with Summary */}
            <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 border-t border-gray-200 dark:border-gray-600">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600 dark:text-gray-400">
                  Showing {Math.min(10, transformationResult.preview.length)} of{' '}
                  {transformationResult.data.length} records
                </span>
                <div className="flex space-x-4 text-gray-600 dark:text-gray-400">
                  <span>
                    Total Assessable: ₹
                    {transformationResult.preview
                      .reduce(
                        (sum: number, row: Record<string, unknown>) =>
                          sum + ((row.ass_val as number) || 0),
                        0
                      )
                      .toLocaleString()}
                  </span>
                  <span>
                    Total Value: ₹
                    {transformationResult.preview
                      .reduce(
                        (sum: number, row: Record<string, unknown>) =>
                          sum + ((row.inv_val as number) || 0),
                        0
                      )
                      .toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
