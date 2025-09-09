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
  Upload,
  Home,
} from 'lucide-react';
import { useCompanyContext } from '../contexts/CompanyContext';
import { ThemeToggle } from './ThemeToggle';
import type { Page } from '../types/navigation';

interface NavigationItem {
  id: Page;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}

interface ShadcnSidebarProps {
  children: React.ReactNode;
  currentPage: Page;
  onPageChange: (page: Page) => void;
}

export function ShadcnSidebar({
  children,
  currentPage,
  onPageChange,
}: ShadcnSidebarProps) {
  const { selectedCompany } = useCompanyContext();

  const navigationItems: NavigationItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: Home,
      description: 'Overview and analytics',
    },
    {
      id: 'reports',
      label: 'Sales Reports',
      icon: FileText,
      description: 'View and manage sales data',
    },
    {
      id: 'customers',
      label: 'Customers',
      icon: Users,
      description: 'Customer management',
    },
    {
      id: 'import_transform',
      label: 'Import & Transform',
      icon: Upload,
      description: 'Import and transform data',
    },
  ];

  const companyItems: NavigationItem[] = [
    {
      id: 'settings',
      label: 'Company Settings',
      icon: Building2,
      description: 'Manage company details',
    },
  ];

  const systemItems: NavigationItem[] = [
    {
      id: 'settings',
      label: 'App Settings',
      icon: Settings,
      description: 'Application settings',
    },
  ];

  const handleNavigation = (page: Page) => {
    onPageChange(page);
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <Sidebar variant="inset" className="border-r" data-testid="sidebar">
          <SidebarHeader className="border-b">
            <div
              className="flex items-center gap-2 px-2 py-2"
              data-testid="company-selector"
            >
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
                    <SidebarMenuItem key={item.id}>
                      <SidebarMenuButton
                        onClick={() => handleNavigation(item.id as Page)}
                        tooltip={item.description}
                        className="w-full justify-start"
                        isActive={currentPage === item.id}
                        data-testid={`nav-${item.id}`}
                      >
                        <item.icon className="h-4 w-4" />
                        <span>{item.label}</span>
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
                      <SidebarMenuItem key={item.id}>
                        <SidebarMenuButton
                          onClick={() => handleNavigation(item.id as Page)}
                          tooltip={item.description}
                          className="w-full justify-start"
                          isActive={currentPage === item.id}
                        >
                          <item.icon className="h-4 w-4" />
                          <span>{item.label}</span>
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
                    <SidebarMenuItem key={item.id}>
                      <SidebarMenuButton
                        onClick={() => handleNavigation(item.id as Page)}
                        tooltip={item.description}
                        className="w-full justify-start"
                        isActive={currentPage === item.id}
                      >
                        <item.icon className="h-4 w-4" />
                        <span>{item.label}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <SidebarFooter className="border-t">
            <div className="px-2 py-2">
              <ThemeToggle />
            </div>
          </SidebarFooter>
        </Sidebar>

        <div className="flex flex-1 flex-col">
          <header className="flex h-16 items-center gap-4 border-b bg-background px-4">
            <SidebarTrigger data-testid="sidebar-toggle" />
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-semibold">
                {selectedCompany
                  ? `${selectedCompany.name} - Sales Reports`
                  : 'Sales Report App'}
              </h1>
            </div>
          </header>
          <main className="flex-1 p-4">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
