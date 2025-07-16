import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextProps {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextProps>({
  theme: 'system',
  setTheme: () => {},
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>('system');

  useEffect(() => {
    // Carrega preferência do localStorage
    const saved = localStorage.getItem('theme') as Theme | null;
    if (saved) setThemeState(saved);
  }, []);

  useEffect(() => {
    // Aplica tema
    const root = window.document.documentElement;
    const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    let applied: Theme = theme;
    if (theme === 'system') {
      applied = systemDark ? 'dark' : 'light';
    }
    root.classList.remove('light', 'dark');
    root.classList.add(applied);
    if (applied === 'dark') {
      root.classList.add('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const setTheme = (t: Theme) => setThemeState(t);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext); 