import React from 'react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from './ui/sidebar';
import {
  Building2,
  BarChart3,
  FileText,
  Users,
  Settings,
  Download,
  Upload,
  Database,
  Home,
  RefreshCw,
} from 'lucide-react';
import { useCompanyContext } from '../contexts/CompanyContext';
import { useTheme } from '../contexts/ThemeContext';
import { ThemeToggle } from './ThemeToggle';
import type { Page } from '../types/navigation';

interface ModernSidebarProps {
  children: React.ReactNode;
  currentPage: Page;
  onPageChange: (page: Page) => void;
}

export function ModernSidebar({
  children,
  currentPage,
  onPageChange,
}: ModernSidebarProps) {
  const { selectedCompany, companies, setSelectedCompany } =
    useCompanyContext();
  const { theme } = useTheme();

  const navigationItems = [
    {
      title: 'Dashboard',
      icon: Home,
      page: 'dashboard' as Page,
      description: 'Overview and analytics',
    },
    {
      title: 'Sales Reports',
      icon: FileText,
      page: 'reports' as Page,
      description: 'View and manage sales data',
    },
    {
      title: 'Analytics',
      icon: BarChart3,
      page: 'analytics' as Page,
      description: 'Data insights and trends',
    },
    {
      title: 'Customers',
      icon: Users,
      page: 'customers' as Page,
      description: 'Customer management',
    },
    {
      title: 'Import & Transform',
      icon: Upload,
      page: 'import_transform' as Page,
      description: 'Import and transform data',
    },
    {
      title: 'Transform Existing',
      icon: RefreshCw,
      page: 'transform_existing' as Page,
      description: 'Transform existing data',
    },
  ];

  const companyItems = [
    {
      title: 'Company Settings',
      icon: Building2,
      page: 'settings' as Page,
      description: 'Manage company details',
    },
    {
      title: 'Data Export',
      icon: Download,
      page: 'export' as Page,
      description: 'Export data in various formats',
    },
    {
      title: 'Database',
      icon: Database,
      page: 'database' as Page,
      description: 'Database management',
    },
  ];

  const systemItems = [
    {
      title: 'Settings',
      icon: Settings,
      page: 'settings' as Page,
      description: 'Application settings',
    },
  ];

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <Sidebar variant="inset" className="border-r" data-testid="sidebar">
          <SidebarHeader className="border-b">
            <div className="flex items-center gap-2 px-2 py-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <BarChart3 className="h-4 w-4" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-semibold">Sales Report</span>
                <span className="text-xs text-muted-foreground">
                  {selectedCompany ? selectedCompany.name : 'No Company'}
                </span>
              </div>
            </div>
          </SidebarHeader>

          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Navigation</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {navigationItems.map(item => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        data-testid={`nav-${item.page}`}
                        tooltip={item.description}
                        className="w-full justify-start"
                        onClick={() => onPageChange(item.page)}
                        isActive={currentPage === item.page}
                      >
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            {selectedCompany && (
              <SidebarGroup>
                <SidebarGroupLabel>Company</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {companyItems.map(item => (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton
                          tooltip={item.description}
                          className="w-full justify-start"
                          onClick={() => onPageChange(item.page)}
                          isActive={currentPage === item.page}
                        >
                          <item.icon className="h-4 w-4" />
                          <span>{item.title}</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            )}

            <SidebarGroup>
              <SidebarGroupLabel>System</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {systemItems.map(item => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        tooltip={item.description}
                        className="w-full justify-start"
                        onClick={() => onPageChange(item.page)}
                        isActive={currentPage === item.page}
                      >
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <SidebarFooter className="border-t">
            <div className="flex items-center gap-2 px-2 py-2">
              <div className="flex h-6 w-6 items-center justify-center rounded bg-muted">
                <Settings className="h-3 w-3" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-medium">Theme: {theme}</span>
                <span className="text-xs text-muted-foreground">
                  Press Ctrl+B to toggle sidebar
                </span>
              </div>
            </div>
          </SidebarFooter>
        </Sidebar>

        <div className="flex flex-1 flex-col">
          <header className="flex h-16 items-center gap-4 border-b bg-background px-4 relative z-[100]">
            <SidebarTrigger data-testid="sidebar-toggle" />
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-semibold">
                {selectedCompany
                  ? `${selectedCompany.name} - Sales Reports`
                  : 'Sales Report App'}
              </h1>
            </div>
            <div className="ml-auto flex items-center gap-4">
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
              <ThemeToggle />
            </div>
          </header>
          <main className="flex-1 p-6">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
