import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeToggle } from './ThemeToggle';
import { ThemeProvider } from '../contexts/ThemeContext';
import { SidebarProvider } from './ui/sidebar';

// Mock the ThemeContext
const mockThemeContext = {
  theme: 'light',
  accentColor: 'blue',
  setTheme: vi.fn(),
  setAccentColor: vi.fn(),
};

vi.mock('../contexts/ThemeContext', () => ({
  ThemeProvider: ({ children }: { children: React.ReactNode }) => children,
  useTheme: () => mockThemeContext,
}));

// Mock the useIsMobile hook
vi.mock('../hooks/use-mobile', () => ({
  useIsMobile: () => false,
}));

describe('ThemeToggle', () => {
  it('renders theme toggle button', () => {
    render(
      <SidebarProvider>
        <ThemeProvider>
          <ThemeToggle />
        </ThemeProvider>
      </SidebarProvider>
    );

    expect(screen.getByTestId('theme-toggle')).toBeInTheDocument();
  });

  it('opens theme menu when clicked', () => {
    render(
      <SidebarProvider>
        <ThemeProvider>
          <ThemeToggle />
        </ThemeProvider>
      </SidebarProvider>
    );

    const toggleButton = screen.getByTestId('theme-toggle');
    fireEvent.click(toggleButton);

    // Should show theme options (use getAllByText to handle multiple instances)
    expect(screen.getAllByText('Light')).toHaveLength(2); // Button text + dropdown option
    expect(screen.getByText('Dark')).toBeInTheDocument();
    expect(screen.getByText('System')).toBeInTheDocument();
  });

  it('calls setTheme when theme option is selected', () => {
    render(
      <SidebarProvider>
        <ThemeProvider>
          <ThemeToggle />
        </ThemeProvider>
      </SidebarProvider>
    );

    const toggleButton = screen.getByTestId('theme-toggle');
    fireEvent.click(toggleButton);

    const darkOption = screen.getByText('Dark');
    fireEvent.click(darkOption);

    expect(mockThemeContext.setTheme).toHaveBeenCalledWith('dark');
  });
});
