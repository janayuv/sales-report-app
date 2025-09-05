// Responsive utilities for screen size detection and responsive helpers

export const BREAKPOINTS = {
  xs: 475,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const;

export type ScreenSize = keyof typeof BREAKPOINTS;

export function getScreenSize(): ScreenSize {
  if (typeof window === 'undefined') return 'lg';

  const width = window.innerWidth;

  if (width >= BREAKPOINTS['2xl']) return '2xl';
  if (width >= BREAKPOINTS.xl) return 'xl';
  if (width >= BREAKPOINTS.lg) return 'lg';
  if (width >= BREAKPOINTS.md) return 'md';
  if (width >= BREAKPOINTS.sm) return 'sm';
  return 'xs';
}

export function isMobile(): boolean {
  const screenSize = getScreenSize();
  return screenSize === 'xs' || screenSize === 'sm';
}

export function isTablet(): boolean {
  const screenSize = getScreenSize();
  return screenSize === 'md';
}

export function isDesktop(): boolean {
  const screenSize = getScreenSize();
  return screenSize === 'lg' || screenSize === 'xl' || screenSize === '2xl';
}

export function isLargeScreen(): boolean {
  const screenSize = getScreenSize();
  return screenSize === 'xl' || screenSize === '2xl';
}

// Responsive class helpers
export const responsiveClasses = {
  container: 'w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8',
  grid: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4',
  table: 'w-full overflow-x-auto',
  sidebar: 'w-64 lg:w-80 xl:w-96',
  sidebarCollapsed: 'w-16 lg:w-20',
  touchTarget: 'min-h-[44px] min-w-[44px]',
  text: {
    xs: 'text-xs sm:text-sm',
    sm: 'text-sm sm:text-base',
    base: 'text-base sm:text-lg',
    lg: 'text-lg sm:text-xl',
    xl: 'text-xl sm:text-2xl',
  },
  spacing: {
    xs: 'p-2 sm:p-3',
    sm: 'p-3 sm:p-4',
    base: 'p-4 sm:p-6',
    lg: 'p-6 sm:p-8',
    xl: 'p-8 sm:p-12',
  },
} as const;
