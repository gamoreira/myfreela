import { createContext, useContext, useState, useEffect, useRef, ReactNode, useCallback } from 'react';
import { settingsService } from '../services/settingsService';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  isDark: boolean;
  syncFromBackend: () => Promise<void>;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

function getInitialTheme(): Theme {
  const stored = localStorage.getItem('theme');
  if (stored === 'dark' || stored === 'light') return stored;
  if (window.matchMedia('(prefers-color-scheme: dark)').matches) return 'dark';
  return 'light';
}

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  root.classList.add('theme-transition');

  if (theme === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }

  root.style.colorScheme = theme;
  localStorage.setItem('theme', theme);

  setTimeout(() => root.classList.remove('theme-transition'), 300);
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(getInitialTheme);
  const skipBackendSync = useRef(false);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
    // Save to backend
    settingsService.updateUserSettings({ theme: newTheme }).catch(() => {
      // Silently fail if not authenticated (e.g. login page)
    });
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState(prev => {
      const next = prev === 'light' ? 'dark' : 'light';
      settingsService.updateUserSettings({ theme: next }).catch(() => {});
      return next;
    });
  }, []);

  const syncFromBackend = useCallback(async () => {
    try {
      const settings = await settingsService.getUserSettings();
      if (settings.theme && settings.theme !== theme) {
        skipBackendSync.current = true;
        setThemeState(settings.theme);
      }
    } catch {
      // Not authenticated or settings not available yet
    }
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme, isDark: theme === 'dark', syncFromBackend }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
