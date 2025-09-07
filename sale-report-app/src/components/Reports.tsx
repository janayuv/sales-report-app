import React, { useState, useEffect, useCallback } from 'react';
import type { SalesReport } from '../utils/database';
import { dbManager } from '../utils/database';
import { useCompanyContext } from '../contexts/CompanyContext';
import {
  Search,
  Upload,
  Download,
  FileText,
  Settings,
  Trash2,
  Calendar,
  DollarSign,
  Package,
  Filter,
  SortAsc,
  SortDesc,
  ChevronDown,
  X,
} from 'lucide-react';
import {
  downloadExcelFile,
  downloadCSVFile,
  downloadJSONFile,
  downloadPDFFile,
  downloadFormattedExcel,
  selectFile,
  readExcelFile,
} from '../utils/fileUtils';
import { showToast } from './Toast';
import { TransformationDialog } from './TransformationDialog';
import { Analytics } from './Analytics';
import type { TransformationResult } from '../utils/transformation';

export const Reports: React.FC = () => {
  const { selectedCompany } = useCompanyContext();
  const [reports, setReports] = useState<SalesReport[]>([]);
  const [filteredReports, setFilteredReports] = useState<SalesReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [globalFilter, setGlobalFilter] = useState('');
  const [showImportMenu, setShowImportMenu] = useState(false);
  const [showTransformationDialog, setShowTransformationDialog] =
    useState(false);
  const [transformationData, setTransformationData] = useState<{
    inputData: any[];
    sourceHeaders: string[];
  } | null>(null);

  // Advanced filtering state
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    customer: '',
    invoice: '',
    minAmount: '',
    maxAmount: '',
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

  const loadReports = useCallback(async () => {
    if (!selectedCompany) return;

    try {
      setLoading(true);
      console.log(
        'Loading reports for company:',
        selectedCompany.id,
        selectedCompany.name
      );
      const reportsList = await dbManager.getSalesReportsByCompany(
        selectedCompany.id
      );
      console.log('Loaded reports:', reportsList.length, reportsList);
      setReports(reportsList);
      setFilteredReports(reportsList);
    } catch (error) {
      console.error('Failed to load reports:', error);
      showToast.error('Failed to load sales reports');
    } finally {
      setLoading(false);
    }
  }, [selectedCompany]);

  // Apply filters and sorting
  useEffect(() => {
    let filtered = [...reports];

    // Apply global search filter
    if (globalFilter.trim()) {
      const searchTerm = globalFilter.toLowerCase();
      filtered = filtered.filter(
        report =>
          report.cust_name?.toLowerCase().includes(searchTerm) ||
          report.cust_code?.toLowerCase().includes(searchTerm) ||
          report.invno?.toLowerCase().includes(searchTerm) ||
          report.part_name?.toLowerCase().includes(searchTerm) ||
          report.part_code?.toLowerCase().includes(searchTerm)
      );
    }

    // Apply advanced filters
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
      filtered = filtered.filter(
        report =>
          report.cust_name
            ?.toLowerCase()
            .includes(filters.customer.toLowerCase()) ||
          report.cust_code
            ?.toLowerCase()
            .includes(filters.customer.toLowerCase())
      );
    }
    if (filters.invoice) {
      filtered = filtered.filter(report =>
        report.invno?.toLowerCase().includes(filters.invoice.toLowerCase())
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

    // Apply sorting
    if (sortConfig.key) {
      filtered.sort((a, b) => {
        const aVal = a[sortConfig.key!];
        const bVal = b[sortConfig.key!];

        if (aVal === null || aVal === undefined) return 1;
        if (bVal === null || bVal === undefined) return -1;

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
    }

    setFilteredReports(filtered);
  }, [reports, globalFilter, filters, sortConfig]);

  // Handle column sorting
  const handleSort = (key: keyof SalesReport) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      dateFrom: '',
      dateTo: '',
      customer: '',
      invoice: '',
      minAmount: '',
      maxAmount: '',
    });
    setGlobalFilter('');
  };

  // Check if any filters are active
  const hasActiveFilters = () => {
    return (
      globalFilter.trim() !== '' ||
      Object.values(filters).some(value => value.trim() !== '')
    );
  };

  // Export handlers
  const handleExport = (format: string) => {
    if (filteredReports.length === 0) {
      showToast.error('No reports to export');
      return;
    }

    const timestamp = new Date().toISOString().split('T')[0];
    const companyName =
      selectedCompany?.name.replace(/[^a-zA-Z0-9]/g, '_') || 'company';
    const baseFilename = `${companyName}_sales_reports_${timestamp}`;

    try {
      switch (format) {
        case 'excel':
          downloadExcelFile(filteredReports, `${baseFilename}.xlsx`);
          showToast.success('Excel file exported successfully');
          break;
        case 'excel-formatted':
          downloadFormattedExcel(
            filteredReports,
            `${baseFilename}_formatted.xlsx`
          );
          showToast.success('Formatted Excel file exported successfully');
          break;
        case 'csv':
          downloadCSVFile(filteredReports, `${baseFilename}.csv`);
          showToast.success('CSV file exported successfully');
          break;
        case 'json':
          downloadJSONFile(filteredReports, `${baseFilename}.json`);
          showToast.success('JSON file exported successfully');
          break;
        case 'pdf':
          downloadPDFFile(
            filteredReports,
            `${baseFilename}.html`,
            'Sales Reports'
          );
          showToast.success('PDF (HTML) file exported successfully');
          break;
        default:
          showToast.error('Unknown export format');
      }
    } catch (error) {
      console.error('Export error:', error);
      showToast.error('Failed to export reports');
    }

    setShowExportMenu(false);
  };

  const searchReports = useCallback(
    async (searchTerm: string) => {
      if (!selectedCompany) return;

      try {
        setLoading(true);
        if (searchTerm.trim()) {
          const reportsList = await dbManager.searchSalesReports(
            selectedCompany.id,
            searchTerm
          );
          setReports(reportsList);
        } else {
          await loadReports();
        }
      } catch (error) {
        console.error('Failed to search reports:', error);
        showToast.error('Failed to search sales reports');
      } finally {
        setLoading(false);
      }
    },
    [selectedCompany, loadReports]
  );

  useEffect(() => {
    if (selectedCompany) {
      loadReports();
    }
  }, [selectedCompany, loadReports]);

  // Debounced search effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchReports(globalFilter);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [globalFilter, searchReports]);

  // Close import menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showImportMenu) {
        const target = event.target as any;
        const importButton = document.querySelector(
          '[data-import-menu-trigger]'
        );
        const importMenu = document.querySelector('[data-import-menu]');

        // Don't close if clicking on the button or menu itself
        if (importButton?.contains(target) || importMenu?.contains(target)) {
          return;
        }

        console.log('Clicking outside import menu, closing...');
        setShowImportMenu(false);
      }
    };

    if (showImportMenu) {
      // Use a small delay to prevent immediate closure
      setTimeout(() => {
        document.addEventListener('click', handleClickOutside);
      }, 100);
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [showImportMenu]);

  // Close export menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showExportMenu) {
        const target = event.target as any;
        const exportButton = target.closest('.relative');

        if (!exportButton) {
          setShowExportMenu(false);
        }
      }
    };

    if (showExportMenu) {
      setTimeout(() => {
        document.addEventListener('click', handleClickOutside);
      }, 100);
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [showExportMenu]);

  const handleImportReports = async () => {
    console.log('handleImportReports called');
    console.log('Selected company:', selectedCompany);

    if (!selectedCompany) {
      console.log('No company selected');
      showToast.error('Please select a company first.');
      return;
    }

    try {
      // Check if database is available
      console.log('Checking database initialization...');
      if (!dbManager.isInitialized()) {
        console.log('Database not initialized');
        showToast.error(
          'Database not initialized. Please refresh the page and try again.'
        );
        return;
      }

      console.log('Opening file dialog...');
      const file = await selectFile('.xlsx,.xls');
      console.log('File selection result:', file);
      if (!file) {
        console.log('No file selected');
        return;
      }

      // Validate file type
      const fileName = file.name.toLowerCase();
      if (!fileName.endsWith('.xlsx') && !fileName.endsWith('.xls')) {
        showToast.error('Please select an Excel file (.xlsx or .xls).');
        return;
      }

      console.log('Reading Excel file...');
      const excelData = await readExcelFile(file);
      console.log('Excel data loaded:', excelData.length, 'rows');

      // Basic validation of Excel content
      if (!excelData || excelData.length === 0) {
        showToast.error('The selected file is empty.');
        return;
      }

      if (excelData.length < 1) {
        showToast.error('Excel file must contain at least one data row.');
        return;
      }

      const toastId = showToast.loading('Importing sales reports...');
      setLoading(true);

      console.log(
        'Importing Excel for company:',
        selectedCompany.name,
        'ID:',
        selectedCompany.id
      );
      console.log('Excel data preview:', JSON.stringify(excelData[0], null, 2));

      // Convert Excel data to CSV format for import (handling line breaks and currency symbols)
      const headers = Object.keys(excelData[0]);
      const csvData = [
        headers.join(','),
        ...excelData.map(row =>
          headers
            .map(header => {
              const value = row[header];
              if (value === null || value === undefined) return '';
              
              // Convert to string and clean the value
              let strValue = String(value);
              
              // Remove currency symbols
              strValue = strValue.replace(/[₹$€£¥]/g, '');
              
              // Replace line breaks with spaces and normalize whitespace
              strValue = strValue
                .replace(/\r?\n/g, ' ')
                .replace(/\s+/g, ' ')
                .trim();
              
              // Handle commas and quotes by wrapping in quotes
              if (
                typeof strValue === 'string' &&
                (strValue.includes(',') || strValue.includes('"'))
              ) {
                return `"${strValue.replace(/"/g, '""')}"`;
              }
              return strValue;
            })
            .join(',')
        ),
      ].join('\n');

      const importedCount = await dbManager.importSalesReportsCSV(
        selectedCompany.id,
        csvData
      );

      if (importedCount > 0) {
        showToast.dismiss(toastId);
        showToast.success(
          `Successfully imported ${importedCount} sales reports.`
        );
        console.log('Reloading reports after import...');
        await loadReports();
        console.log('Reports reloaded after import');
      } else {
        showToast.dismiss(toastId);
        showToast.warning(
          "No new reports were imported. This could be because:\n• All reports already exist in the database\n• CSV format doesn't match expected columns\n• Required fields (invoice number, customer) are missing\n• Check the console for detailed import logs"
        );
      }
    } catch (error) {
      console.error('Failed to import reports:', error);

      // Provide more specific error messages
      let errorMessage = 'Failed to import sales reports.';
      if (error instanceof Error) {
        if (error.message.includes('invoke')) {
          errorMessage =
            'Backend service not available. Please make sure the application is running in Tauri mode.';
        } else if (error.message.includes('parse')) {
          errorMessage =
            'Invalid CSV format. Please check the file format and try again.';
        } else {
          errorMessage = `Import failed: ${error.message}`;
        }
      }

      showToast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleImportWithTransformation = async () => {
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

      setTransformationData({ inputData: data, sourceHeaders: headers });
      setShowTransformationDialog(true);
      setShowImportMenu(false);
    } catch (error) {
      console.error('Failed to parse Excel file:', error);
      showToast.error(
        'Failed to parse Excel file. Please check the file format and try again.'
      );
    }
  };

  const handleTransformationComplete = async (result: TransformationResult) => {
    if (!selectedCompany || !result.success) {
      showToast.error(
        'Transformation failed. Please fix errors and try again.'
      );
      return;
    }

    try {
      const toastId = showToast.loading('Importing transformed data...');
      setLoading(true);

      // Convert transformed data to CSV format for import
      const csvContent = generateCSVForImport(result.data);

      const importedCount = await dbManager.importSalesReportsCSV(
        selectedCompany.id,
        csvContent
      );

      if (importedCount > 0) {
        showToast.dismiss(toastId);
        showToast.success(
          `Successfully imported ${importedCount} sales reports from transformed data.`
        );
        await loadReports();
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
      setShowTransformationDialog(false);
      setTransformationData(null);
    }
  };

  const generateCSVForImport = (data: any[]): string => {
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

  const handleDeleteReport = async (reportId: number) => {
    if (!window.confirm('Are you sure you want to delete this report?')) return;

    try {
      await dbManager.deleteSalesReport(reportId);
      showToast.success('Report deleted successfully');
      await loadReports();
    } catch (error) {
      console.error('Failed to delete report:', error);
      showToast.error('Failed to delete report');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading sales reports...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Sales Reports</h2>
          <p className="text-muted-foreground">
            Manage sales reports for {selectedCompany?.name}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative">
            <button
              data-import-menu-trigger
              onClick={() => {
                console.log(
                  'Import button clicked, current state:',
                  showImportMenu
                );
                const newState = !showImportMenu;
                console.log('Setting showImportMenu to:', newState);
                setShowImportMenu(newState);
              }}
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2 border border-border rounded-md hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Upload size={16} />
              Import Reports
            </button>

            {showImportMenu && (
              <div
                data-import-menu
                className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg z-[9999] min-w-max"
              >
                <button
                  onClick={() => {
                    console.log('Import from CSV clicked');
                    handleImportReports();
                    setShowImportMenu(false);
                  }}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center gap-2"
                >
                  <Upload size={14} />
                  Import from Excel
                </button>
                <button
                  onClick={() => {
                    console.log('Import with Transformation clicked');
                    handleImportWithTransformation();
                    setShowImportMenu(false);
                  }}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center gap-2"
                >
                  <Settings size={14} />
                  Import with Transformation
                </button>
                <button
                  onClick={() => {
                    handleDownloadTemplate();
                    setShowImportMenu(false);
                  }}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center gap-2"
                >
                  <FileText size={14} />
                  Download Template
                </button>
              </div>
            )}
          </div>

          <div className="relative">
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              disabled={loading || filteredReports.length === 0}
              className="inline-flex items-center gap-2 px-4 py-2 border border-border rounded-md hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download size={16} />
              Export Reports
              <ChevronDown size={14} />
            </button>

            {showExportMenu && (
              <div className="absolute right-0 top-full mt-1 w-48 bg-card border border-border rounded-md shadow-lg z-10">
                <div className="py-1">
                  <button
                    onClick={() => handleExport('excel')}
                    className="w-full text-left px-4 py-2 text-sm hover:bg-accent transition-colors"
                  >
                    📊 Excel (.xlsx)
                  </button>
                  <button
                    onClick={() => handleExport('excel-formatted')}
                    className="w-full text-left px-4 py-2 text-sm hover:bg-accent transition-colors"
                  >
                    📋 Formatted Excel
                  </button>
                  <button
                    onClick={() => handleExport('csv')}
                    className="w-full text-left px-4 py-2 text-sm hover:bg-accent transition-colors"
                  >
                    📄 CSV (.csv)
                  </button>
                  <button
                    onClick={() => handleExport('json')}
                    className="w-full text-left px-4 py-2 text-sm hover:bg-accent transition-colors"
                  >
                    📋 JSON (.json)
                  </button>
                  <button
                    onClick={() => handleExport('pdf')}
                    className="w-full text-left px-4 py-2 text-sm hover:bg-accent transition-colors"
                  >
                    📄 PDF (.html)
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border">
        <button
          onClick={() => setActiveTab('reports')}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'reports'
              ? 'text-primary border-b-2 border-primary'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          📊 Reports
        </button>
        <button
          onClick={() => setActiveTab('analytics')}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'analytics'
              ? 'text-primary border-b-2 border-primary'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          📈 Analytics
        </button>
      </div>

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <Analytics reports={filteredReports} loading={loading} />
      )}

      {/* Reports Tab */}
      {activeTab === 'reports' && (
        <>
          {/* Summary Statistics */}
          {reports.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-card p-4 rounded-lg border border-border">
                <div className="flex items-center gap-3">
                  <FileText className="text-primary" size={20} />
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {hasActiveFilters()
                        ? 'Filtered Reports'
                        : 'Total Reports'}
                    </p>
                    <p className="text-xl font-bold text-foreground">
                      {filteredReports.length}
                      {hasActiveFilters() && (
                        <span className="text-sm text-muted-foreground ml-1">
                          of {reports.length}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-card p-4 rounded-lg border border-border">
                <div className="flex items-center gap-3">
                  <DollarSign className="text-green-500" size={20} />
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {hasActiveFilters() ? 'Filtered Value' : 'Total Value'}
                    </p>
                    <p className="text-xl font-bold text-foreground">
                      ₹
                      {filteredReports
                        .reduce((sum, report) => sum + (report.inv_val || 0), 0)
                        .toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-card p-4 rounded-lg border border-border">
                <div className="flex items-center gap-3">
                  <Package className="text-blue-500" size={20} />
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {hasActiveFilters()
                        ? 'Filtered Assessable Value'
                        : 'Total Assessable Value'}
                    </p>
                    <p className="text-xl font-bold text-foreground">
                      ₹
                      {filteredReports
                        .reduce((sum, report) => sum + (report.ass_val || 0), 0)
                        .toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-card p-4 rounded-lg border border-border">
                <div className="flex items-center gap-3">
                  <Calendar className="text-purple-500" size={20} />
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {hasActiveFilters()
                        ? 'Filtered Tax Total'
                        : 'Total Tax Amount'}
                    </p>
                    <p className="text-xl font-bold text-foreground">
                      ₹
                      {filteredReports
                        .reduce(
                          (sum, report) =>
                            sum +
                            (report.c_gst || 0) +
                            (report.s_gst || 0) +
                            (report.igst || 0),
                          0
                        )
                        .toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Search and Filters */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"
                  size={16}
                />
                <input
                  type="text"
                  placeholder="Search reports..."
                  value={globalFilter}
                  onChange={e => setGlobalFilter(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`flex items-center gap-2 px-4 py-2 border rounded-md transition-colors ${
                    showFilters || hasActiveFilters()
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border hover:bg-accent'
                  }`}
                >
                  <Filter size={16} />
                  Filters
                  {hasActiveFilters() && (
                    <span className="bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full">
                      Active
                    </span>
                  )}
                </button>

                {hasActiveFilters() && (
                  <button
                    onClick={clearFilters}
                    className="flex items-center gap-2 px-4 py-2 border border-border rounded-md hover:bg-accent transition-colors"
                  >
                    <X size={16} />
                    Clear
                  </button>
                )}
              </div>
            </div>

            {/* Advanced Filters */}
            {showFilters && (
              <div className="bg-card border border-border rounded-lg p-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label
                      htmlFor="dateFrom"
                      className="block text-sm font-medium text-foreground mb-2"
                    >
                      Date From
                    </label>
                    <input
                      id="dateFrom"
                      type="date"
                      value={filters.dateFrom}
                      onChange={e =>
                        setFilters(prev => ({
                          ...prev,
                          dateFrom: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="dateTo"
                      className="block text-sm font-medium text-foreground mb-2"
                    >
                      Date To
                    </label>
                    <input
                      id="dateTo"
                      type="date"
                      value={filters.dateTo}
                      onChange={e =>
                        setFilters(prev => ({
                          ...prev,
                          dateTo: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="customerFilter"
                      className="block text-sm font-medium text-foreground mb-2"
                    >
                      Customer
                    </label>
                    <input
                      id="customerFilter"
                      type="text"
                      placeholder="Customer name or code"
                      value={filters.customer}
                      onChange={e =>
                        setFilters(prev => ({
                          ...prev,
                          customer: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="invoiceFilter"
                      className="block text-sm font-medium text-foreground mb-2"
                    >
                      Invoice Number
                    </label>
                    <input
                      id="invoiceFilter"
                      type="text"
                      placeholder="Invoice number"
                      value={filters.invoice}
                      onChange={e =>
                        setFilters(prev => ({
                          ...prev,
                          invoice: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="minAmountFilter"
                      className="block text-sm font-medium text-foreground mb-2"
                    >
                      Min Amount
                    </label>
                    <input
                      id="minAmountFilter"
                      type="number"
                      placeholder="Minimum amount"
                      value={filters.minAmount}
                      onChange={e =>
                        setFilters(prev => ({
                          ...prev,
                          minAmount: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="maxAmountFilter"
                      className="block text-sm font-medium text-foreground mb-2"
                    >
                      Max Amount
                    </label>
                    <input
                      id="maxAmountFilter"
                      type="number"
                      placeholder="Maximum amount"
                      value={filters.maxAmount}
                      onChange={e =>
                        setFilters(prev => ({
                          ...prev,
                          maxAmount: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Table */}
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50 border-b border-border">
                  <tr>
                    <th
                      className="px-4 py-3 text-left text-sm font-medium text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
                      onClick={() => handleSort('cust_name')}
                    >
                      <div className="flex items-center gap-2">
                        Customer
                        {sortConfig.key === 'cust_name' &&
                          (sortConfig.direction === 'asc' ? (
                            <SortAsc size={14} />
                          ) : (
                            <SortDesc size={14} />
                          ))}
                      </div>
                    </th>
                    <th
                      className="px-4 py-3 text-left text-sm font-medium text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
                      onClick={() => handleSort('invno')}
                    >
                      <div className="flex items-center gap-2">
                        Invoice No
                        {sortConfig.key === 'invno' &&
                          (sortConfig.direction === 'asc' ? (
                            <SortAsc size={14} />
                          ) : (
                            <SortDesc size={14} />
                          ))}
                      </div>
                    </th>
                    <th
                      className="px-4 py-3 text-left text-sm font-medium text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
                      onClick={() => handleSort('inv_date')}
                    >
                      <div className="flex items-center gap-2">
                        Date
                        {sortConfig.key === 'inv_date' &&
                          (sortConfig.direction === 'asc' ? (
                            <SortAsc size={14} />
                          ) : (
                            <SortDesc size={14} />
                          ))}
                      </div>
                    </th>
                    <th
                      className="px-4 py-3 text-left text-sm font-medium text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
                      onClick={() => handleSort('ass_val')}
                    >
                      <div className="flex items-center gap-2">
                        Assessable Value
                        {sortConfig.key === 'ass_val' &&
                          (sortConfig.direction === 'asc' ? (
                            <SortAsc size={14} />
                          ) : (
                            <SortDesc size={14} />
                          ))}
                      </div>
                    </th>
                    <th
                      className="px-4 py-3 text-left text-sm font-medium text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
                      onClick={() => handleSort('c_gst')}
                    >
                      <div className="flex items-center gap-2">
                        CGST
                        {sortConfig.key === 'c_gst' &&
                          (sortConfig.direction === 'asc' ? (
                            <SortAsc size={14} />
                          ) : (
                            <SortDesc size={14} />
                          ))}
                      </div>
                    </th>
                    <th
                      className="px-4 py-3 text-left text-sm font-medium text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
                      onClick={() => handleSort('s_gst')}
                    >
                      <div className="flex items-center gap-2">
                        SGST
                        {sortConfig.key === 's_gst' &&
                          (sortConfig.direction === 'asc' ? (
                            <SortAsc size={14} />
                          ) : (
                            <SortDesc size={14} />
                          ))}
                      </div>
                    </th>
                    <th
                      className="px-4 py-3 text-left text-sm font-medium text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
                      onClick={() => handleSort('igst')}
                    >
                      <div className="flex items-center gap-2">
                        IGST
                        {sortConfig.key === 'igst' &&
                          (sortConfig.direction === 'asc' ? (
                            <SortAsc size={14} />
                          ) : (
                            <SortDesc size={14} />
                          ))}
                      </div>
                    </th>
                    <th
                      className="px-4 py-3 text-left text-sm font-medium text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
                      onClick={() => handleSort('inv_val')}
                    >
                      <div className="flex items-center gap-2">
                        Invoice Total
                        {sortConfig.key === 'inv_val' &&
                          (sortConfig.direction === 'asc' ? (
                            <SortAsc size={14} />
                          ) : (
                            <SortDesc size={14} />
                          ))}
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredReports.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-4 py-12 text-center">
                        <div className="flex flex-col items-center gap-4">
                          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
                            <FileText
                              size={32}
                              className="text-muted-foreground"
                            />
                          </div>
                          <div>
                            <h3 className="text-lg font-medium text-foreground mb-2">
                              {hasActiveFilters()
                                ? 'No reports match your filters'
                                : 'No sales reports yet'}
                            </h3>
                            <p className="text-muted-foreground mb-4">
                              {hasActiveFilters()
                                ? 'Try adjusting your search criteria or clear filters to see all reports.'
                                : 'Import your first Excel file to start managing sales reports.'}
                            </p>
                            {hasActiveFilters() ? (
                              <button
                                onClick={clearFilters}
                                className="inline-flex items-center gap-2 px-4 py-2 border border-border rounded-md hover:bg-accent transition-colors"
                              >
                                <X size={16} />
                                Clear Filters
                              </button>
                            ) : (
                              <button
                                onClick={() => setShowImportMenu(true)}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                              >
                                <Upload size={16} />
                                Import Reports
                              </button>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredReports.map(report => (
                      <tr
                        key={report.id}
                        className="border-t border-border hover:bg-muted/50 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <div className="font-medium text-foreground">
                            {report.cust_name}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {report.cust_code}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-medium text-foreground">
                            {report.invno}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            RE: {report.RE}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm text-foreground">
                            {report.inv_date
                              ? new Date(report.inv_date).toLocaleDateString()
                              : '-'}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-medium text-foreground">
                            ₹{(report.ass_val || 0).toLocaleString()}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm text-foreground">
                            ₹{(report.c_gst || 0).toLocaleString()}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm text-foreground">
                            ₹{(report.s_gst || 0).toLocaleString()}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm text-foreground">
                            ₹{(report.igst || 0).toLocaleString()}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-medium text-foreground">
                            ₹{(report.inv_val || 0).toLocaleString()}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
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
          {reports.length > 0 && (
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <div>
                Showing {filteredReports.length} of {reports.length} reports
                {hasActiveFilters() && (
                  <span className="ml-2 text-primary">(filtered)</span>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* Transformation Dialog */}
      {transformationData && (
        <TransformationDialog
          isOpen={showTransformationDialog}
          onClose={() => {
            setShowTransformationDialog(false);
            setTransformationData(null);
          }}
          inputData={transformationData.inputData}
          sourceHeaders={transformationData.sourceHeaders}
          onTransformComplete={handleTransformationComplete}
        />
      )}
    </div>
  );
};
