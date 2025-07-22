import { CssBaseline } from '@mui/material';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import PropTypes from 'prop-types';
import React, { createContext, useState, useEffect, useMemo } from 'react';

export const ThemeContext = createContext({});

export const CustomThemeProvider = ({ children }) => {
  const [mode, setMode] = useState(() => {
    // Get theme from localStorage or default to 'light'
    const savedMode = localStorage.getItem('themeMode');
    return savedMode || 'light';
  });

  useEffect(() => {
    // Save theme preference to localStorage
    localStorage.setItem('themeMode', mode);
  }, [mode]);

  const toggleColorMode = () => {
    setMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'));
  };

  const theme = useMemo(() => {
    return createTheme({
      palette: {
        mode,
        ...(mode === 'light'
          ? {
            // Light mode colors
            primary: {
              main: '#1976d2',
              light: '#42a5f5',
              dark: '#1565c0'
            },
            secondary: {
              main: '#dc004e',
              light: '#ff5983',
              dark: '#9a0036'
            },
            background: {
              default: '#f5f5f5',
              paper: '#ffffff'
            },
            text: {
              primary: '#333333',
              secondary: '#666666'
            }
          }
          : {
            // Dark mode colors
            primary: {
              main: '#90caf9',
              light: '#e3f2fd',
              dark: '#42a5f5'
            },
            secondary: {
              main: '#f48fb1',
              light: '#fce4ec',
              dark: '#e91e63'
            },
            background: {
              default: '#121212',
              paper: '#1e1e1e'
            },
            text: {
              primary: '#ffffff',
              secondary: '#aaaaaa'
            }
          })
      },
      typography: {
        fontFamily: [
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          '"Helvetica Neue"',
          'Arial',
          'sans-serif',
          '"Apple Color Emoji"',
          '"Segoe UI Emoji"',
          '"Segoe UI Symbol"'
        ].join(','),
        h1: {
          fontWeight: 600
        },
        h2: {
          fontWeight: 600
        },
        h3: {
          fontWeight: 600
        },
        h4: {
          fontWeight: 600
        },
        h5: {
          fontWeight: 600
        },
        h6: {
          fontWeight: 600
        }
      },
      components: {
        MuiAppBar: {
          styleOverrides: {
            root: {
              boxShadow: 'none',
              borderBottom: `1px solid ${mode === 'light' ? '#e0e0e0' : '#333333'}`
            }
          }
        },
        MuiDrawer: {
          styleOverrides: {
            paper: {
              boxShadow: 'none',
              borderRight: `1px solid ${mode === 'light' ? '#e0e0e0' : '#333333'}`
            }
          }
        },
        MuiListItemButton: {
          styleOverrides: {
            root: {
              borderRadius: 8,
              margin: '4px 8px',
              '&.Mui-selected': {
                backgroundColor: mode === 'light' ? '#e3f2fd' : '#1e3a8a',
                '&:hover': {
                  backgroundColor: mode === 'light' ? '#bbdefb' : '#1e40af'
                }
              }
            }
          }
        },
        MuiCard: {
          styleOverrides: {
            root: {
              boxShadow: mode === 'light'
                ? '0 2px 8px rgba(0,0,0,0.1)'
                : '0 2px 8px rgba(0,0,0,0.3)',
              borderRadius: 12
            }
          }
        },
        MuiButton: {
          styleOverrides: {
            root: {
              borderRadius: 8,
              textTransform: 'none',
              fontWeight: 500
            }
          }
        },
        MuiTextField: {
          styleOverrides: {
            root: {
              '& .MuiOutlinedInput-root': {
                borderRadius: 8
              }
            }
          }
        }
      }
    });
  }, [mode]);

  const value = {
    mode,
    toggleColorMode,
    theme
  };

  return (
    <ThemeContext.Provider value={value}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ThemeContext.Provider>
  );
};

CustomThemeProvider.propTypes = {
  children: PropTypes.node.isRequired
};
