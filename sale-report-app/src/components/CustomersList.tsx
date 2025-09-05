import React, { useState, useEffect, useCallback } from 'react';
import type { Customer } from '../utils/database';
import { dbManager } from '../utils/database';
import { useCompanyContext } from '../contexts/CompanyContext';
import {
  Search,
  Plus,
  Edit,
  Trash2,
  Download,
  Upload,
  FileText,
} from 'lucide-react';
import { downloadFile, selectFile, readFileAsText } from '../utils/fileUtils';
import { showToast } from './Toast';

interface CustomersListProps {
  onEditCustomer: (customer: Customer) => void;
  onDeleteCustomer: (customerId: number) => void;
  onAddCustomer: () => void;
  refreshTrigger?: number; // Add refresh trigger prop
  onImportComplete?: (count: number) => void; // Callback for import completion
}

export const CustomersList: React.FC<CustomersListProps> = ({
  onEditCustomer,
  onDeleteCustomer,
  onAddCustomer,
  refreshTrigger,
  onImportComplete,
}) => {
  const { selectedCompany } = useCompanyContext();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [globalFilter, setGlobalFilter] = useState('');
  const [showImportMenu, setShowImportMenu] = useState(false);

  const loadCustomers = useCallback(async () => {
    if (!selectedCompany) return;

    try {
      setLoading(true);
      const customersList = await dbManager.getCustomersByCompany(
        selectedCompany.id
      );
      setCustomers(customersList);
    } catch (error) {
      console.error('Failed to load customers:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedCompany]);

  const searchCustomers = useCallback(
    async (searchTerm: string) => {
      if (!selectedCompany) return;

      try {
        setLoading(true);
        if (searchTerm.trim()) {
          const customersList = await dbManager.searchCustomers(
            selectedCompany.id,
            searchTerm
          );
          setCustomers(customersList);
        } else {
          await loadCustomers();
        }
      } catch (error) {
        console.error('Failed to search customers:', error);
      } finally {
        setLoading(false);
      }
    },
    [selectedCompany, loadCustomers]
  );

  useEffect(() => {
    if (selectedCompany) {
      loadCustomers();
    }
  }, [selectedCompany, loadCustomers]);

  // Refresh customers when refreshTrigger changes
  useEffect(() => {
    if (refreshTrigger && selectedCompany) {
      loadCustomers();
    }
  }, [refreshTrigger, loadCustomers, selectedCompany]);

  // Debounced search effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchCustomers(globalFilter);
    }, 300); // 300ms debounce

    return () => clearTimeout(timeoutId);
  }, [globalFilter, searchCustomers]);

  // Close import menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (_event: MouseEvent) => {
      if (showImportMenu) {
        setShowImportMenu(false);
      }
    };

    if (showImportMenu) {
      document.addEventListener('click', handleClickOutside);
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [showImportMenu]);

  const handleExportCustomers = async () => {
    if (!selectedCompany) return;

    const toastId = showToast.loading('Exporting customers...');

    try {
      setLoading(true);
      const csvData = await dbManager.exportCustomersCSV(selectedCompany.id);
      const filename = `${selectedCompany.name}_customers_${new Date().toISOString().split('T')[0]}.csv`;
      downloadFile(csvData, filename);
      showToast.dismiss(toastId);
      showToast.success(`Customers exported successfully! File: ${filename}`);
    } catch (error) {
      console.error('Failed to export customers:', error);
      showToast.dismiss(toastId);
      showToast.error('Failed to export customers. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleImportCustomers = async () => {
    if (!selectedCompany) return;

    try {
      const file = await selectFile('.csv');
      if (!file) return;

      const csvData = await readFileAsText(file);
      const toastId = showToast.loading('Importing customers...');
      setLoading(true);

      const importedCount = await dbManager.importCustomersCSV(
        selectedCompany.id,
        csvData
      );

      if (importedCount > 0) {
        showToast.dismiss(toastId);
        showToast.success(`Successfully imported ${importedCount} customers.`);
        onImportComplete?.(importedCount);
        await loadCustomers(); // Refresh the list
      } else {
        showToast.dismiss(toastId);
        showToast.warning(
          'No new customers were imported. All customers may already exist.'
        );
      }
    } catch (error) {
      console.error('Failed to import customers:', error);
      showToast.error(
        'Failed to import customers. Please check the file format and try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadTemplate = () => {
    const templateContent =
      'Customer Name,Tally Name,GST No,Category\n"Sample Customer","SAMPLE_CUSTOMER","22AAAAA0000A1Z5","General"\n"Another Customer","ANOTHER_CUSTOMER","","Electronics"';
    downloadFile(templateContent, 'customer_import_template.csv');
    showToast.success('Template downloaded successfully!');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading customers...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Customers</h2>
          <p className="text-muted-foreground">
            Manage customers for {selectedCompany?.name}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <button
            data-testid="add-customer-btn"
            onClick={onAddCustomer}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            <Plus size={16} />
            Add Customer
          </button>

          <div className="relative">
            <button
              onClick={() => setShowImportMenu(!showImportMenu)}
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2 border border-border rounded-md hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Upload size={16} />
              Import
            </button>

            {showImportMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-md shadow-lg z-10">
                <button
                  onClick={() => {
                    handleImportCustomers();
                    setShowImportMenu(false);
                  }}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center gap-2"
                >
                  <Upload size={14} />
                  Import from CSV
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

          <button
            onClick={handleExportCustomers}
            disabled={loading || customers.length === 0}
            className="inline-flex items-center gap-2 px-4 py-2 border border-border rounded-md hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download size={16} />
            Export
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search
          className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"
          size={16}
        />
        <input
          type="text"
          placeholder="Search customers..."
          value={globalFilter}
          onChange={e => setGlobalFilter(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
        />
      </div>

      {/* Table */}
      <div className="border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                  Customer Name
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                  Tally Name
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                  GST No
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                  Category
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                  Created
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {customers.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-8 text-center text-muted-foreground"
                  >
                    {globalFilter.trim()
                      ? `No customers found matching "${globalFilter}".`
                      : 'No customers found. Add your first customer to get started.'}
                  </td>
                </tr>
              ) : (
                customers.map(customer => (
                  <tr
                    key={customer.id}
                    className="border-t border-border hover:bg-muted/50 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="font-medium text-foreground">
                        {customer.customer_name}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-muted-foreground">
                        {customer.tally_name}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-muted-foreground">
                        {customer.gst_no || '-'}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-muted-foreground">
                        {customer.category_name || '-'}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-muted-foreground">
                        {new Date(customer.created_at).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onEditCustomer(customer)}
                          className="p-1 text-muted-foreground hover:text-foreground transition-colors"
                          aria-label="Edit customer"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => onDeleteCustomer(customer.id)}
                          className="p-1 text-muted-foreground hover:text-destructive transition-colors"
                          aria-label="Delete customer"
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
      {customers.length > 0 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div>
            Showing {customers.length} of {customers.length} customers
          </div>
        </div>
      )}
    </div>
  );
};
