import React from 'react';
import { FileText, Users, BarChart3, TrendingUp } from 'lucide-react';
import { useCompanyContext } from '../contexts/CompanyContext';

export const Dashboard: React.FC = () => {
  const { selectedCompany } = useCompanyContext();

  const statsCards = [
    {
      title: 'Total Reports',
      value: '0',
      icon: FileText,
    },
    {
      title: 'Total Customers',
      value: '0',
      icon: Users,
    },
    {
      title: 'Conversions',
      value: '0',
      icon: BarChart3,
    },
    {
      title: 'Growth Rate',
      value: '0%',
      icon: TrendingUp,
    },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome to {selectedCompany?.name}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6">
        {statsCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <div
              key={index}
              className="bg-card p-5 rounded-lg border border-border"
            >
              <div className="flex items-center gap-3">
                <Icon className="text-primary" size={22} />
                <div>
                  <p className="text-sm text-muted-foreground">{card.title}</p>
                  <p className="text-2xl font-bold text-foreground">
                    {card.value}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
