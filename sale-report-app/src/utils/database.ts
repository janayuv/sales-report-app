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

  async initialize(): Promise<void> {
    try {
      // Test connection by getting companies
      await this.getCompanies();
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
      return await invoke('get_companies');
    } catch (error) {
      console.error('Failed to get companies:', error);
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
