import React, { useState, useEffect } from 'react';
import { FileText, Users, BarChart3, DollarSign } from 'lucide-react';
import { useCompanyContext } from '../contexts/CompanyContext';
import { dbManager } from '../utils/database';
import type { SalesReport } from '../utils/database';

export const Dashboard: React.FC = () => {
  const { selectedCompany } = useCompanyContext();
  const [reports, setReports] = useState<SalesReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadReports = async () => {
      if (!selectedCompany) return;

      try {
        setLoading(true);
        const reportsList = await dbManager.getSalesReportsByCompany(
          selectedCompany.id
        );
        setReports(reportsList);
      } catch (error) {
        console.error('Failed to load reports for dashboard:', error);
      } finally {
        setLoading(false);
      }
    };

    loadReports();
  }, [selectedCompany]);

  // Calculate statistics
  const totalReports = reports.length;
  const totalValue = reports.reduce(
    (sum, report) => sum + (report.inv_val || 0),
    0
  );
  const uniqueCustomers = new Set(reports.map(r => r.cust_code)).size;
  const uniqueInvoices = new Set(reports.map(r => r.invno)).size;

  const statsCards = [
    {
      title: 'Total Reports',
      value: loading ? '...' : totalReports.toLocaleString(),
      icon: FileText,
      color: 'text-primary',
    },
    {
      title: 'Total Value',
      value: loading ? '...' : `₹${totalValue.toLocaleString()}`,
      icon: DollarSign,
      color: 'text-green-500',
    },
    {
      title: 'Unique Customers',
      value: loading ? '...' : uniqueCustomers.toLocaleString(),
      icon: Users,
      color: 'text-blue-500',
    },
    {
      title: 'Unique Invoices',
      value: loading ? '...' : uniqueInvoices.toLocaleString(),
      icon: BarChart3,
      color: 'text-purple-500',
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
              className="bg-card p-5 rounded-lg border border-border hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-3">
                <Icon className={card.color} size={22} />
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
