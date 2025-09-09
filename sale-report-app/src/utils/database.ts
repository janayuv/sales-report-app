import { invoke } from '@tauri-apps/api/core';

// Database schema types
export interface Company {
  id: number;
  name: string;
  key: string;
  created_at: string;
}

export interface Customer {
  id: number;
  company_id: number;
  customer_name: string;
  tally_name: string;
  gst_no?: string;
  category_id?: number;
  category_name?: string;
  created_at: string;
}

export interface Category {
  id: number;
  company_id: number;
  name: string;
  description?: string;
  created_at: string;
}

export interface SalesReport {
  id: number;
  company_id: number;
  cust_code: string;
  cust_name: string;
  inv_date: string;
  RE: string;
  invno: string;
  part_code?: string;
  part_name?: string;
  tariff?: string;
  qty: number;
  bas_price: number;
  ass_val: number;
  c_gst: number;
  s_gst: number;
  igst: number;
  amot: number;
  inv_val: number;
  igst_yes_no: string;
  percentage: number;
  created_at: string;
}

export interface SalesReportFilters {
  date_from?: string;
  date_to?: string;
  customer?: string;
  invoice?: string;
  min_amount?: number;
  max_amount?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface UploadedReport {
  id: number;
  company_id: number;
  filename: string;
  uploaded_at: string;
  status: string;
  parsed_hash?: string;
}

export interface ReportRow {
  id: number;
  uploaded_report_id: number;
  invoice_no: string;
  invoice_date: string;
  customer_name_raw: string;
  gst_rate: number;
  cgst_amt: number;
  sgst_amt: number;
  igst_amt: number;
  total_amount: number;
  extra_json?: string;
}

export interface TallyExport {
  id: number;
  company_id: number;
  uploaded_report_id: number;
  generated_at: string;
  file_path: string;
  notes?: string;
}

export interface AuditLog {
  id: number;
  company_id: number;
  user_action: string;
  details_json: string;
  timestamp: string;
}

export interface InvoiceMapping {
  id: number;
  company_id: number;
  original_invoice_no: string;
  split_invoice_no: string;
  gst_rate: number;
  created_at: string;
}

class DatabaseManager {
  private initialized = false;
  private devCompanies: Company[] = [];
  private devSalesReports: SalesReport[] = [];
  private readonly DEV_COMPANIES_KEY = 'sales_report_dev_companies';
  private readonly DEV_SALES_REPORTS_KEY = 'sales_report_dev_sales_reports';

  constructor() {
    this.loadDevCompaniesFromStorage();
    this.loadDevSalesReportsFromStorage();
  }

  private loadDevCompaniesFromStorage(): void {
    try {
      const stored = localStorage.getItem(this.DEV_COMPANIES_KEY);
      if (stored) {
        this.devCompanies = JSON.parse(stored);
        console.log(
          'Loaded companies from localStorage:',
          this.devCompanies.length
        );
      } else {
        // Initialize with default demo companies
        this.devCompanies = [
          {
            id: 1,
            key: 'demo-company-1',
            name: 'Demo Company 1',
            created_at: new Date().toISOString(),
          },
          {
            id: 2,
            key: 'demo-company-2',
            name: 'Demo Company 2',
            created_at: new Date().toISOString(),
          },
        ];
        this.saveDevCompaniesToStorage();
        console.log('Initialized with default demo companies');
      }
    } catch (error) {
      console.error('Failed to load companies from localStorage:', error);
      // Fallback to default companies
      this.devCompanies = [
        {
          id: 1,
          key: 'demo-company-1',
          name: 'Demo Company 1',
          created_at: new Date().toISOString(),
        },
        {
          id: 2,
          key: 'demo-company-2',
          name: 'Demo Company 2',
          created_at: new Date().toISOString(),
        },
      ];
    }
  }

