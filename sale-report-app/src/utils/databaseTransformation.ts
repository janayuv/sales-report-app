/**
 * Database to Transformation Converter
 * Converts existing database records to transformation input format
 */

import type { SalesReport } from './database';
import type { TransformationResult } from './transformation';
import { TransformationEngine } from './transformationEngine';

/**
 * Convert database SalesReport records to transformation input format
 */
export function convertDatabaseToTransformationInput(reports: SalesReport[]): {
  inputData: Record<string, unknown>[];
  sourceHeaders: string[];
} {
  if (reports.length === 0) {
    return { inputData: [], sourceHeaders: [] };
  }

  // Define the source headers based on database schema
  const sourceHeaders = [
    'cust_code',
    'cust_name',
    'inv_date',
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

  // Convert each report to input format
  const inputData = reports.map(report => ({
    cust_code: report.cust_code || '',
    cust_name: report.cust_name || '',
    inv_date: report.inv_date || '',
    invno: report.invno || '',
    part_code: report.part_code || '',
    part_name: report.part_name || '',
    tariff: report.tariff || '',
    qty: report.qty || 0,
    bas_price: report.bas_price || 0,
    ass_val: report.ass_val || 0,
    c_gst: report.c_gst || 0,
    s_gst: report.s_gst || 0,
    igst: report.igst || 0,
    amot: report.amot || 0,
    inv_val: report.inv_val || 0,
    igst_yes_no: report.igst_yes_no || 'no',
    percentage: report.percentage || 0,
  }));

  return { inputData, sourceHeaders };
}

/**
 * Transform existing database data with date filtering
 */
export function transformExistingData(
  reports: SalesReport[],
  dateFrom?: string,
  dateTo?: string,
  additionalFilters?: {
    customer?: string;
    invoice?: string;
    minAmount?: number;
    maxAmount?: number;
    gstType?: string;
  }
): TransformationResult {
  console.log(`Starting transformation with ${reports.length} reports`);
  console.log(`Date filter: ${dateFrom || 'none'} to ${dateTo || 'none'}`);
  console.log(`Additional filters:`, additionalFilters);

  // Step 1: Apply date filters
  let filteredReports = [...reports];
  const originalCount = filteredReports.length;

  if (dateFrom) {
    filteredReports = filteredReports.filter(
      report => new Date(report.inv_date) >= new Date(dateFrom)
    );
    console.log(
      `After dateFrom filter: ${filteredReports.length} reports (removed ${originalCount - filteredReports.length})`
    );
  }

  if (dateTo) {
    const beforeCount = filteredReports.length;
    filteredReports = filteredReports.filter(
      report => new Date(report.inv_date) <= new Date(dateTo)
    );
    console.log(
      `After dateTo filter: ${filteredReports.length} reports (removed ${beforeCount - filteredReports.length})`
    );
  }

  // Step 2: Apply additional filters
  if (additionalFilters) {
    if (additionalFilters.customer) {
      const customerLower = additionalFilters.customer.toLowerCase();
      const beforeCount = filteredReports.length;
      filteredReports = filteredReports.filter(
        report =>
          report.cust_name?.toLowerCase().includes(customerLower) ||
          report.cust_code?.toLowerCase().includes(customerLower)
      );
      console.log(
        `After customer filter: ${filteredReports.length} reports (removed ${beforeCount - filteredReports.length})`
      );
    }

    if (additionalFilters.invoice) {
      const invoiceLower = additionalFilters.invoice.toLowerCase();
      const beforeCount = filteredReports.length;
      filteredReports = filteredReports.filter(report =>
        report.invno?.toLowerCase().includes(invoiceLower)
      );
      console.log(
        `After invoice filter: ${filteredReports.length} reports (removed ${beforeCount - filteredReports.length})`
      );
    }

    if (additionalFilters.minAmount !== undefined) {
      const beforeCount = filteredReports.length;
      filteredReports = filteredReports.filter(
        report => (report.inv_val || 0) >= additionalFilters.minAmount!
      );
      console.log(
        `After minAmount filter: ${filteredReports.length} reports (removed ${beforeCount - filteredReports.length})`
      );
    }

    if (additionalFilters.maxAmount !== undefined) {
      const beforeCount = filteredReports.length;
      filteredReports = filteredReports.filter(
        report => (report.inv_val || 0) <= additionalFilters.maxAmount!
      );
      console.log(
        `After maxAmount filter: ${filteredReports.length} reports (removed ${beforeCount - filteredReports.length})`
      );
    }

    // GST Type filter
    if (additionalFilters.gstType && additionalFilters.gstType !== 'all') {
      const beforeCount = filteredReports.length;
      if (additionalFilters.gstType === 'cgst_sgst') {
        // Filter for CGST + SGST invoices (no IGST)
        filteredReports = filteredReports.filter(
          report =>
            (report.c_gst || 0) > 0 &&
            (report.s_gst || 0) > 0 &&
            (report.igst || 0) === 0
        );
      } else if (additionalFilters.gstType === 'igst') {
        // Filter for IGST invoices (no CGST/SGST)
        filteredReports = filteredReports.filter(
          report =>
            (report.igst || 0) > 0 &&
            (report.c_gst || 0) === 0 &&
            (report.s_gst || 0) === 0
        );
      } else if (additionalFilters.gstType === 'mixed') {
        // Filter for invoices with both CGST+SGST and IGST
        filteredReports = filteredReports.filter(
          report =>
            ((report.c_gst || 0) > 0 || (report.s_gst || 0) > 0) &&
            (report.igst || 0) > 0
        );
      } else if (additionalFilters.gstType === 'zero_gst') {
        // Filter for zero GST invoices
        filteredReports = filteredReports.filter(
          report =>
            (report.c_gst || 0) === 0 &&
            (report.s_gst || 0) === 0 &&
            (report.igst || 0) === 0
        );
      }
      console.log(
        `After GST type filter (${additionalFilters.gstType}): ${filteredReports.length} reports (removed ${beforeCount - filteredReports.length})`
      );
    }
  }

  console.log(
    `Final filtered reports: ${filteredReports.length} (from original ${originalCount})`
  );

  // Step 3: Convert to transformation input format
  const { inputData, sourceHeaders } =
    convertDatabaseToTransformationInput(filteredReports);
  console.log(`Converted to transformation input: ${inputData.length} rows`);

  // Step 4: Create transformation engine and process data
  const engine = new TransformationEngine();

  // Step 5: Transform the data
  const result = engine.transformData(inputData, sourceHeaders);
  console.log(
    `Transformation result: ${result.data.length} invoices generated`
  );

  return result;
}

/**
 * Get date range summary for existing data
 */
export function getDateRangeSummary(reports: SalesReport[]): {
  totalRecords: number;
  dateRange: { from: string; to: string } | null;
  uniqueInvoices: number;
  totalValue: number;
} {
  if (reports.length === 0) {
    return {
      totalRecords: 0,
      dateRange: null,
      uniqueInvoices: 0,
      totalValue: 0,
    };
  }

  // Get date range
  const dates = reports
    .map(r => r.inv_date)
    .filter(d => d)
    .sort();

  const dateRange =
    dates.length > 0
      ? {
          from: dates[0],
          to: dates[dates.length - 1],
        }
      : null;

  // Get unique invoices
  const uniqueInvoices = new Set(reports.map(r => r.invno)).size;

  // Calculate total value
  const totalValue = reports.reduce((sum, r) => sum + (r.inv_val || 0), 0);

  return {
    totalRecords: reports.length,
    dateRange,
    uniqueInvoices,
    totalValue,
  };
}

/**
 * Preview transformation results without applying
 */
export function previewTransformation(
  reports: SalesReport[],
  filters?: {
    dateFrom?: string;
    dateTo?: string;
    customer?: string;
    invoice?: string;
    minAmount?: number;
    maxAmount?: number;
    gstType?: string;
  }
): {
  summary: ReturnType<typeof getDateRangeSummary>;
  transformationResult: TransformationResult;
  willSplit: boolean;
  estimatedInvoices: number;
} {
  // Get summary of filtered data
  const filteredReports = applyFilters(reports, filters);
  const summary = getDateRangeSummary(filteredReports);

  // Transform the data
  const transformationResult = transformExistingData(
    reports,
    filters?.dateFrom,
    filters?.dateTo,
    filters
  );

  // Analyze if splitting will occur
  const willSplit = transformationResult.data.length !== filteredReports.length;
  const estimatedInvoices = transformationResult.data.length;

  return {
    summary,
    transformationResult,
    willSplit,
    estimatedInvoices,
  };
}

/**
 * Apply filters to reports
 */
function applyFilters(
  reports: SalesReport[],
  filters?: {
    dateFrom?: string;
    dateTo?: string;
    customer?: string;
    invoice?: string;
    minAmount?: number;
    maxAmount?: number;
    gstType?: string;
  }
): SalesReport[] {
  if (!filters) return reports;

  let filtered = [...reports];

  if (filters.dateFrom) {
    filtered = filtered.filter(
      report => new Date(report.inv_date) >= new Date(filters.dateFrom!)
    );
  }

  if (filters.dateTo) {
    filtered = filtered.filter(
      report => new Date(report.inv_date) <= new Date(filters.dateTo!)
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

  if (filters.minAmount !== undefined) {
    filtered = filtered.filter(
      report => (report.inv_val || 0) >= filters.minAmount!
    );
  }

  if (filters.maxAmount !== undefined) {
    filtered = filtered.filter(
      report => (report.inv_val || 0) <= filters.maxAmount!
    );
  }

  // GST Type filter
  if (filters.gstType && filters.gstType !== 'all') {
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
}
