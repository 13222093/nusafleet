import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { createTheme, ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#009688', // Seafoam Blue / Teal
      light: '#80CBC4',
      dark: '#00695C',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#4DB6AC',
    },
    background: {
      default: '#f3f6f5',
      paper: '#FFFFFF',   
    },
    text: {
        primary: '#0c2a2e',
        secondary: '#51676a',
    }
  },
  typography: {
      fontFamily: '"Product Sans", "Google Sans", "Segoe UI", Roboto, system-ui, sans-serif',
      allVariants: {
          fontFamily: '"Product Sans", "Google Sans", "Segoe UI", Roboto, system-ui, sans-serif',
      },
      h4: {
          fontWeight: 400,
          color: '#0c2a2e',
      },
      h6: {
          fontWeight: 500,
          color: '#0c2a2e',
      },
      subtitle2: {
           fontWeight: 500,
           letterSpacing: 0.1,
      }
  },
  shape: {
    borderRadius: 24, // M3 allows up to 28px for large containers
  },
  components: {
      MuiCard: {
          styleOverrides: {
              root: {
                  backgroundImage: 'none',
                  boxShadow: 'none',
                  backgroundColor: '#ffffff',
                  border: '1px solid #dde6e4',
                  borderRadius: 24,
              }
          }
      },
      MuiPaper: {
          styleOverrides: {
              root: {
                  backgroundImage: 'none',
              },
              rounded: {
                   borderRadius: 24,
              }
          }
      },
      MuiButton: {
          styleOverrides: {
              root: {
                  borderRadius: 20,
                  textTransform: 'none',
                  boxShadow: 'none',
                  '&:hover': {
                      boxShadow: 'none',
                  }
              },
              contained: {
                  backgroundColor: '#009688',
                  color: '#FFFFFF',
              }
          }
      },
      MuiDrawer: {
          styleOverrides: {
              paper: {
                  backgroundColor: '#E0F2F1', // Rail background
                  borderRight: 'none',
              }
          }
      },
      MuiAppBar: {
          styleOverrides: {
              root: {
                  backgroundColor: '#F0F7F6',
                  color: '#0c2a2e',
                  boxShadow: 'none',
              }
          }
      }
  }
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <App />
    </ThemeProvider>
  </React.StrictMode>,
)
