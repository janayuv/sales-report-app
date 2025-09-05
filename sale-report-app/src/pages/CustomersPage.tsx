import React, { useState } from 'react';
import { CustomersList } from '../components/CustomersList';
import { CustomerForm } from '../components/CustomerForm';
import type { Customer } from '../utils/database';
import { dbManager } from '../utils/database';
import { useCompanyContext } from '../contexts/CompanyContext';
import { showToast } from '../components/Toast';
import type { CustomerFormData } from '../utils/validation';

export const CustomersPage: React.FC = () => {
  const { selectedCompany } = useCompanyContext();
  const [showForm, setShowForm] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleAddCustomer = () => {
    setEditingCustomer(null);
    setShowForm(true);
  };

  const handleEditCustomer = (customer: Customer) => {
    setEditingCustomer(customer);
    setShowForm(true);
  };

  const handleDeleteCustomer = async (customerId: number) => {
    if (!window.confirm('Are you sure you want to delete this customer?')) {
      return;
    }

    const toastId = showToast.loading('Deleting customer...');

    try {
      await dbManager.deleteCustomer(customerId);
      setRefreshTrigger(prev => prev + 1); // Trigger refresh
      showToast.dismiss(toastId);
      showToast.success('Customer deleted successfully.');
    } catch (error) {
      console.error('Failed to delete customer:', error);
      showToast.dismiss(toastId);
      showToast.error('Failed to delete customer. Please try again.');
    }
  };

  const handleSaveCustomer = async (data: CustomerFormData) => {
    if (!selectedCompany) {
      showToast.warning('Please select a company first.');
      return;
    }

    const toastId = showToast.loading(
      editingCustomer ? 'Updating customer...' : 'Creating customer...'
    );

    try {
      if (editingCustomer) {
        // Update existing customer
        await dbManager.updateCustomer(editingCustomer.id, {
          customer_name: data.customer_name,
          tally_name: data.tally_name,
          gst_no: data.gst_no || undefined,
          category_id: data.category_id || undefined,
        });
      } else {
        // Create new customer
        await dbManager.createCustomer({
          company_id: selectedCompany.id,
          customer_name: data.customer_name,
          tally_name: data.tally_name,
          gst_no: data.gst_no || undefined,
          category_id: data.category_id || undefined,
        });
      }

      setShowForm(false);
      setEditingCustomer(null);
      setRefreshTrigger(prev => prev + 1); // Trigger refresh
      showToast.dismiss(toastId);
      showToast.success(
        editingCustomer
          ? 'Customer updated successfully.'
          : 'Customer created successfully.'
      );
    } catch (error) {
      console.error('Failed to save customer:', error);
      showToast.dismiss(toastId);
      showToast.error('Failed to save customer. Please try again.');
    }
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingCustomer(null);
  };

  const handleImportComplete = (_count: number) => {
    setRefreshTrigger(prev => prev + 1); // Trigger refresh
  };

  if (!selectedCompany) {
    return (
      <div
        className="flex items-center justify-center h-64"
        data-testid="no-company-message"
      >
        <div className="text-center">
          <h2 className="text-xl font-semibold text-foreground mb-2">
            No Company Selected
          </h2>
          <p className="text-muted-foreground">
            Please select a company to manage customers.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="customers-page">
      <CustomersList
        onEditCustomer={handleEditCustomer}
        onDeleteCustomer={handleDeleteCustomer}
        onAddCustomer={handleAddCustomer}
        refreshTrigger={refreshTrigger}
        onImportComplete={handleImportComplete}
      />

      {showForm && (
        <CustomerForm
          customer={editingCustomer || undefined}
          onSave={handleSaveCustomer}
          onCancel={handleCancelForm}
        />
      )}
    </div>
  );
};
