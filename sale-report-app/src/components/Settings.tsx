import React, { useState } from 'react';
import {
  Building2,
  Edit,
  Plus,
  RotateCcw,
  Database,
  Settings as SettingsIcon,
} from 'lucide-react';
import { useCompanyContext } from '../contexts/CompanyContext';
import { dbManager } from '../utils/database';
import { showToast } from './Toast';
import { CompanyForm } from './CompanyForm';

interface Company {
  id: number;
  name: string;
  key: string;
  created_at: string;
}

export const Settings: React.FC = () => {
  const { companies, loadCompanies } = useCompanyContext();
  const [showCompanyForm, setShowCompanyForm] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(false);

  const handleEditCompany = (company: Company) => {
    setEditingCompany(company);
    setShowCompanyForm(true);
  };

  const handleAddCompany = () => {
    setEditingCompany(null);
    setShowCompanyForm(true);
  };

  const handleCompanyFormClose = () => {
    setShowCompanyForm(false);
    setEditingCompany(null);
  };

  const handleCompanySave = async (_company: Company) => {
    try {
      // Refresh companies list
      await loadCompanies();
      setShowCompanyForm(false);
      setEditingCompany(null);
    } catch (error) {
      console.error('Failed to refresh companies:', error);
      showToast.error('Failed to refresh companies list');
    }
  };

  const handleClearDatabase = async () => {
    const confirmed = window.confirm(
      '⚠️ WARNING: This will permanently delete ALL data from the database!\n\n' +
        'This includes:\n' +
        '• All companies\n' +
        '• All customers\n' +
        '• All sales reports\n' +
        '• All categories\n' +
        '• All uploaded files\n' +
        '• All audit logs\n\n' +
        'This action cannot be undone!\n\n' +
        'Are you absolutely sure you want to continue?'
    );

    if (!confirmed) return;

    try {
      setLoading(true);
      console.log('Starting database clear operation...');
      await dbManager.clearAllData();
      console.log('Database clear operation completed');

      showToast.success(
        'All database data has been cleared successfully, including customers!'
      );

      // Refresh companies list to reflect the cleared state
      await loadCompanies();
      console.log('Companies list refreshed after clear');
    } catch (error) {
      console.error('Failed to clear database:', error);
      showToast.error('Failed to clear database. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetCompanies = async () => {
    try {
      // Reset companies to default values (development mode only)
      if (typeof window !== 'undefined' && !(window as any).__TAURI__) {
        (dbManager as any).resetDevCompaniesToDefault();
        await loadCompanies();
        showToast.success('Companies reset to default values');
      } else {
        showToast.warning(
          'Reset function is only available in development mode'
        );
      }
    } catch (error) {
      console.error('Failed to reset companies:', error);
      showToast.error('Failed to reset companies');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Settings</h1>
        <p className="text-muted-foreground">Configure application settings</p>
      </div>

      {/* Company Management Section */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Building2 size={20} className="text-primary" />
              <div>
                <h2 className="text-lg font-semibold text-foreground">
                  Company Management
                </h2>
                <p className="text-sm text-muted-foreground">
                  Manage your companies and their settings
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleAddCompany}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
              >
                <Plus size={16} />
                Add Company
              </button>
              <button
                onClick={handleResetCompanies}
                className="flex items-center gap-2 px-4 py-2 border border-border rounded-md hover:bg-accent transition-colors"
                title="Reset companies to default values (development mode only)"
              >
                <RotateCcw size={16} />
                Reset
              </button>
            </div>
          </div>
        </div>

        <div className="p-6">
          {companies.length === 0 ? (
            <div className="text-center py-8">
              <Building2
                size={48}
                className="mx-auto text-muted-foreground mb-4"
              />
              <h3 className="text-lg font-medium text-foreground mb-2">
                No Companies Found
              </h3>
              <p className="text-muted-foreground mb-4">
                Get started by adding your first company
              </p>
              <button
                onClick={handleAddCompany}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors mx-auto"
              >
                <Plus size={16} />
                Add Company
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {companies.map(company => (
                <div
                  key={company.id}
                  className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                      <Building2 size={20} className="text-primary" />
                    </div>
                    <div>
                      <h3 className="font-medium text-foreground">
                        {company.name}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Key: {company.key} • Created:{' '}
                        {new Date(company.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleEditCompany(company)}
                      className="p-2 text-muted-foreground hover:text-primary transition-colors"
                      aria-label="Edit company"
                    >
                      <Edit size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Development Tools */}
      {import.meta.env.DEV && (
        <div className="bg-card border border-border rounded-lg">
          <div className="p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <SettingsIcon />
              Development Tools
            </h2>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => {
                  dbManager.clearDevCompaniesStorage();
                  dbManager.resetDevCompaniesToDefault();
                  showToast.success('Companies reset to default values');
                }}
                className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
              >
                <RotateCcw size={16} className="mr-2" />
                Reset Companies
              </button>

              <button
                onClick={() => {
                  dbManager.clearDevSalesReports();
                  showToast.success('Sales reports cleared');
                }}
                className="px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 transition-colors"
              >
                Clear Sales Reports
              </button>

              <button
                onClick={handleClearDatabase}
                disabled={loading}
                className="px-4 py-2 bg-red-700 text-white rounded-md hover:bg-red-800 disabled:opacity-50 transition-colors"
              >
                <Database size={16} className="mr-2" />
                {loading ? 'Clearing...' : 'Clear ALL Database Data'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Company Form Modal */}
      {showCompanyForm && (
        <CompanyForm
          company={editingCompany}
          onSave={handleCompanySave}
          onCancel={handleCompanyFormClose}
        />
      )}
    </div>
  );
};
