import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from 'react';
import type { Company } from '../utils/database';
import { dbManager } from '../utils/database';
import { showToast } from '../components/Toast';

interface CompanyContextType {
  selectedCompany: Company | null;
  companies: Company[];
  setSelectedCompany: (company: Company) => void;
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

  useEffect(() => {
    loadCompanies();
  }, []);

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

  const loadCompanies = async () => {
    try {
      setLoading(true);
      const companiesList = await dbManager.getCompanies();
      setCompanies(companiesList);
    } catch (error) {
      console.error('Failed to load companies:', error);
      showToast.error('Failed to load companies. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  };

  const setSelectedCompany = (company: Company) => {
    setSelectedCompanyState(company);
    localStorage.setItem('selectedCompanyKey', company.key);
  };

  const value: CompanyContextType = {
    selectedCompany,
    companies,
    setSelectedCompany,
    loading,
  };

  return (
    <CompanyContext.Provider value={value}>{children}</CompanyContext.Provider>
  );
};
