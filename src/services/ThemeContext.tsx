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

const neonDark: ThemeColors = {
  bg: '#05050A',
  card: 'rgba(255, 255, 255, 0.03)',
  cardBorder: 'rgba(0, 191, 255, 0.15)',
  text: '#ffffff',
  textDim: 'rgba(255,255,255,0.6)',
  textMuted: 'rgba(255,255,255,0.3)',
  inputBg: 'rgba(0, 191, 255, 0.05)',
  accent: '#00e5ff',
  gaugeBg: 'rgba(0, 229, 255, 0.08)',
};

const standardDark: ThemeColors = {
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
  neonTheme: boolean;
  colors: ThemeColors;
  toggleTheme: () => void;
  toggleNeon: () => void;
};

const ThemeContext = createContext<ThemeCtx>({
  darkMode: true,
  neonTheme: true,
  colors: neonDark,
  toggleTheme: () => {},
  toggleNeon: () => {},
});

export function ThemeProvider({children}: {children: ReactNode}) {
  const [darkMode, setDarkMode] = useState(true);
  const [neonTheme, setNeonTheme] = useState(true);

  useEffect(() => {
    loadSettings().then(s => {
      if (s.darkMode !== undefined) setDarkMode(s.darkMode);
      if (s.neonTheme !== undefined) setNeonTheme(s.neonTheme);
    });
  }, []);

  const toggleTheme = () => {
    const next = !darkMode;
    setDarkMode(next);
    saveSettings({darkMode: next});
  };

  const toggleNeon = () => {
    const next = !neonTheme;
    setNeonTheme(next);
    saveSettings({neonTheme: next});
  };

  const activeDark = neonTheme ? neonDark : standardDark;

  return (
    <ThemeContext.Provider
      value={{darkMode, neonTheme, colors: darkMode ? activeDark : light, toggleTheme, toggleNeon}}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeCtx {
  return useContext(ThemeContext);
}