  private saveDevCompaniesToStorage(): void {
    try {
      localStorage.setItem(
        this.DEV_COMPANIES_KEY,
        JSON.stringify(this.devCompanies)
      );
      console.log('Saved companies to localStorage:', this.devCompanies.length);
    } catch (error) {
      console.error('Failed to save companies to localStorage:', error);
    }
  }

  // Development mode utility methods
  resetDevCompaniesToDefault(): void {
    this.devCompanies = [
      {
        id: 1,
        key: 'demo-company-1',
        name: 'Demo Company 1',
        created_at: new Date().toISOString(),
      },
      {
        id: 2,
        key: 'demo-company-2',
        name: 'Demo Company 2',
        created_at: new Date().toISOString(),
      },
    ];
    this.saveDevCompaniesToStorage();
    console.log('Reset companies to default values');
  }

  clearDevCompaniesStorage(): void {
    try {
      localStorage.removeItem(this.DEV_COMPANIES_KEY);
      console.log('Cleared companies from localStorage');
    } catch (error) {
      console.error('Failed to clear companies from localStorage:', error);
    }
  }

  private loadDevSalesReportsFromStorage(): void {
    try {
      const stored = localStorage.getItem(this.DEV_SALES_REPORTS_KEY);
      if (stored) {
        this.devSalesReports = JSON.parse(stored);
        console.log(
          'Loaded sales reports from localStorage:',
          this.devSalesReports.length
        );
      }
    } catch (error) {
      console.error('Failed to load sales reports from localStorage:', error);
      this.devSalesReports = [];
    }
  }

  private saveDevSalesReportsToStorage(): void {
    try {
      localStorage.setItem(
        this.DEV_SALES_REPORTS_KEY,
        JSON.stringify(this.devSalesReports)
      );
      console.log(
        'Saved sales reports to localStorage:',
        this.devSalesReports.length
      );
    } catch (error) {
      console.error('Failed to save sales reports to localStorage:', error);
    }
  }

  private clearDevSalesReportsStorage(): void {
    localStorage.removeItem(this.DEV_SALES_REPORTS_KEY);
  }

  // Development utility methods
  clearDevSalesReports(): void {
    this.devSalesReports = [];
    this.clearDevSalesReportsStorage();
    console.log('Cleared all sales reports from development storage');
  }

  // Clear all data from database
  async clearAllData(): Promise<void> {
    try {
      if ((window as unknown as { __TAURI__?: unknown }).__TAURI__) {
        console.log('Clearing all database data...');
        await invoke('clear_all_data');
        console.log('All data cleared from database successfully');

        // Clear any localStorage data that might be cached
        localStorage.removeItem('selectedCompanyKey');
        localStorage.removeItem('companies');
        localStorage.removeItem('customers');
        localStorage.removeItem('salesReports');
        console.log('LocalStorage cache cleared');
      } else {
        console.warn('Database clear not available in web mode');
        // In web mode, clear localStorage data
        localStorage.clear();
        console.log('LocalStorage cleared in web mode');
      }
    } catch (error) {
      console.error('Failed to clear database:', error);
      throw error;
    }
  }

  // Data migration utility to fix field names
  migrateFieldNames(): void {
    console.log('Starting field name migration...');
    let migratedCount = 0;

    this.devSalesReports.forEach(report => {
      let needsMigration = false;

      // Check if report has old field names with spaces
      if (Object.prototype.hasOwnProperty.call(report, 'c gst')) {
        report.c_gst = (report as unknown as Record<string, unknown>)[
          'c gst'
        ] as number;
        delete (report as unknown as Record<string, unknown>)['c gst'];
        needsMigration = true;
      }

      if (Object.prototype.hasOwnProperty.call(report, 's gst')) {
        report.s_gst = (report as unknown as Record<string, unknown>)[
          's gst'
        ] as number;
        delete (report as unknown as Record<string, unknown>)['s gst'];
        needsMigration = true;
      }

      if (Object.prototype.hasOwnProperty.call(report, 'igst yes/no')) {
        report.igst_yes_no = (report as unknown as Record<string, unknown>)[
          'igst yes/no'
        ] as string;
        delete (report as unknown as Record<string, unknown>)['igst yes/no'];
        needsMigration = true;
      }

      if (needsMigration) {
        migratedCount++;
      }
    });

    if (migratedCount > 0) {
      this.saveDevSalesReportsToStorage();
      console.log(`Migrated ${migratedCount} reports with old field names`);
    } else {
      console.log('No reports needed migration');
    }
  }

