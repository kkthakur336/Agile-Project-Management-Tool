import React, { createContext, useContext, useState, useEffect } from 'react';

const DARK_KEY = 'sprintly_dark_mode';

interface ThemeContextType {
  isDark: boolean;
  toggle: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: React.ReactNode }): JSX.Element => {
  const [isDark, setIsDark] = useState<boolean>(() => {
    const stored = localStorage.getItem(DARK_KEY);
    return stored === 'true';
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem(DARK_KEY, String(isDark));
  }, [isDark]);

  const toggle = () => setIsDark(prev => !prev);

  return (
    <ThemeContext.Provider value={{ isDark, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useDarkMode = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useDarkMode must be used within a ThemeProvider');
  }
  return context;
};
