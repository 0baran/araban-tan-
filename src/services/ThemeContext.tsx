import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import {loadSettings, saveSettings} from './AppSettings';

export type ThemeColors = {
  bg: string;
  card: string;
  cardBorder: string;
  text: string;
  textDim: string;
  textMuted: string;
  inputBg: string;
  accent: string;
  gaugeBg: string;
};

const dark: ThemeColors = {
  bg: '#0a0b10',
  card: 'rgba(30,33,40,0.7)',
  cardBorder: 'rgba(255,255,255,0.05)',
  text: '#fff',
  textDim: 'rgba(255,255,255,0.5)',
  textMuted: 'rgba(255,255,255,0.3)',
  inputBg: 'rgba(30,33,40,0.7)',
  accent: '#00bfff',
  gaugeBg: 'rgba(0,191,255,0.08)',
};

const light: ThemeColors = {
  bg: '#f0f2f5',
  card: '#ffffff',
  cardBorder: 'rgba(0,0,0,0.08)',
  text: '#1a1a2e',
  textDim: 'rgba(0,0,0,0.5)',
  textMuted: 'rgba(0,0,0,0.3)',
  inputBg: '#e8eaed',
  accent: '#0077b6',
  gaugeBg: 'rgba(0,119,182,0.08)',
};

type ThemeCtx = {
  darkMode: boolean;
  colors: ThemeColors;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeCtx>({
  darkMode: true,
  colors: dark,
  toggleTheme: () => {},
});

export function ThemeProvider({children}: {children: ReactNode}) {
  const [darkMode, setDarkMode] = useState(true);

  useEffect(() => {
    loadSettings().then(s => {
      if (s.darkMode !== undefined) setDarkMode(s.darkMode);
    });
  }, []);

  const toggleTheme = () => {
    const next = !darkMode;
    setDarkMode(next);
    saveSettings({darkMode: next});
  };

  return (
    <ThemeContext.Provider
      value={{darkMode, colors: darkMode ? dark : light, toggleTheme}}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeCtx {
  return useContext(ThemeContext);
}