  async initialize(): Promise<void> {
    try {
      // Test connection by getting companies
      await this.getCompanies();

      // Run data migration for field names
      this.migrateFieldNames();

      this.initialized = true;
      console.log('Database initialized successfully');
    } catch (error) {
      console.error('Failed to initialize database:', error);
      throw error;
    }
  }

  // Company operations
  async getCompanies(): Promise<Company[]> {
    try {
      // Check if we're running in Tauri
      if (
        typeof window !== 'undefined' &&
        (window as unknown as { __TAURI__?: unknown }).__TAURI__
      ) {
        return await invoke('get_companies');
      } else {
        // Fallback for development mode - return demo companies
        console.warn('Running in development mode - returning demo companies');
        return [...this.devCompanies];
      }
    } catch (error) {
      console.error('Failed to get companies:', error);
      throw error;
    }
  }

  async updateCompany(
    id: number,
    company: { name?: string; key?: string }
  ): Promise<boolean> {
    try {
      // Check if we're running in Tauri
      if (
        typeof window !== 'undefined' &&
        (window as unknown as { __TAURI__?: unknown }).__TAURI__
      ) {
        return await invoke('update_company', { id, company });
      } else {
        // Fallback for development mode - actually update the in-memory companies
        console.warn(
          'Running in development mode - updating in-memory companies'
        );
        console.log(`Updating company ${id} with:`, company);

        const companyIndex = this.devCompanies.findIndex(c => c.id === id);
        if (companyIndex === -1) {
          console.error(`Company with id ${id} not found`);
          return false;
        }

        // Update the company in the in-memory array
        if (company.name !== undefined) {
          this.devCompanies[companyIndex].name = company.name;
        }
        if (company.key !== undefined) {
          this.devCompanies[companyIndex].key = company.key;
        }

        // Save to localStorage for persistence
        this.saveDevCompaniesToStorage();

        console.log('Updated company:', this.devCompanies[companyIndex]);
        return true;
      }
    } catch (error) {
      console.error('Failed to update company:', error);
      throw error;
    }
  }

  async getCompanyById(id: number): Promise<Company | null> {
    try {
      const companies = await this.getCompanies();
      return companies.find(c => c.id === id) || null;
    } catch (error) {
      console.error('Failed to get company by ID:', error);
      throw error;
    }
  }

  async getCompanyByKey(key: string): Promise<Company | null> {
    try {
      const companies = await this.getCompanies();
      return companies.find(c => c.key === key) || null;
    } catch (error) {
      console.error('Failed to get company by key:', error);
      throw error;
    }
  }

  // Customer operations
  async getCustomersByCompany(companyId: number): Promise<Customer[]> {
    try {
      return await invoke('get_customers_by_company', { companyId });
    } catch (error) {
      console.error('Failed to get customers by company:', error);
      throw error;
    }
  }

  async searchCustomers(
    companyId: number,
    searchTerm: string
  ): Promise<Customer[]> {
    try {
      return await invoke('search_customers', { companyId, searchTerm });
    } catch (error) {
      console.error('Failed to search customers:', error);
      throw error;
    }
  }

  async createCustomer(
    customer: Omit<Customer, 'id' | 'created_at'>
  ): Promise<number> {
    try {
      return await invoke('create_customer', { customer });
    } catch (error) {
      console.error('Failed to create customer:', error);
      throw error;
    }
  }

  async updateCustomer(
    id: number,
    customer: Partial<Customer>
  ): Promise<boolean> {
    try {
      return await invoke('update_customer', { id, customer });
    } catch (error) {
      console.error('Failed to update customer:', error);
      throw error;
    }
  }

