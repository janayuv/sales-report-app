import React, { useState } from 'react';
import { CompanyProvider, useCompanyContext } from './contexts/CompanyContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { AppLayout } from './components/AppLayout';
import { Dashboard } from './components/Dashboard';
import { CustomersPage } from './pages/CustomersPage';
import { Reports } from './components/Reports';
import { Settings } from './components/Settings';
import { ImportTransformPage } from './pages/ImportTransformPage';
import { TransformExistingData } from './components/TransformExistingData';
import { ToastContainer } from './components/Toast';
import type { Page } from './types/navigation';

const AppContent: React.FC = () => {
  const { loading } = useCompanyContext();
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Initializing application...</p>
        </div>
      </div>
    );
  }

  const renderPageContent = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />;
      case 'customers':
        return <CustomersPage />;
      case 'reports':
        return <Reports />;
      case 'settings':
        return <Settings />;
      case 'import_transform':
        return <ImportTransformPage />;
      case 'transform_existing':
        return <TransformExistingData />;
      default:
        return null;
    }
  };

  return (
    <AppLayout currentPage={currentPage} onPageChange={setCurrentPage}>
      {renderPageContent()}
    </AppLayout>
  );
};

function App() {
  return (
    <ThemeProvider>
      <CompanyProvider>
        <AppContent />
        <ToastContainer />
      </CompanyProvider>
    </ThemeProvider>
  );
}

export default App;
