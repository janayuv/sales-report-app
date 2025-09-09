import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type {
  SalesReport,
  SalesReportFilters,
  PaginatedResult,
} from '../utils/database';
import { dbManager } from '../utils/database';
import { useCompanyContext } from '../contexts/CompanyContext';
import {
  Search,
  Upload,
  Download,
  FileText,
  Trash2,
  Calendar,
  DollarSign,
  Package,
  Filter,
  SortAsc,
  SortDesc,
  ChevronDown,
  X,
  ChevronLeft,
  ChevronRight,
  BarChart3,
} from 'lucide-react';
import {
  downloadExcelFile,
  downloadCSVFile,
  downloadJSONFile,
  downloadPDFFile,
  selectFile,
  readExcelFile,
  readCSVFile,
} from '../utils/fileUtils';
import { showToast } from './Toast';
import { Analytics } from './Analytics';

const PAGE_SIZE = 50; // Configurable page size

export const OptimizedReports: React.FC = () => {
  const { selectedCompany } = useCompanyContext();
  const [paginatedData, setPaginatedData] =
    useState<PaginatedResult<SalesReport> | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [globalFilter, setGlobalFilter] = useState('');
  const [showImportMenu, setShowImportMenu] = useState(false);

  // Advanced filtering state
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<SalesReportFilters>({
    date_from: '',
    date_to: '',
    customer: '',
    invoice: '',
    min_amount: undefined,
    max_amount: undefined,
  });

  // Sorting state
  const [sortConfig, setSortConfig] = useState<{
    key: keyof SalesReport | null;
    direction: 'asc' | 'desc';
  }>({ key: null, direction: 'asc' });

  // Export options state
  const [showExportMenu, setShowExportMenu] = useState(false);

  // Analytics state
  const [activeTab, setActiveTab] = useState<'reports' | 'analytics'>(
    'reports'
  );
  const [allReports, setAllReports] = useState<SalesReport[]>([]);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  // Load reports with pagination
  const loadReports = useCallback(async () => {
    if (!selectedCompany) return;

    try {
      setLoading(true);
      console.log('Loading paginated reports for company:', selectedCompany.id);

      // Convert filters to the format expected by the backend
      let backendFilters: SalesReportFilters = { ...filters };

      // Universal search - if global filter is provided, search across all fields
      if (globalFilter.trim()) {
        backendFilters = {
          ...filters,
          customer: globalFilter.trim(),
          invoice: globalFilter.trim(),
        };
      }

      const result = await dbManager.getSalesReportsPaginated(
        selectedCompany.id,
        currentPage,
        PAGE_SIZE,
        backendFilters
      );

      console.log('Loaded paginated reports:', result);
      setPaginatedData(result);
    } catch (error) {
      console.error('Failed to load reports:', error);
      showToast.error('Failed to load sales reports');
    } finally {
      setLoading(false);
    }
  }, [selectedCompany, currentPage, filters, globalFilter]);

  // Debounced filter effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (currentPage !== 1) {
        setCurrentPage(1); // Reset to first page when filters change
      } else {
        loadReports();
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(timeoutId);
  }, [filters, globalFilter, currentPage, loadReports]);

  // Load all reports for analytics
  const loadAllReportsForAnalytics = useCallback(async () => {
    if (!selectedCompany) return;

    try {
      setAnalyticsLoading(true);
      const allReportsData = await dbManager.getSalesReportsByCompany(
        selectedCompany.id
      );
      setAllReports(allReportsData);
    } catch (error) {
      console.error('Failed to load reports for analytics:', error);
      showToast.error('Failed to load analytics data');
    } finally {
      setAnalyticsLoading(false);
    }
  }, [selectedCompany]);

  // Load analytics data when switching to analytics tab
  useEffect(() => {
    if (activeTab === 'analytics' && allReports.length === 0) {
      loadAllReportsForAnalytics();
    }
  }, [activeTab, allReports.length, loadAllReportsForAnalytics]);

  // Handle column sorting (client-side for current page)
  const handleSort = (key: keyof SalesReport) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  // Sort current page data
  const sortedReports = useMemo(() => {
    if (!paginatedData?.data || !sortConfig.key)
      return paginatedData?.data || [];

    return [...paginatedData.data].sort((a, b) => {
      const aVal = a[sortConfig.key!];
      const bVal = b[sortConfig.key!];

      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;

      // Special handling for date sorting
      if (sortConfig.key === 'inv_date') {
        const aDate = new Date(aVal as string).getTime();
        const bDate = new Date(bVal as string).getTime();
        return sortConfig.direction === 'asc' ? aDate - bDate : bDate - aDate;
      }

      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortConfig.direction === 'asc'
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }

      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal;
      }

      return 0;
    });
  }, [paginatedData?.data, sortConfig]);

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      date_from: '',
      date_to: '',
      customer: '',
      invoice: '',
      min_amount: undefined,
      max_amount: undefined,
    });
    setGlobalFilter('');
  };

  // Check if any filters are active
  const hasActiveFilters = () => {
    return (
      filters.date_from ||
      filters.date_to ||
      filters.customer ||
      filters.invoice ||
      filters.min_amount !== undefined ||
      filters.max_amount !== undefined ||
      globalFilter.trim()
    );
  };

  // Pagination handlers
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Note: PAGE_SIZE is currently fixed, but could be made dynamic with:
  // const handlePageSizeChange = (newPageSize: number) => {
  //   setCurrentPage(1);
  //   // Update page size logic here
  // };

  // Delete report handler
  const handleDeleteReport = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this report?')) return;

    try {
      await dbManager.deleteSalesReport(id);
      showToast.success('Report deleted successfully');
      loadReports(); // Reload current page
    } catch (error) {
      console.error('Failed to delete report:', error);
      showToast.error('Failed to delete report');
    }
  };

  // Direct import handler (bypasses transformation dialog)
  const handleDirectImport = async () => {
    try {
      console.log('Starting direct import process...');
      const file = await selectFile('.csv,.xlsx,.xls');
      if (!file) {
        console.log('No file selected');
        return;
      }

      console.log('File selected for direct import:', file.name);

      // Add timeout to prevent hanging
      let importPromise: Promise<Record<string, unknown>[]>;

      if (file.name.toLowerCase().endsWith('.csv')) {
        console.log('Reading CSV file for direct import...');
        importPromise = readCSVFile(file);
      } else {
        console.log('Reading Excel file for direct import...');
        importPromise = readExcelFile(file);
      }

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(
          () =>
            reject(new Error('Import timeout - file too large or corrupted')),
          30000
        )
      );

      const data = (await Promise.race([
        importPromise,
        timeoutPromise,
      ])) as Record<string, unknown>[];

      if (!data || data.length === 0) {
        showToast.error('No data found in the file');
        return;
      }

      console.log(
        'Data loaded successfully for direct import, records:',
        data.length
      );

      // Convert data to CSV format for direct import
      const csvContent = generateCSVForDirectImport(data);
      console.log(
        'Generated CSV content (first 500 chars):',
        csvContent.substring(0, 500)
      );
      console.log('Full CSV content:', csvContent);

      const toastId = showToast.loading('Importing data directly...');

      try {
        const importedCount = await dbManager.importSalesReportsCSV(
          selectedCompany!.id,
          csvContent
        );

        showToast.dismiss(toastId);

        if (importedCount > 0) {
          showToast.success(
            `Successfully imported ${importedCount} sales reports directly!`
          );
          loadReports(); // Reload current page
        } else {
          showToast.warning(
            'No new reports were imported. Data might already exist or format might be incorrect.'
          );
          console.log('Import returned 0 records. CSV content:', csvContent);
        }
      } catch (importError) {
        showToast.dismiss(toastId);
        console.error('Import error:', importError);
        showToast.error(
          `Import failed: ${importError instanceof Error ? importError.message : 'Unknown error'}`
        );
      }
    } catch (error) {
      console.error('Failed to import file directly:', error);
      showToast.error(
        `Failed to import file: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  };

  // Generate CSV content for direct import
  const generateCSVForDirectImport = (
    data: Record<string, unknown>[]
  ): string => {
    console.log('Generating CSV for direct import, sample data:', data[0]);

    // Define the expected column headers for sales reports
    const targetHeaders = [
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

    // Get actual headers from the data
    const actualHeaders = Object.keys(data[0] || {});
    console.log('Actual Excel headers:', actualHeaders);

    // Create mapping from actual headers to target headers
    const headerMapping = createHeaderMapping(actualHeaders, targetHeaders);
    console.log('Header mapping:', headerMapping);

    const csvRows = [
      targetHeaders.join(','),
      ...data.map(row => {
        return targetHeaders
          .map(targetHeader => {
            const sourceHeader = headerMapping[targetHeader];
            let value = sourceHeader ? row[sourceHeader] || '' : '';

            // Clean the value
            if (typeof value === 'string') {
              // Remove currency symbols
              value = String(value).replace(/[₹$€£¥]/g, '');
              // Replace line breaks with spaces and normalize whitespace
              value = String(value)
                .replace(/\r?\n/g, ' ')
                .replace(/\s+/g, ' ')
                .trim();
            }

            // Escape CSV values that contain commas, quotes, or newlines
            if (
              typeof value === 'string' &&
              (value.includes(',') ||
                value.includes('"') ||
                value.includes('\n'))
            ) {
              value = `"${value.replace(/"/g, '""')}"`;
            }

            return value;
          })
          .join(',');
      }),
    ];

    return csvRows.join('\n');
  };

  // Create mapping from actual Excel headers to target database headers
  const createHeaderMapping = (
    actualHeaders: string[],
    targetHeaders: string[]
  ): Record<string, string> => {
    const mapping: Record<string, string> = {};

    // Common mappings based on typical Excel column names
    const commonMappings: Record<string, string[]> = {
      cust_code: ['cust_cde', 'customer_code', 'cust_code', 'customer_cde'],
      cust_name: ['cust_name', 'customer_name', 'customer'],
      inv_date: ['IO_DATE', 'inv_date', 'invoice_date', 'date'],
      RE: ['RE', 're', 'r_e'],
      invno: ['invno', 'invoice_no', 'invoice_number', 'inv_no'],
      part_code: ['prod_cde', 'part_code', 'product_code', 'prod_code'],
      part_name: ['prod_name_ko', 'part_name', 'product_name', 'prod_name'],
      tariff: ['tariff_code', 'tariff', 'tariff_cde'],
      qty: ['io_qty', 'qty', 'quantity', 'qty_sold'],
      bas_price: ['rate_pre_unit', 'bas_price', 'base_price', 'rate'],
      ass_val: ['ASSESSABLE_VALUE', 'ass_val', 'assessable_value', 'ass_val'],
      c_gst: ['CGST_AMT', 'c_gst', 'cgst', 'cgst_amt'],
      s_gst: ['SGST_AMT', 's_gst', 'sgst', 'sgst_amt'],
      igst: ['IGST_AMT', 'igst', 'igst_amt'],
      amot: ['Amortisation_cost', 'amot', 'amortization', 'amort_cost'],
      inv_val: ['invoice_Total', 'inv_val', 'invoice_value', 'total_value'],
      igst_yes_no: ['igst_yes_no', 'igst_flag', 'igst_yn'],
      percentage: ['percentage', 'percent', 'pct'],
    };

    // Map each target header to the best matching actual header
    targetHeaders.forEach(targetHeader => {
      const possibleMappings = commonMappings[targetHeader] || [targetHeader];

      // Find the first matching header (case insensitive)
      const matchedHeader = actualHeaders.find(actualHeader =>
        possibleMappings.some(
          mapping =>
            actualHeader.toLowerCase().trim() === mapping.toLowerCase().trim()
        )
      );

      if (matchedHeader) {
        mapping[targetHeader] = matchedHeader;
      } else {
        console.warn(`No mapping found for target header: ${targetHeader}`);
      }
    });

    return mapping;
  };

  // Export handlers
  const handleExport = async (format: 'csv' | 'excel' | 'json' | 'pdf') => {
    if (!selectedCompany) return;

    try {
      const reports = await dbManager.getSalesReportsByCompany(
        selectedCompany.id
      );

      switch (format) {
        case 'csv':
          await downloadCSVFile(
            reports as unknown as Record<string, unknown>[],
            `sales-reports-${selectedCompany.name}.csv`
          );
          break;
        case 'excel':
          await downloadExcelFile(
            reports as unknown as Record<string, unknown>[],
            `sales-reports-${selectedCompany.name}.xlsx`
          );
          break;
        case 'json':
          await downloadJSONFile(
            reports as unknown as Record<string, unknown>[],
            `sales-reports-${selectedCompany.name}.json`
          );
          break;
        case 'pdf':
          await downloadPDFFile(
            reports as unknown as Record<string, unknown>[],
            `sales-reports-${selectedCompany.name}.pdf`
          );
          break;
      }

      showToast.success(`Reports exported as ${format.toUpperCase()}`);
    } catch (error) {
      console.error('Export failed:', error);
      showToast.error('Export failed');
    }
  };

  // Render pagination controls
  const renderPagination = () => {
    if (!paginatedData || paginatedData.totalPages <= 1) return null;

    const { page, totalPages, total } = paginatedData;
    const startItem = (page - 1) * PAGE_SIZE + 1;
    const endItem = Math.min(page * PAGE_SIZE, total);

    return (
      <div className="flex items-center justify-between px-4 py-3 border-t border-border">
        <div className="text-sm text-muted-foreground">
          Showing {startItem} to {endItem} of {total.toLocaleString()} reports
          {hasActiveFilters() && (
            <span className="ml-2 text-primary">(filtered)</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handlePageChange(page - 1)}
            disabled={page <= 1}
            className="p-2 rounded-md border border-border hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft size={16} />
          </button>

          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (page <= 3) {
                pageNum = i + 1;
              } else if (page >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = page - 2 + i;
              }

              return (
                <button
                  key={pageNum}
                  onClick={() => handlePageChange(pageNum)}
                  className={`px-3 py-1 rounded-md text-sm ${
                    page === pageNum
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-muted'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>

          <button
            onClick={() => handlePageChange(page + 1)}
            disabled={page >= totalPages}
            className="p-2 rounded-md border border-border hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    );
  };

  if (activeTab === 'analytics') {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-foreground">Analytics</h1>
          <button
            onClick={() => setActiveTab('reports')}
            className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Back to Reports
          </button>
        </div>
        <Analytics reports={allReports} loading={analyticsLoading} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">
            Sales Reports
          </h1>
          <p className="text-muted-foreground">
            {selectedCompany
              ? `Manage and analyze sales data for ${selectedCompany.name}`
              : 'Select a company to manage and analyze sales data'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('analytics')}
            className="px-4 py-2 text-sm bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80"
          >
            <BarChart3 size={16} className="mr-2" />
            Analytics
          </button>

          <div className="relative">
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="px-4 py-2 text-sm bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80"
            >
              <Download size={16} className="mr-2" />
              Export
              <ChevronDown size={14} className="ml-2" />
            </button>

            {showExportMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-card border border-border rounded-md shadow-lg z-10">
                <button
                  onClick={() => {
                    handleExport('csv');
                    setShowExportMenu(false);
                  }}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-muted"
                >
                  Export as CSV
                </button>
                <button
                  onClick={() => {
                    handleExport('excel');
                    setShowExportMenu(false);
                  }}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-muted"
                >
                  Export as Excel
                </button>
                <button
                  onClick={() => {
                    handleExport('json');
                    setShowExportMenu(false);
                  }}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-muted"
                >
                  Export as JSON
                </button>
                <button
                  onClick={() => {
                    handleExport('pdf');
                    setShowExportMenu(false);
                  }}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-muted"
                >
                  Export as PDF
                </button>
              </div>
            )}
          </div>

          <div className="relative">
            <button
              onClick={() => {
                if (!selectedCompany) {
                  showToast.error(
                    'Please select a company first to import sales reports'
                  );
                  return;
                }
                setShowImportMenu(!showImportMenu);
              }}
              disabled={!selectedCompany}
              className={`px-4 py-2 text-sm rounded-md transition-colors ${
                selectedCompany
                  ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                  : 'bg-muted text-muted-foreground cursor-not-allowed'
              }`}
              title={
                !selectedCompany
                  ? 'Please select a company first'
                  : 'Import sales reports from file'
              }
            >
              <Upload size={16} className="mr-2" />
              Import
              <ChevronDown size={14} className="ml-2" />
            </button>

            {showImportMenu && selectedCompany && (
              <div className="absolute right-0 mt-2 w-48 bg-card border border-border rounded-md shadow-lg z-10">
                <button
                  onClick={() => {
                    handleDirectImport();
                    setShowImportMenu(false);
                  }}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-muted"
                >
                  Import from File
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"
            size={16}
          />
          <input
            type="text"
            placeholder="Search reports..."
            value={globalFilter}
            onChange={e => setGlobalFilter(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`px-4 py-2 rounded-md border ${
            hasActiveFilters()
              ? 'border-primary bg-primary/10 text-primary'
              : 'border-border hover:bg-muted'
          }`}
        >
          <Filter size={16} className="mr-2" />
          Filters
          {hasActiveFilters() && (
            <span className="ml-2 px-2 py-0.5 text-xs bg-primary text-primary-foreground rounded-full">
              Active
            </span>
          )}
        </button>

        {hasActiveFilters() && (
          <button
            onClick={clearFilters}
            className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <X size={16} className="mr-2" />
            Clear
          </button>
        )}
      </div>

      {/* Advanced Filters */}
      {showFilters && (
        <div className="p-4 border border-border rounded-md bg-muted/30">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label
                htmlFor="date-from"
                className="block text-sm font-medium text-foreground mb-1"
              >
                Date From
              </label>
              <input
                id="date-from"
                type="date"
                value={filters.date_from || ''}
                onChange={e =>
                  setFilters(prev => ({ ...prev, date_from: e.target.value }))
                }
                className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label
                htmlFor="date-to"
                className="block text-sm font-medium text-foreground mb-1"
              >
                Date To
              </label>
              <input
                id="date-to"
                type="date"
                value={filters.date_to || ''}
                onChange={e =>
                  setFilters(prev => ({ ...prev, date_to: e.target.value }))
                }
                className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label
                htmlFor="customer-filter"
                className="block text-sm font-medium text-foreground mb-1"
              >
                Customer
              </label>
              <input
                id="customer-filter"
                type="text"
                placeholder="Customer name or code"
                value={filters.customer || ''}
                onChange={e =>
                  setFilters(prev => ({ ...prev, customer: e.target.value }))
                }
                className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label
                htmlFor="invoice-filter"
                className="block text-sm font-medium text-foreground mb-1"
              >
                Invoice Number
              </label>
              <input
                id="invoice-filter"
                type="text"
                placeholder="Invoice number"
                value={filters.invoice || ''}
                onChange={e =>
                  setFilters(prev => ({ ...prev, invoice: e.target.value }))
                }
                className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label
                htmlFor="min-amount"
                className="block text-sm font-medium text-foreground mb-1"
              >
                Min Amount
              </label>
              <input
                id="min-amount"
                type="number"
                placeholder="Minimum amount"
                value={filters.min_amount || ''}
                onChange={e =>
                  setFilters(prev => ({
                    ...prev,
                    min_amount: e.target.value
                      ? parseFloat(e.target.value)
                      : undefined,
                  }))
                }
                className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label
                htmlFor="max-amount"
                className="block text-sm font-medium text-foreground mb-1"
              >
                Max Amount
              </label>
              <input
                id="max-amount"
                type="number"
                placeholder="Maximum amount"
                value={filters.max_amount || ''}
                onChange={e =>
                  setFilters(prev => ({
                    ...prev,
                    max_amount: e.target.value
                      ? parseFloat(e.target.value)
                      : undefined,
                  }))
                }
                className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
        </div>
      )}

      {/* Reports Table */}
      {!selectedCompany ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Package size={48} className="mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              No Company Selected
            </h3>
            <p className="text-muted-foreground mb-4">
              Please select a company from the sidebar to view and manage sales
              reports.
            </p>
            <p className="text-sm text-muted-foreground">
              You can also import sales reports once a company is selected.
            </p>
          </div>
        </div>
      ) : loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading reports...</p>
          </div>
        </div>
      ) : (
        <>
          <div className="border border-border rounded-md overflow-hidden bg-card">
            <div className="overflow-x-auto">
              <table className="w-full text-sm table-fixed min-w-[1200px]">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-4 py-3 text-left w-48">
                      <button
                        onClick={() => handleSort('cust_name')}
                        className="flex items-center gap-2 hover:text-foreground"
                      >
                        <Package size={14} />
                        Customer
                        {sortConfig.key === 'cust_name' &&
                          (sortConfig.direction === 'asc' ? (
                            <SortAsc size={14} />
                          ) : (
                            <SortDesc size={14} />
                          ))}
                      </button>
                    </th>
                    <th className="px-4 py-3 text-left w-24">
                      <button
                        onClick={() => handleSort('inv_date')}
                        className="flex items-center gap-2 hover:text-foreground"
                      >
                        <Calendar size={14} />
                        Date
                        {sortConfig.key === 'inv_date' &&
                          (sortConfig.direction === 'asc' ? (
                            <SortAsc size={14} />
                          ) : (
                            <SortDesc size={14} />
                          ))}
                      </button>
                    </th>
                    <th className="px-4 py-3 text-left w-32">
                      <button
                        onClick={() => handleSort('invno')}
                        className="flex items-center gap-2 hover:text-foreground"
                      >
                        <FileText size={14} />
                        Invoice
                        {sortConfig.key === 'invno' &&
                          (sortConfig.direction === 'asc' ? (
                            <SortAsc size={14} />
                          ) : (
                            <SortDesc size={14} />
                          ))}
                      </button>
                    </th>
                    <th className="px-4 py-3 text-left w-24">Part Code</th>
                    <th className="px-4 py-3 text-left w-40">Part Name</th>
                    <th className="px-4 py-3 text-right w-20">
                      <button
                        onClick={() => handleSort('qty')}
                        className="flex items-center gap-2 hover:text-foreground ml-auto"
                      >
                        Qty
                        {sortConfig.key === 'qty' &&
                          (sortConfig.direction === 'asc' ? (
                            <SortAsc size={14} />
                          ) : (
                            <SortDesc size={14} />
                          ))}
                      </button>
                    </th>
                    <th className="px-4 py-3 text-right w-24">
                      <button
                        onClick={() => handleSort('bas_price')}
                        className="flex items-center gap-2 hover:text-foreground ml-auto"
                      >
                        Rate
                        {sortConfig.key === 'bas_price' &&
                          (sortConfig.direction === 'asc' ? (
                            <SortAsc size={14} />
                          ) : (
                            <SortDesc size={14} />
                          ))}
                      </button>
                    </th>
                    <th className="px-4 py-3 text-right w-24">
                      <button
                        onClick={() => handleSort('c_gst')}
                        className="flex items-center gap-2 hover:text-foreground ml-auto"
                      >
                        CGST
                        {sortConfig.key === 'c_gst' &&
                          (sortConfig.direction === 'asc' ? (
                            <SortAsc size={14} />
                          ) : (
                            <SortDesc size={14} />
                          ))}
                      </button>
                    </th>
                    <th className="px-4 py-3 text-right w-24">
                      <button
                        onClick={() => handleSort('s_gst')}
                        className="flex items-center gap-2 hover:text-foreground ml-auto"
                      >
                        SGST
                        {sortConfig.key === 's_gst' &&
                          (sortConfig.direction === 'asc' ? (
                            <SortAsc size={14} />
                          ) : (
                            <SortDesc size={14} />
                          ))}
                      </button>
                    </th>
                    <th className="px-4 py-3 text-right w-24">
                      <button
                        onClick={() => handleSort('igst')}
                        className="flex items-center gap-2 hover:text-foreground ml-auto"
                      >
                        IGST
                        {sortConfig.key === 'igst' &&
                          (sortConfig.direction === 'asc' ? (
                            <SortAsc size={14} />
                          ) : (
                            <SortDesc size={14} />
                          ))}
                      </button>
                    </th>
                    <th className="px-4 py-3 text-right w-28">
                      <button
                        onClick={() => handleSort('inv_val')}
                        className="flex items-center gap-2 hover:text-foreground ml-auto"
                      >
                        <DollarSign size={14} />
                        Total
                        {sortConfig.key === 'inv_val' &&
                          (sortConfig.direction === 'asc' ? (
                            <SortAsc size={14} />
                          ) : (
                            <SortDesc size={14} />
                          ))}
                      </button>
                    </th>
                    <th className="px-4 py-3 text-center w-20">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedReports.length === 0 ? (
                    <tr>
                      <td
                        colSpan={12}
                        className="px-4 py-8 text-center text-muted-foreground"
                      >
                        No reports found
                      </td>
                    </tr>
                  ) : (
                    sortedReports.map(report => (
                      <tr
                        key={report.id}
                        className="border-b border-border hover:bg-muted/30"
                      >
                        <td className="px-4 py-3 w-48">
                          <div
                            className="text-sm text-foreground truncate"
                            title={report.cust_name}
                          >
                            {report.cust_name}
                          </div>
                          <div
                            className="text-xs text-muted-foreground truncate"
                            title={report.cust_code}
                          >
                            {report.cust_code}
                          </div>
                        </td>
                        <td className="px-4 py-3 w-24">
                          <div className="text-sm text-foreground">
                            {new Date(report.inv_date).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="px-4 py-3 w-32">
                          <div
                            className="text-sm font-medium text-foreground truncate"
                            title={report.invno}
                          >
                            {report.invno}
                          </div>
                        </td>
                        <td className="px-4 py-3 w-24">
                          <div
                            className="text-sm text-foreground truncate"
                            title={report.part_code || '-'}
                          >
                            {report.part_code || '-'}
                          </div>
                        </td>
                        <td className="px-4 py-3 w-40">
                          <div
                            className="text-sm text-foreground truncate"
                            title={report.part_name || '-'}
                          >
                            {report.part_name || '-'}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right w-20">
                          <div className="text-sm text-foreground">
                            {(report.qty || 0).toLocaleString()}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right w-24">
                          <div className="text-sm text-foreground">
                            ₹{(report.bas_price || 0).toLocaleString()}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right w-24">
                          <div className="text-sm text-foreground">
                            ₹{(report.c_gst || 0).toLocaleString()}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right w-24">
                          <div className="text-sm text-foreground">
                            ₹{(report.s_gst || 0).toLocaleString()}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right w-24">
                          <div className="text-sm text-foreground">
                            ₹{(report.igst || 0).toLocaleString()}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right w-28">
                          <div className="font-medium text-foreground">
                            ₹{(report.inv_val || 0).toLocaleString()}
                          </div>
                        </td>
                        <td className="px-4 py-3 w-20">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleDeleteReport(report.id)}
                              className="p-1 text-muted-foreground hover:text-destructive transition-colors"
                              aria-label="Delete report"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {renderPagination()}
        </>
      )}
    </div>
  );
};
