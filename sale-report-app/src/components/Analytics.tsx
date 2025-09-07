import React from 'react';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Calendar,
  BarChart3,
  PieChart,
  Activity,
} from 'lucide-react';
import type { SalesReport } from '../utils/database';

interface AnalyticsProps {
  reports: SalesReport[];
  loading?: boolean;
}

interface AnalyticsData {
  totalRevenue: number;
  totalQuantity: number;
  uniqueCustomers: number;
  uniqueInvoices: number;
  averageOrderValue: number;
  topCustomers: Array<{
    name: string;
    code: string;
    revenue: number;
    count: number;
  }>;
  monthlyRevenue: Array<{ month: string; revenue: number; count: number }>;
  productPerformance: Array<{
    name: string;
    code: string;
    revenue: number;
    quantity: number;
  }>;
  revenueGrowth: number;
  quantityGrowth: number;
}

export const Analytics: React.FC<AnalyticsProps> = ({
  reports,
  loading = false,
}) => {
  // Calculate analytics data
  const calculateAnalytics = (): AnalyticsData => {
    if (reports.length === 0) {
      return {
        totalRevenue: 0,
        totalQuantity: 0,
        uniqueCustomers: 0,
        uniqueInvoices: 0,
        averageOrderValue: 0,
        topCustomers: [],
        monthlyRevenue: [],
        productPerformance: [],
        revenueGrowth: 0,
        quantityGrowth: 0,
      };
    }

    const totalRevenue = reports.reduce(
      (sum, report) => sum + (report.inv_val || 0),
      0
    );
    const totalQuantity = reports.reduce(
      (sum, report) => sum + (report.qty || 0),
      0
    );
    const uniqueCustomers = new Set(reports.map(r => r.cust_code)).size;
    const uniqueInvoices = new Set(reports.map(r => r.invno)).size;
    const averageOrderValue =
      uniqueInvoices > 0 ? totalRevenue / uniqueInvoices : 0;

    // Top customers by revenue
    const customerMap = new Map<
      string,
      { name: string; code: string; revenue: number; count: number }
    >();
    reports.forEach(report => {
      const key = report.cust_code || 'Unknown';
      const existing = customerMap.get(key) || {
        name: report.cust_name || 'Unknown',
        code: report.cust_code || 'Unknown',
        revenue: 0,
        count: 0,
      };
      existing.revenue += report.inv_val || 0;
      existing.count += 1;
      customerMap.set(key, existing);
    });

    const topCustomers = Array.from(customerMap.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // Monthly revenue
    const monthlyMap = new Map<
      string,
      { month: string; revenue: number; count: number }
    >();
    reports.forEach(report => {
      if (report.inv_date) {
        const date = new Date(report.inv_date);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        const monthName = date.toLocaleDateString('en-US', {
          month: 'short',
          year: 'numeric',
        });

        const existing = monthlyMap.get(monthKey) || {
          month: monthName,
          revenue: 0,
          count: 0,
        };
        existing.revenue += report.inv_val || 0;
        existing.count += 1;
        monthlyMap.set(monthKey, existing);
      }
    });

    const monthlyRevenue = Array.from(monthlyMap.values()).sort((a, b) =>
      a.month.localeCompare(b.month)
    );

    // Product performance
    const productMap = new Map<
      string,
      { name: string; code: string; revenue: number; quantity: number }
    >();
    reports.forEach(report => {
      const key = report.part_code || 'Unknown';
      const existing = productMap.get(key) || {
        name: report.part_name || 'Unknown',
        code: report.part_code || 'Unknown',
        revenue: 0,
        quantity: 0,
      };
      existing.revenue += report.inv_val || 0;
      existing.quantity += report.qty || 0;
      productMap.set(key, existing);
    });

    const productPerformance = Array.from(productMap.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // Calculate growth (comparing first half vs second half of data)
    const sortedReports = [...reports].sort(
      (a, b) => new Date(a.inv_date).getTime() - new Date(b.inv_date).getTime()
    );

    const midPoint = Math.floor(sortedReports.length / 2);
    const firstHalf = sortedReports.slice(0, midPoint);
    const secondHalf = sortedReports.slice(midPoint);

    const firstHalfRevenue = firstHalf.reduce(
      (sum, report) => sum + (report.inv_val || 0),
      0
    );
    const secondHalfRevenue = secondHalf.reduce(
      (sum, report) => sum + (report.inv_val || 0),
      0
    );
    const revenueGrowth =
      firstHalfRevenue > 0
        ? ((secondHalfRevenue - firstHalfRevenue) / firstHalfRevenue) * 100
        : 0;

    const firstHalfQuantity = firstHalf.reduce(
      (sum, report) => sum + (report.qty || 0),
      0
    );
    const secondHalfQuantity = secondHalf.reduce(
      (sum, report) => sum + (report.qty || 0),
      0
    );
    const quantityGrowth =
      firstHalfQuantity > 0
        ? ((secondHalfQuantity - firstHalfQuantity) / firstHalfQuantity) * 100
        : 0;

    return {
      totalRevenue,
      totalQuantity,
      uniqueCustomers,
      uniqueInvoices,
      averageOrderValue,
      topCustomers,
      monthlyRevenue,
      productPerformance,
      revenueGrowth,
      quantityGrowth,
    };
  };

  const analytics = calculateAnalytics();

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="bg-card p-4 rounded-lg border border-border animate-pulse"
            >
              <div className="h-4 bg-muted rounded mb-2"></div>
              <div className="h-6 bg-muted rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (reports.length === 0) {
    return (
      <div className="text-center py-12">
        <BarChart3 size={48} className="mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium text-foreground mb-2">
          No Analytics Available
        </h3>
        <p className="text-muted-foreground">
          Import some sales reports to see analytics and insights.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card p-4 rounded-lg border border-border">
          <div className="flex items-center gap-3">
            <DollarSign className="text-green-500" size={20} />
            <div>
              <p className="text-sm text-muted-foreground">Total Revenue</p>
              <p className="text-xl font-bold text-foreground">
                ₹{analytics.totalRevenue.toLocaleString()}
              </p>
              {analytics.revenueGrowth !== 0 && (
                <p
                  className={`text-xs flex items-center gap-1 ${
                    analytics.revenueGrowth > 0
                      ? 'text-green-500'
                      : 'text-red-500'
                  }`}
                >
                  {analytics.revenueGrowth > 0 ? (
                    <TrendingUp size={12} />
                  ) : (
                    <TrendingDown size={12} />
                  )}
                  {Math.abs(analytics.revenueGrowth).toFixed(1)}%
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="bg-card p-4 rounded-lg border border-border">
          <div className="flex items-center gap-3">
            <BarChart3 className="text-blue-500" size={20} />
            <div>
              <p className="text-sm text-muted-foreground">Total Quantity</p>
              <p className="text-xl font-bold text-foreground">
                {analytics.totalQuantity.toLocaleString()}
              </p>
              {analytics.quantityGrowth !== 0 && (
                <p
                  className={`text-xs flex items-center gap-1 ${
                    analytics.quantityGrowth > 0
                      ? 'text-green-500'
                      : 'text-red-500'
                  }`}
                >
                  {analytics.quantityGrowth > 0 ? (
                    <TrendingUp size={12} />
                  ) : (
                    <TrendingDown size={12} />
                  )}
                  {Math.abs(analytics.quantityGrowth).toFixed(1)}%
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="bg-card p-4 rounded-lg border border-border">
          <div className="flex items-center gap-3">
            <Users className="text-purple-500" size={20} />
            <div>
              <p className="text-sm text-muted-foreground">Unique Customers</p>
              <p className="text-xl font-bold text-foreground">
                {analytics.uniqueCustomers}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-card p-4 rounded-lg border border-border">
          <div className="flex items-center gap-3">
            <Activity className="text-orange-500" size={20} />
            <div>
              <p className="text-sm text-muted-foreground">Avg Order Value</p>
              <p className="text-xl font-bold text-foreground">
                ₹{analytics.averageOrderValue.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts and Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Customers */}
        <div className="bg-card p-6 rounded-lg border border-border">
          <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <Users size={20} />
            Top Customers
          </h3>
          <div className="space-y-3">
            {analytics.topCustomers.map((customer, index) => (
              <div
                key={customer.code}
                className="flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-sm font-medium text-primary">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium text-foreground">
                      {customer.name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {customer.code}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium text-foreground">
                    ₹{customer.revenue.toLocaleString()}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {customer.count} orders
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Products */}
        <div className="bg-card p-6 rounded-lg border border-border">
          <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <PieChart size={20} />
            Top Products
          </h3>
          <div className="space-y-3">
            {analytics.productPerformance.map((product, index) => (
              <div
                key={product.code}
                className="flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-500/10 rounded-full flex items-center justify-center text-sm font-medium text-blue-500">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium text-foreground">
                      {product.name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {product.code}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium text-foreground">
                    ₹{product.revenue.toLocaleString()}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {product.quantity} units
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Monthly Revenue Trend */}
      {analytics.monthlyRevenue.length > 0 && (
        <div className="bg-card p-6 rounded-lg border border-border">
          <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <Calendar size={20} />
            Monthly Revenue Trend
          </h3>
          <div className="space-y-3">
            {analytics.monthlyRevenue.map(month => (
              <div
                key={month.month}
                className="flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="font-medium text-foreground">
                    {month.month}
                  </span>
                </div>
                <div className="text-right">
                  <p className="font-medium text-foreground">
                    ₹{month.revenue.toLocaleString()}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {month.count} orders
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
