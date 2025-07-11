import React, { useMemo, useState, createContext } from 'react';
import ReactDOM from 'react-dom/client';
import { ThemeProvider, CssBaseline, createTheme } from '@mui/material';
import App, { LoadingContext } from './App';
import * as serviceWorkerRegistration from './serviceWorkerRegistration';
import { HelmetProvider } from 'react-helmet-async';

// Theme palettes
const palettes = {
  emerald: {
    name: 'Emerald Spring Whisper',
    darkGreen: '#135E4B',
    green: '#4CB572',
    lightGreen: '#A1D8B5',
    light: '#CCDCDB',
  },
  indigo: {
    name: 'Indigo Pink',
    darkGreen: '#3F51B5',
    green: '#E91E63',
    lightGreen: '#C5CAE9',
    light: '#F8BBD0',
  },
  orange: {
    name: 'Orange Blue',
    darkGreen: '#FF9800',
    green: '#1976D2',
    lightGreen: '#FFE0B2',
    light: '#BBDEFB',
  },
};

export const ThemeContext = createContext({
  paletteKey: 'emerald',
  setPaletteKey: () => {},
  colorBlind: false,
  setColorBlind: () => {},
});

/**
 * Main entry point for rendering the React application.
 * Renders the App component and registers the service worker.
 */
function Main() {
  const [mode, setMode] = useState(() => localStorage.getItem('themeMode') || 'light');
  const [paletteKey, setPaletteKey] = useState(() => localStorage.getItem('paletteKey') || 'emerald');
  const [colorBlind, setColorBlind] = useState(() => localStorage.getItem('colorBlind') === 'true');
  const [loading, setLoading] = useState(false);

  // Save theme selection and accessibility settings to localStorage
  const handleSetPaletteKey = (key) => {
    setPaletteKey(key);
    localStorage.setItem('paletteKey', key);
  };
  const handleSetColorBlind = (val) => {
    setColorBlind(val);
    localStorage.setItem('colorBlind', val);
  };
  const handleSetMode = (m) => {
    setMode(m);
    localStorage.setItem('themeMode', m);
  };

  const palette = palettes[paletteKey];
  const theme = useMemo(() => createTheme({
    palette: {
      mode,
      primary: {
        main: colorBlind ? '#000' : (mode === 'light' ? palette.darkGreen : palette.lightGreen),
        contrastText: mode === 'light' ? '#fff' : palette.darkGreen,
      },
      secondary: {
        main: colorBlind ? '#1976D2' : (mode === 'light' ? palette.green : palette.light),
        contrastText: mode === 'light' ? '#fff' : palette.darkGreen,
      },
      background: {
        default: colorBlind ? '#fff' : (mode === 'light' ? palette.light : '#181a20'),
        paper: colorBlind ? '#f5f5f5' : (mode === 'light' ? '#fff' : '#23272f'),
      },
      success: {
        main: colorBlind ? '#388e3c' : palette.green,
      },
      info: {
        main: colorBlind ? '#0288d1' : palette.lightGreen,
      },
    },
    typography: {
      fontFamily: 'Inter, Roboto, Arial, sans-serif',
    },
    shape: {
      borderRadius: 12,
    },
  }), [mode, palette, colorBlind]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <ThemeContext.Provider value={{ paletteKey, setPaletteKey: handleSetPaletteKey, colorBlind, setColorBlind: handleSetColorBlind, mode, setMode: handleSetMode, palettes }}>
        <LoadingContext.Provider value={{ loading, setLoading }}>
          <App themeMode={mode} setThemeMode={handleSetMode} />
        </LoadingContext.Provider>
      </ThemeContext.Provider>
    </ThemeProvider>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <HelmetProvider>
      <Main />
    </HelmetProvider>
  </React.StrictMode>
);

// PWA: Service worker registration
serviceWorkerRegistration.register(); 