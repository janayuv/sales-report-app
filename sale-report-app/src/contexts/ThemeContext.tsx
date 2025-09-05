import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from 'react';

export type Theme = 'light' | 'dark' | 'system';
export type AccentColor =
  | 'blue'
  | 'green'
  | 'purple'
  | 'orange'
  | 'red'
  | 'pink'
  | 'yellow'
  | 'indigo';

interface ThemeContextType {
  theme: Theme;
  accentColor: AccentColor;
  setTheme: (theme: Theme) => void;
  setAccentColor: (color: AccentColor) => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>('system');
  const [accentColor, setAccentColorState] = useState<AccentColor>('blue');
  const [isDark, setIsDark] = useState(false);

  // Load theme preferences from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as Theme;
    const savedAccentColor = localStorage.getItem('accentColor') as AccentColor;

    if (savedTheme) setThemeState(savedTheme);
    if (savedAccentColor) setAccentColorState(savedAccentColor);
  }, []);

  // Apply theme to document
  useEffect(() => {
    const root = document.documentElement;

    // Remove existing theme classes
    root.classList.remove('light', 'dark');

    // Determine if dark mode should be applied
    let shouldBeDark = false;

    if (theme === 'dark') {
      shouldBeDark = true;
    } else if (theme === 'system') {
      shouldBeDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    }

    setIsDark(shouldBeDark);

    if (shouldBeDark) {
      root.classList.add('dark');
    } else {
      root.classList.add('light');
    }
  }, [theme]);

  // Apply accent color to document
  useEffect(() => {
    const root = document.documentElement;

    // Remove existing accent color classes
    root.classList.remove(
      'accent-blue',
      'accent-green',
      'accent-purple',
      'accent-orange',
      'accent-red',
      'accent-pink',
      'accent-yellow',
      'accent-indigo'
    );

    // Add new accent color class
    root.classList.add(`accent-${accentColor}`);
  }, [accentColor]);

  // Listen for system theme changes
  useEffect(() => {
    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => {
        const shouldBeDark = mediaQuery.matches;
        setIsDark(shouldBeDark);
        document.documentElement.classList.toggle('dark', shouldBeDark);
      };

      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [theme]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem('theme', newTheme);
  };

  const setAccentColor = (newColor: AccentColor) => {
    setAccentColorState(newColor);
    localStorage.setItem('accentColor', newColor);
  };

  const value: ThemeContextType = {
    theme,
    accentColor,
    setTheme,
    setAccentColor,
    isDark,
  };

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};