  async deleteCustomer(id: number): Promise<boolean> {
    try {
      return await invoke('delete_customer', { id });
    } catch (error) {
      console.error('Failed to delete customer:', error);
      throw error;
    }
  }

  async exportCustomersCSV(companyId: number): Promise<string> {
    try {
      return await invoke('export_customers_csv', { companyId });
    } catch (error) {
      console.error('Failed to export customers CSV:', error);
      throw error;
    }
  }

  async importCustomersCSV(
    companyId: number,
    csvData: string
  ): Promise<number> {
    try {
      return await invoke('import_customers_csv', { companyId, csvData });
    } catch (error) {
      console.error('Failed to import customers CSV:', error);
      throw error;
    }
  }

  // Category management methods
  async getCategoriesByCompany(companyId: number): Promise<Category[]> {
    try {
      return await invoke('get_categories_by_company', { companyId });
    } catch (error) {
      console.error('Failed to get categories:', error);
      throw error;
    }
  }

  async createCategory(category: {
    company_id: number;
    name: string;
    description?: string;
  }): Promise<number> {
    try {
      return await invoke('create_category', { category });
    } catch (error) {
      console.error('Failed to create category:', error);
      throw error;
    }
  }

  async updateCategory(
    id: number,
    category: { name?: string; description?: string }
  ): Promise<boolean> {
    try {
      return await invoke('update_category', { id, category });
    } catch (error) {
      console.error('Failed to update category:', error);
      throw error;
    }
  }

  async deleteCategory(id: number): Promise<boolean> {
    try {
      return await invoke('delete_category', { id });
    } catch (error) {
      console.error('Failed to delete category:', error);
      throw error;
    }
  }

  // Sales Report management methods
  async getSalesReportsByCompany(companyId: number): Promise<SalesReport[]> {
    try {
      // Check if we're running in Tauri
      if (
        typeof window !== 'undefined' &&
        (window as unknown as { __TAURI__?: unknown }).__TAURI__
      ) {
        return await invoke('get_sales_reports_by_company', { companyId });
      } else {
        // Fallback for development mode - return stored data for this company
        console.warn(
          'Running in development mode - returning stored sales reports'
        );
        const companyReports = this.devSalesReports.filter(
          report => report.company_id === companyId
        );
        console.log(
          `Found ${companyReports.length} reports for company ${companyId}`
        );
        return companyReports;
      }
    } catch (error) {
      console.error('Failed to get sales reports by company:', error);
      throw error;
    }
  }

  async getSalesReportsPaginated(
    companyId: number,
    page: number = 1,
    pageSize: number = 50,
    filters?: SalesReportFilters
  ): Promise<PaginatedResult<SalesReport>> {
    try {
      // Check if we're running in Tauri
      if (
        typeof window !== 'undefined' &&
        (window as unknown as { __TAURI__?: unknown }).__TAURI__
      ) {
        const result = (await invoke('get_sales_reports_paginated', {
          companyId,
          page,
          pageSize,
          filters: filters || null,
        })) as [SalesReport[], number];

        const [data, total] = result;
        const totalPages = Math.ceil(total / pageSize);

        return {
          data,
          total,
          page,
          pageSize,
          totalPages,
        };
      } else {
        // Fallback for development mode - simulate pagination
        console.warn(
          'Running in development mode - simulating paginated sales reports'
        );

        let companyReports = this.devSalesReports.filter(
          report => report.company_id === companyId
        );

        // Apply filters
        if (filters) {
          if (filters.date_from) {
            companyReports = companyReports.filter(
              report =>
                new Date(report.inv_date) >= new Date(filters.date_from!)
            );
          }
          if (filters.date_to) {
            companyReports = companyReports.filter(
              report => new Date(report.inv_date) <= new Date(filters.date_to!)
            );
          }
          if (filters.customer) {
            const customerLower = filters.customer.toLowerCase();
            companyReports = companyReports.filter(
              report =>
                report.cust_name?.toLowerCase().includes(customerLower) ||
                report.cust_code?.toLowerCase().includes(customerLower)
            );
          }
          if (filters.invoice) {
            companyReports = companyReports.filter(report =>
              report.invno
                ?.toLowerCase()
                .includes(filters.invoice!.toLowerCase())
            );
          }
          if (filters.min_amount !== undefined) {
            companyReports = companyReports.filter(
              report => (report.inv_val || 0) >= filters.min_amount!
            );
          }
          if (filters.max_amount !== undefined) {
            companyReports = companyReports.filter(
              report => (report.inv_val || 0) <= filters.max_amount!
            );
          }
        }

        // Sort by date descending
        companyReports.sort(
          (a, b) =>
            new Date(b.inv_date).getTime() - new Date(a.inv_date).getTime()
        );

        const total = companyReports.length;
        const totalPages = Math.ceil(total / pageSize);
        const startIndex = (page - 1) * pageSize;
        const endIndex = startIndex + pageSize;
        const data = companyReports.slice(startIndex, endIndex);

        return {
          data,
          total,
          page,
          pageSize,
          totalPages,
        };
      }
    } catch (error) {
      console.error('Failed to get paginated sales reports:', error);
      throw error;
    }
  }

