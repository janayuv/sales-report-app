import { showToast } from '../components/Toast';

/**
 * Professional toast notification utilities for common operations
 */

export const toastUtils = {
  // Customer operations
  customer: {
    created: (name: string) =>
      showToast.success(`Customer "${name}" created successfully!`),
    updated: (name: string) =>
      showToast.success(`Customer "${name}" updated successfully!`),
    deleted: (name: string) =>
      showToast.success(`Customer "${name}" deleted successfully!`),
    createError: () =>
      showToast.error('Failed to create customer. Please try again.'),
    updateError: () =>
      showToast.error('Failed to update customer. Please try again.'),
    deleteError: () =>
      showToast.error('Failed to delete customer. Please try again.'),
    loading: (action: 'Creating' | 'Updating' | 'Deleting') =>
      showToast.loading(`${action} customer...`),
  },

  // Import/Export operations
  importExport: {
    exportSuccess: (filename: string) =>
      showToast.success(`Export completed! File: ${filename}`),
    exportError: () =>
      showToast.error('Failed to export data. Please try again.'),
    importSuccess: (count: number) =>
      showToast.success(`Successfully imported ${count} customers!`),
    importWarning: () =>
      showToast.warning('No new customers imported. All may already exist.'),
    importError: () =>
      showToast.error('Import failed. Please check file format and try again.'),
    templateDownloaded: () =>
      showToast.success('Template downloaded successfully!'),
    exporting: () => showToast.loading('Exporting customers...'),
    importing: () => showToast.loading('Importing customers...'),
  },

  // Company operations
  company: {
    loaded: () => showToast.success('Companies loaded successfully!'),
    loadError: () =>
      showToast.error('Failed to load companies. Please refresh the page.'),
    selected: (name: string) => showToast.info(`Switched to company: ${name}`),
  },

  // Form operations
  form: {
    validationError: (message: string) => showToast.warning(message),
    saveError: () => showToast.error('Failed to save form. Please try again.'),
    requiredField: (field: string) =>
      showToast.warning(`Please fill in the ${field} field.`),
  },

  // Search operations
  search: {
    noResults: (term: string) =>
      showToast.info(`No customers found for "${term}"`),
    searchError: () => showToast.error('Search failed. Please try again.'),
  },

  // General operations
  general: {
    success: (message: string) => showToast.success(message),
    error: (message: string) => showToast.error(message),
    warning: (message: string) => showToast.warning(message),
    info: (message: string) => showToast.info(message),
    loading: (message: string) => showToast.loading(message),
  },

  // Promise-based operations
  promise: {
    customerOperation: <T>(
      promise: Promise<T>,
      operation: 'create' | 'update' | 'delete',
      customerName?: string
    ) => {
      const messages = {
        create: {
          loading: 'Creating customer...',
          success: `Customer "${customerName}" created successfully!`,
          error: 'Failed to create customer. Please try again.',
        },
        update: {
          loading: 'Updating customer...',
          success: `Customer "${customerName}" updated successfully!`,
          error: 'Failed to update customer. Please try again.',
        },
        delete: {
          loading: 'Deleting customer...',
          success: `Customer "${customerName}" deleted successfully!`,
          error: 'Failed to delete customer. Please try again.',
        },
      };

      return showToast.promise(promise, messages[operation]);
    },

    importOperation: (promise: Promise<number>) => {
      return showToast.promise(promise, {
        loading: 'Importing customers...',
        success: (count: number) => `Successfully imported ${count} customers!`,
        error: 'Import failed. Please check file format and try again.',
      });
    },

    exportOperation: (promise: Promise<string>) => {
      return showToast.promise(promise, {
        loading: 'Exporting customers...',
        success: (filename: string) => `Export completed! File: ${filename}`,
        error: 'Failed to export data. Please try again.',
      });
    },
  },
};

export default toastUtils;
