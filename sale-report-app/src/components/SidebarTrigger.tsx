import React from 'react';
import { Menu, ChevronLeft } from 'lucide-react';

interface SidebarTriggerProps {
  onToggle: () => void;
  className?: string;
  'data-testid'?: string;
  variant?: 'menu' | 'close';
}

export const SidebarTrigger: React.FC<SidebarTriggerProps> = ({
  onToggle,
  className = '',
  'data-testid': testId = 'sidebar-toggle',
  variant = 'menu',
}) => {
  const Icon = variant === 'close' ? ChevronLeft : Menu;
  const iconSize = variant === 'close' ? 18 : 20;
  const ariaLabel = variant === 'close' ? 'Close sidebar' : 'Toggle sidebar';

  return (
    <button
      data-testid={testId}
      onClick={onToggle}
      className={`p-2 text-muted-foreground hover:text-foreground transition-colors ${className}`}
      aria-label={ariaLabel}
    >
      <Icon size={iconSize} />
    </button>
  );
};

// Convenience component for close button
export const SidebarCloseTrigger: React.FC<
  Omit<SidebarTriggerProps, 'variant'>
> = props => <SidebarTrigger {...props} variant="close" />;