  async searchSalesReports(
    companyId: number,
    searchTerm: string
  ): Promise<SalesReport[]> {
    try {
      return await invoke('search_sales_reports', { companyId, searchTerm });
    } catch (error) {
      console.error('Failed to search sales reports:', error);
      throw error;
    }
  }

  async createSalesReport(data: {
    company_id: number;
    cust_code: string;
    cust_name: string;
    inv_date: string;
    RE: string;
    invno: string;
    part_code?: string;
    part_name?: string;
    tariff?: string;
    qty: number;
    bas_price: number;
    ass_val: number;
    c_gst: number;
    s_gst: number;
    igst: number;
    amot: number;
    inv_val: number;
    igst_yes_no: string;
    percentage: number;
  }): Promise<number> {
    try {
      return await invoke('create_sales_report', data);
    } catch (error) {
      console.error('Failed to create sales report:', error);
      throw error;
    }
  }

  async updateSalesReport(
    id: number,
    data: Partial<SalesReport>
  ): Promise<boolean> {
    try {
      return await invoke('update_sales_report', { id, report: data });
    } catch (error) {
      console.error('Failed to update sales report:', error);
      throw error;
    }
  }

  async deleteSalesReport(id: number): Promise<boolean> {
    try {
      return await invoke('delete_sales_report', { id });
    } catch (error) {
      console.error('Failed to delete sales report:', error);
      throw error;
    }
  }

