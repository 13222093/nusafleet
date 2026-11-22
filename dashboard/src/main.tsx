import React from 'react'
import ReactDOM from 'react-dom/client'
import '@fontsource-variable/archivo/standard.css'
import '@fontsource-variable/archivo/standard-italic.css'
import App from './App'
import './index.css'
import { createTheme, ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

import { FONT, UI } from './colors';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: UI.ink, light: UI.muted, dark: '#000000', contrastText: '#ffffff' },
    secondary: { main: UI.accent },
    background: { default: UI.bg, paper: UI.surface },
    text: { primary: UI.ink, secondary: UI.muted },
    divider: UI.line,
  },
  typography: {
    fontFamily: FONT,
    allVariants: { fontFamily: FONT, letterSpacing: '-0.005em' },
    h4: { fontWeight: 300, letterSpacing: '-0.02em', color: UI.ink },
    h5: { fontWeight: 400, letterSpacing: '-0.015em' },
    h6: { fontWeight: 500, color: UI.ink },
    subtitle2: { fontWeight: 500 },
  },
  shape: { borderRadius: 8 },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: { fontFeatureSettings: '"ss01", "tnum" 0', WebkitFontSmoothing: 'antialiased' },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: { backgroundImage: 'none', boxShadow: 'none', backgroundColor: UI.surface, border: `1px solid ${UI.line}`, borderRadius: 10 },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: { backgroundImage: 'none' },
        rounded: { borderRadius: 10 },
        elevation: { boxShadow: '0 1px 2px rgba(15,20,23,0.06), 0 8px 24px rgba(15,20,23,0.06)' },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: { borderRadius: 6, textTransform: 'none', boxShadow: 'none', fontWeight: 500, '&:hover': { boxShadow: 'none' } },
        contained: { backgroundColor: UI.ink, color: '#ffffff' },
      },
    },
    MuiSlider: {
      styleOverrides: {
        root: { color: UI.ink, height: 2 },
        thumb: { width: 14, height: 14, boxShadow: 'none', '&:hover, &.Mui-focusVisible': { boxShadow: `0 0 0 6px ${UI.accentSoft}` } },
        rail: { opacity: 1, backgroundColor: UI.line },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: { backgroundColor: UI.surface, borderLeft: `1px solid ${UI.line}`, boxShadow: '0 0 40px rgba(15,20,23,0.10)' },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: { backgroundColor: UI.ink, fontSize: 12, fontWeight: 400, borderRadius: 6, padding: '6px 10px' },
      },
    },
    MuiAppBar: {
      styleOverrides: { root: { backgroundColor: UI.bg, color: UI.ink, boxShadow: 'none' } },
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <App />
    </ThemeProvider>
  </React.StrictMode>,
)
