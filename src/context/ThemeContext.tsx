import React, { createContext, useContext, useEffect, useState } from 'react';
import { AppTheme, ThemeOption } from '../types';

export const THEME_OPTIONS: ThemeOption[] = [
  {
    id: 'clinical',
    name: 'Clinical Light',
    tagline: 'Crisp daytime hospital ward & high clarity',
    badge: 'Standard Day',
    bgHex: '#f8fafc',
    surfaceHex: '#ffffff',
    accentHex: '#e11d48',
  },
  {
    id: 'midnight',
    name: 'Midnight Tactical',
    tagline: 'Night ambulance, low-glare & battery saver',
    badge: 'Night / OLED',
    bgHex: '#090d16',
    surfaceHex: '#111827',
    accentHex: '#f43f5e',
  },
  {
    id: 'high-contrast',
    name: 'High Contrast Assist',
    tagline: 'Bright sunlight & visual impairment accessibility',
    badge: 'Accessibility',
    bgHex: '#000000',
    surfaceHex: '#0d0d0d',
    accentHex: '#facc15',
  },
  {
    id: 'calm-sage',
    name: 'Calm Sage',
    tagline: 'Therapeutic mint & teal to reduce acute panic',
    badge: 'De-Stress',
    bgHex: '#f0f5f2',
    surfaceHex: '#ffffff',
    accentHex: '#0f766e',
  },
];

interface ThemeContextType {
  theme: AppTheme;
  setTheme: (theme: AppTheme) => void;
  availableThemes: ThemeOption[];
  currentThemeConfig: ThemeOption;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<AppTheme>(() => {
    try {
      const saved = localStorage.getItem('mediresq_theme') as AppTheme;
      if (saved && THEME_OPTIONS.some((t) => t.id === saved)) {
        return saved;
      }
    } catch {
      // ignore
    }
    return 'clinical';
  });

  const setTheme = (newTheme: AppTheme) => {
    setThemeState(newTheme);
    try {
      localStorage.setItem('mediresq_theme', newTheme);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', theme);
    // Remove old theme classes
    THEME_OPTIONS.forEach((t) => {
      root.classList.remove(`theme-${t.id}`);
    });
    root.classList.add(`theme-${theme}`);

    // Update meta theme-color for mobile browsers
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    const currentConfig = THEME_OPTIONS.find((t) => t.id === theme) || THEME_OPTIONS[0];
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', currentConfig.bgHex);
    }
  }, [theme]);

  const currentThemeConfig = THEME_OPTIONS.find((t) => t.id === theme) || THEME_OPTIONS[0];

  return (
    <ThemeContext.Provider
      value={{
        theme,
        setTheme,
        availableThemes: THEME_OPTIONS,
        currentThemeConfig,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
