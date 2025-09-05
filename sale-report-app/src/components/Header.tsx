import React from 'react';
import { SidebarTrigger } from './SidebarTrigger';
import { ThemeToggle } from './ThemeToggle';
import { useCompanyContext } from '../contexts/CompanyContext';

interface HeaderProps {
  onSidebarToggle: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onSidebarToggle }) => {
  const { selectedCompany, companies, setSelectedCompany } =
    useCompanyContext();

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur">
      <div className="max-w-screen-2xl mx-auto h-14 px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <SidebarTrigger onToggle={onSidebarToggle} className="lg:hidden" />
          {/* Company selector */}
          <select
            data-testid="company-selector"
            value={selectedCompany?.key || ''}
            onChange={e => {
              const company = companies.find(c => c.key === e.target.value);
              if (company) setSelectedCompany(company);
            }}
            className="px-3 py-1 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            {companies.map(company => (
              <option
                key={company.key}
                value={company.key}
                data-testid={company.key}
              >
                {company.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-4">
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
};