  async importSalesReportsCSV(
    companyId: number,
    csvData: string
  ): Promise<number> {
    try {
      // Check if we're running in Tauri
      if (
        typeof window !== 'undefined' &&
        (window as unknown as { __TAURI__?: unknown }).__TAURI__
      ) {
        return await invoke('import_sales_reports_csv', { companyId, csvData });
      } else {
        // Fallback for development mode - actually import and store data
        console.warn(
          'Running in development mode - importing CSV data to localStorage'
        );

        // Parse CSV data
        const lines = csvData.split('\n').filter(line => line.trim());
        if (lines.length < 2) {
          throw new Error(
            'CSV must contain at least a header row and one data row'
          );
        }

        // Detect if data is in multi-line format or standard CSV
        const isMultiLineFormat = (data: string): boolean => {
          const lines = data.split('\n').filter(line => line.trim());
          // If we have fewer than 2 lines or the first line doesn't contain commas, it's likely multi-line
          return lines.length < 2 || !lines[0].includes(',');
        };

        // Parse multi-line format data
        const parseMultiLineData = (
          data: string
        ): { headers: string[]; records: string[][] } => {
          const lines = data.split('\n').filter(line => line.trim());
          const records: string[][] = [];
          let currentRecord: string[] = [];

          for (const line of lines) {
            const trimmedLine = line.trim();

            // If line is empty, end current record
            if (!trimmedLine) {
              if (currentRecord.length > 0) {
                records.push(currentRecord);
                currentRecord = [];
              }
              continue;
            }

            // Clean the line: remove currency symbols and normalize
            const cleanedLine = trimmedLine
              .replace(/[₹$€£¥]/g, '')
              .replace(/,/g, '')
              .trim();

            currentRecord.push(cleanedLine);
          }

          // Add the last record if it exists
          if (currentRecord.length > 0) {
            records.push(currentRecord);
          }

          // Define headers based on the multi-line format structure
          const headers = [
            'cust_name',
            'cust_code',
            'invno',
            'RE',
            'inv_date',
            'val1',
            'val2',
            'val3',
            'val4',
            'val5',
            'tariff',
            'part_name',
            'bas_price',
            'RE2',
            'inv_date2',
            'val6',
            'val7',
            'val8',
            'val9',
            'val10',
          ];

          return { headers, records };
        };

        // Parse standard CSV format
        const parseCSVRow = (row: string): string[] => {
          const result: string[] = [];
          let current = '';
          let inQuotes = false;

          for (let i = 0; i < row.length; i++) {
            const char = row[i];

            if (char === '"') {
              inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
              // Clean the field: remove quotes, trim, and replace line breaks with spaces
              const cleaned = current
                .trim()
                .replace(/^"|"$/g, '')
                .replace(/\r?\n/g, ' ')
                .replace(/\s+/g, ' ')
                .trim();
              result.push(cleaned);
              current = '';
            } else {
              current += char;
            }
          }

          // Handle the last field
          const cleaned = current
            .trim()
            .replace(/^"|"$/g, '')
            .replace(/\r?\n/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
          result.push(cleaned);

          return result;
        };

        let headers: string[];
        let dataRows: string[][];

        if (isMultiLineFormat(csvData)) {
          console.log('Detected multi-line format, parsing accordingly...');
          const parsed = parseMultiLineData(csvData);
          headers = parsed.headers;
          dataRows = parsed.records;
        } else {
          console.log('Detected standard CSV format, parsing accordingly...');
          const lines = csvData.split('\n').filter(line => line.trim());
          headers = parseCSVRow(lines[0]);
          dataRows = lines.slice(1).map(line => parseCSVRow(line));
        }

        console.log('Headers:', headers);
        console.log('Number of data rows:', dataRows.length);

        // Convert data rows to SalesReport objects
        const newReports: SalesReport[] = dataRows
          .map((row, index) => {
            const values = row;
            const report: Partial<SalesReport> & { company_id: number } = {
              company_id: companyId,
            };

            // Map CSV columns to SalesReport fields
            headers.forEach((header, colIndex) => {
              const value = values[colIndex] || '';
              const normalizedHeader = header
                .toLowerCase()
                .replace(/\s+/g, '_');

              // Clean value by removing currency symbols and quotes
              const cleanValue = value
                .replace(/[₹$€£¥]/g, '') // Remove currency symbols
                .replace(/,/g, '') // Remove commas
                .replace(/\r?\n/g, ' ') // Replace line breaks with spaces
                .replace(/\s+/g, ' ') // Replace multiple spaces with single space
                .trim();

              // Map common field names
              switch (normalizedHeader) {
                case 'cust_code':
                case 'cust_cde':
                  report.cust_code = cleanValue;
                  break;
                case 'cust_name':
                  report.cust_name = cleanValue;
                  break;
                case 'inv_date':
                case 'io_date':
                  // Validate and format date
                  if (cleanValue) {
                    const date = new Date(cleanValue);
                    if (
                      !isNaN(date.getTime()) &&
                      date.getFullYear() >= 1900 &&
                      date.getFullYear() <= 2100
                    ) {
                      report.inv_date = date.toISOString().split('T')[0];
                    } else {
                      console.warn(
                        `Row ${index + 2}: Invalid date "${cleanValue}"`
                      );
                      report.inv_date = '';
                    }
                  } else {
                    report.inv_date = '';
                  }
                  break;
                case 'invno':
                case 'invoice_no':
                case 'invoice_number':
                case 'invoiceno':
                case 'invoice':
                case 'inv_no':
                case 'inv_number':
                  report.invno = cleanValue;
                  break;
                case 'part_code':
                case 'prod_cde':
                  report.part_code = cleanValue;
                  break;
                case 'part_name':
                case 'prod_name_ko':
                  report.part_name = cleanValue;
                  break;
                case 'tariff':
                case 'tariff_code':
                  report.tariff = cleanValue;
                  break;
                case 'qty':
                case 'io_qty':
                  report.qty = parseFloat(cleanValue) || 0;
                  break;
                case 'bas_price':
                case 'rate_pre_unit':
                  report.bas_price = parseFloat(cleanValue) || 0;
                  break;
                case 'ass_val':
                case 'assessable_value':
                  report.ass_val = parseFloat(cleanValue) || 0;
                  break;
                case 'c_gst':
                case 'cgst_amt':
                case 'c gst':
                  report.c_gst = parseFloat(cleanValue) || 0;
                  break;
                case 's_gst':
                case 'sgst_amt':
                case 's gst':
                  report.s_gst = parseFloat(cleanValue) || 0;
                  break;
                case 'igst':
                case 'igst_amt':
                  report.igst = parseFloat(cleanValue) || 0;
                  break;
                case 'amot':
                case 'amortisation_cost':
                  report.amot = parseFloat(cleanValue) || 0;
                  break;
                case 'inv_val':
                case 'total_inv_value':
                case 'invoice_total':
                  report.inv_val = parseFloat(cleanValue) || 0;
                  break;
                case 'igst_yes_no':
                case 'igst yes/no':
                  report.igst_yes_no = cleanValue.toLowerCase();
                  break;
                case 'percentage':
                  report.percentage = parseFloat(cleanValue) || 0;
                  break;
              }
            });

            // Debug logging for invoice number
            console.log(
              `Row ${index + 2}: Invoice number extracted: "${report.invno}"`
            );

            // Validate required fields
            if (!report.invno) {
              console.warn(
                `Row ${index + 2}: Missing invoice number - Headers: ${headers.join(', ')}`
              );
              console.warn(`Row ${index + 2}: Values: ${values.join(', ')}`);
              return null;
            }

            if (!report.cust_code && !report.cust_name) {
              console.warn(`Row ${index + 2}: Missing customer information`);
              return null;
            }

            // Set default values for missing fields
            report.id = Date.now() + index; // Generate unique ID
            report.RE = report.RE || 'RE';
            report.created_at = new Date().toISOString();

            return report as SalesReport;
          })
          .filter(report => report !== null);

        // Add new reports to storage
        this.devSalesReports.push(...newReports);
        this.saveDevSalesReportsToStorage();

        console.log(
          `Imported ${newReports.length} sales reports for company ${companyId}`
        );
        return newReports.length;
      }
    } catch (error) {
      console.error('Failed to import sales reports CSV:', error);
      throw error;
    }
  }

  async exportSalesReportsCSV(companyId: number): Promise<string> {
    try {
      return await invoke('export_sales_reports_csv', { companyId });
    } catch (error) {
      console.error('Failed to export sales reports CSV:', error);
      throw error;
    }
  }

  // Audit logging
  async logAction(
    companyId: number,
    action: string,
    details: unknown
  ): Promise<void> {
    try {
      // TODO: Implement audit logging command
      console.log('Logging action:', { companyId, action, details });
    } catch (error) {
      console.error('Failed to log action:', error);
      throw error;
    }
  }

  // Check if database is initialized
  isInitialized(): boolean {
    return this.initialized;
  }
}

// Export singleton instance
export const dbManager = new DatabaseManager();
