import type React from 'react';

// Current page state
export type Page =
  | 'dashboard'
  | 'customers'
  | 'reports'
  | 'settings'
  | 'import_transform'
  | 'transform_existing';

export interface NavigationItem {
  id: Page;
  label: string;
  icon: React.ComponentType<{ size?: number }>;
}
