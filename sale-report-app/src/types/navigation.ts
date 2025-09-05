import type React from 'react';

// Current page state
export type Page = 'dashboard' | 'customers' | 'reports' | 'settings';

export interface NavigationItem {
  id: Page;
  label: string;
  icon: React.ComponentType<{ size?: number }>;
}
