import React, { useState } from 'react';
import {
  useTheme,
  type Theme,
  type AccentColor,
} from '../contexts/ThemeContext';
import { Sun, Moon, Monitor, Palette, ChevronDown } from 'lucide-react';
import { cn } from '../utils/cn';

export const ThemeToggle: React.FC = () => {
  const { theme, accentColor, setTheme, setAccentColor } = useTheme();
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const [showColorMenu, setShowColorMenu] = useState(false);

  const themeOptions: { value: Theme; label: string; icon: React.ReactNode }[] =
    [
      { value: 'light', label: 'Light', icon: <Sun size={16} /> },
      { value: 'dark', label: 'Dark', icon: <Moon size={16} /> },
      { value: 'system', label: 'System', icon: <Monitor size={16} /> },
    ];

  const colorOptions: { value: AccentColor; label: string; color: string }[] = [
    { value: 'blue', label: 'Blue', color: 'bg-blue-500' },
    { value: 'green', label: 'Green', color: 'bg-green-500' },
    { value: 'purple', label: 'Purple', color: 'bg-purple-500' },
    { value: 'orange', label: 'Orange', color: 'bg-orange-500' },
    { value: 'red', label: 'Red', color: 'bg-red-500' },
    { value: 'pink', label: 'Pink', color: 'bg-pink-500' },
    { value: 'yellow', label: 'Yellow', color: 'bg-yellow-500' },
    { value: 'indigo', label: 'Indigo', color: 'bg-indigo-500' },
  ];

  const currentTheme = themeOptions.find(t => t.value === theme);
  const currentColor = colorOptions.find(c => c.value === accentColor);

  return (
    <div className="flex items-center gap-2">
      {/* Theme Toggle */}
      <div className="relative">
        <button
          data-testid="theme-toggle"
          onClick={() => setShowThemeMenu(!showThemeMenu)}
          className="flex items-center gap-2 px-3 py-2 rounded-md border border-border bg-background hover:bg-accent transition-colors"
          aria-label="Toggle theme"
          style={{ minWidth: '120px' }}
        >
          {currentTheme?.icon}
          <span className="hidden sm:inline text-sm">
            {currentTheme?.label}
          </span>
          <ChevronDown
            size={14}
            className={cn(
              'transition-transform',
              showThemeMenu && 'rotate-180'
            )}
          />
        </button>

        {showThemeMenu && (
          <div className="absolute right-0 top-full mt-1 w-32 bg-card border border-border rounded-md shadow-lg z-50">
            {themeOptions.map(option => (
              <button
                key={option.value}
                onClick={() => {
                  setTheme(option.value);
                  setShowThemeMenu(false);
                }}
                className={cn(
                  'flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-accent transition-colors',
                  theme === option.value && 'bg-accent'
                )}
              >
                {option.icon}
                {option.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Accent Color Toggle */}
      <div className="relative">
        <button
          data-testid="accent-color-toggle"
          onClick={() => setShowColorMenu(!showColorMenu)}
          className="flex items-center gap-2 px-3 py-2 rounded-md border border-border bg-background hover:bg-accent transition-colors"
          aria-label="Change accent color"
          style={{ minWidth: '120px' }}
        >
          <Palette size={16} />
          <div className={cn('w-4 h-4 rounded-full', currentColor?.color)} />
          <ChevronDown
            size={14}
            className={cn(
              'transition-transform',
              showColorMenu && 'rotate-180'
            )}
          />
        </button>

        {showColorMenu && (
          <div className="absolute right-0 top-full mt-1 w-48 bg-card border border-border rounded-md shadow-lg z-50 p-2">
            <div className="grid grid-cols-4 gap-2">
              {colorOptions.map(option => (
                <button
                  key={option.value}
                  onClick={() => {
                    setAccentColor(option.value);
                    setShowColorMenu(false);
                  }}
                  className={cn(
                    'flex flex-col items-center gap-1 p-2 rounded-md hover:bg-accent transition-colors',
                    accentColor === option.value && 'bg-accent'
                  )}
                  aria-label={`Select ${option.label} accent color`}
                >
                  <div className={cn('w-6 h-6 rounded-full', option.color)} />
                  <span className="text-xs">{option.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Click outside to close menus */}
      {(showThemeMenu || showColorMenu) && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            setShowThemeMenu(false);
            setShowColorMenu(false);
          }}
          onKeyDown={e => {
            if (e.key === 'Escape') {
              setShowThemeMenu(false);
              setShowColorMenu(false);
            }
          }}
          role="button"
          tabIndex={0}
          aria-label="Close menus"
        />
      )}
    </div>
  );
};
