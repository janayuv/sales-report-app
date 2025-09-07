import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import type { Company } from '../utils/database';
import { dbManager } from '../utils/database';
import { showToast } from '../components/Toast';

interface CompanyContextType {
  selectedCompany: Company | null;
  companies: Company[];
  setSelectedCompany: (company: Company) => void;
  loadCompanies: () => Promise<void>;
  loading: boolean;
}

const CompanyContext = createContext<CompanyContextType | undefined>(undefined);

export const useCompanyContext = () => {
  const context = useContext(CompanyContext);
  if (context === undefined) {
    throw new Error('useCompanyContext must be used within a CompanyProvider');
  }
  return context;
};

interface CompanyProviderProps {
  children: ReactNode;
}

export const CompanyProvider: React.FC<CompanyProviderProps> = ({
  children,
}) => {
  const [selectedCompany, setSelectedCompanyState] = useState<Company | null>(
    null
  );
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);

  const loadCompanies = useCallback(async () => {
    try {
      setLoading(true);

      // Initialize database if not already initialized
      if (!dbManager.isInitialized()) {
        console.log('Initializing database...');
        await dbManager.initialize();
      }

      const companiesList = await dbManager.getCompanies();
      setCompanies(companiesList);
      console.log('Loaded companies:', companiesList.length);
    } catch (error) {
      console.error('Failed to load companies:', error);

      // Provide more specific error messages
      let errorMessage = 'Failed to load companies.';
      if (error instanceof Error) {
        if (error.message.includes('invoke')) {
          errorMessage =
            'Backend service not available. Please make sure the application is running in Tauri mode.';
        } else {
          errorMessage = `Database error: ${error.message}`;
        }
      }

      showToast.error(errorMessage + ' Please refresh the page.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCompanies();
  }, [loadCompanies]);

  useEffect(() => {
    // Load selected company from localStorage
    const savedCompanyKey = localStorage.getItem('selectedCompanyKey');
    if (savedCompanyKey && companies.length > 0) {
      const savedCompany = companies.find(c => c.key === savedCompanyKey);
      if (savedCompany) {
        setSelectedCompanyState(savedCompany);
      }
    } else if (companies.length > 0) {
      // Default to first company if none saved
      setSelectedCompanyState(companies[0]);
    }
  }, [companies]);

  const setSelectedCompany = (company: Company) => {
    setSelectedCompanyState(company);
    localStorage.setItem('selectedCompanyKey', company.key);
  };

  const value: CompanyContextType = {
    selectedCompany,
    companies,
    setSelectedCompany,
    loadCompanies,
    loading,
  };

  return (
    <CompanyContext.Provider value={value}>{children}</CompanyContext.Provider>
  );
};
