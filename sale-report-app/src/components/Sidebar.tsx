import React from 'react';
import { cn } from '../utils/cn';
import {
  Building2,
  Users,
  FileText,
  BarChart3,
  Settings,
  Upload,
  RefreshCw,
} from 'lucide-react';
import type { Page, NavigationItem } from '../types/navigation';
import { SidebarCloseTrigger } from './SidebarTrigger';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  currentPage: Page;
  onPageChange: (page: Page) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  currentPage,
  onPageChange,
}) => {
  const navigationItems: NavigationItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: BarChart3,
    },
    {
      id: 'customers',
      label: 'Customers',
      icon: Users,
    },
    {
      id: 'reports',
      label: 'Reports',
      icon: FileText,
    },
    {
      id: 'import_transform',
      label: 'Import & Transform',
      icon: Upload,
    },
    {
      id: 'transform_existing',
      label: 'Transform Existing',
      icon: RefreshCw,
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
    },
  ];

  return (
    <>
      {/* Sidebar */}
      <aside
        data-testid="sidebar"
        className={cn(
          'fixed top-14 bottom-0 left-0 z-50 w-64 bg-card border-r border-border transform transition-transform duration-200 ease-in-out lg:relative lg:translate-x-0 lg:top-0 lg:h-full lg:flex-shrink-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex flex-col h-full">
          {/* Sidebar header */}
          <div className="flex items-center justify-between h-14 px-4 border-b border-border">
            <div className="flex items-center gap-2">
              <Building2 className="text-primary" size={20} />
              <span className="text-base font-semibold text-foreground">
                Sales Report
              </span>
            </div>
            <SidebarCloseTrigger
              onToggle={onClose}
              className="lg:hidden"
              data-testid="sidebar-close"
            />
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4">
            <ul className="space-y-2">
              {navigationItems.map(item => {
                const Icon = item.icon;
                return (
                  <li key={item.id}>
                    <button
                      data-testid={`nav-${item.id}`}
                      onClick={() => onPageChange(item.id)}
                      className={cn(
                        'flex items-center gap-3 w-full px-3 py-2 rounded-md text-sm font-medium transition-colors',
                        currentPage === item.id
                          ? 'bg-primary text-primary-foreground'
                          : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                      )}
                    >
                      <Icon size={20} />
                      <span className="hidden lg:inline">{item.label}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>
      </aside>

      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
          onKeyDown={e => {
            if (e.key === 'Escape') {
              onClose();
            }
          }}
          role="button"
          tabIndex={0}
          aria-label="Close sidebar"
        />
      )}
    </>
  );
};
