import { createTheme } from '@mui/material/styles';

const theme = createTheme({
    palette: {
        primary: {
            main: '#2563eb',
            dark: '#1e40af',
            light: '#3b82f6',
            contrastText: '#ffffff',
        },
        secondary: {
            main: '#10b981',
            dark: '#059669',
            light: '#34d399',
            contrastText: '#ffffff',
        },
        error: {
            main: '#ef4444',
            dark: '#dc2626',
            light: '#f87171',
        },
        warning: {
            main: '#f59e0b',
            dark: '#d97706',
            light: '#fbbf24',
        },
        info: {
            main: '#3b82f6',
            dark: '#2563eb',
            light: '#60a5fa',
        },
        success: {
            main: '#10b981',
            dark: '#059669',
            light: '#34d399',
        },
        background: {
            default: '#f9fafb',
            paper: '#ffffff',
        },
        text: {
            primary: '#111827',
            secondary: '#6b7280',
            disabled: '#9ca3af',
        },
        divider: '#e5e7eb',
    },
    typography: {
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif",
        h1: {
            fontSize: '2.25rem',
            fontWeight: 700,
            lineHeight: 1.2,
            letterSpacing: '-0.02em',
        },
        h2: {
            fontSize: '1.875rem',
            fontWeight: 700,
            lineHeight: 1.3,
            letterSpacing: '-0.01em',
        },
        h3: {
            fontSize: '1.5rem',
            fontWeight: 600,
            lineHeight: 1.4,
        },
        h4: {
            fontSize: '1.25rem',
            fontWeight: 600,
            lineHeight: 1.4,
        },
        h5: {
            fontSize: '1.125rem',
            fontWeight: 600,
            lineHeight: 1.5,
        },
        h6: {
            fontSize: '1rem',
            fontWeight: 600,
            lineHeight: 1.5,
        },
        body1: {
            fontSize: '1rem',
            lineHeight: 1.6,
        },
        body2: {
            fontSize: '0.875rem',
            lineHeight: 1.6,
        },
        button: {
            textTransform: 'none',
            fontWeight: 600,
        },
    },
    shape: {
        borderRadius: 8,
    },
    shadows: [
        'none',
        '0 1px 2px rgba(0,0,0,0.05)',
        '0 1px 3px rgba(0,0,0,0.1)',
        '0 4px 6px rgba(0,0,0,0.07)',
        '0 5px 15px rgba(0,0,0,0.08)',
        '0 10px 15px rgba(0,0,0,0.1)',
        '0 10px 20px rgba(0,0,0,0.12)',
        '0 15px 25px rgba(0,0,0,0.15)',
        '0 20px 25px rgba(0,0,0,0.15)',
        '0 25px 30px rgba(0,0,0,0.18)',
        ...Array(15).fill('0 25px 30px rgba(0,0,0,0.18)'),
    ],
    components: {
        MuiButton: {
            styleOverrides: {
                root: {
                    borderRadius: 8,
                    padding: '10px 20px',
                    fontSize: '0.9375rem',
                    fontWeight: 600,
                    boxShadow: 'none',
                    '&:hover': {
                        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                    },
                },
                contained: {
                    '&:hover': {
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    },
                },
                sizeLarge: {
                    padding: '12px 28px',
                    fontSize: '1rem',
                },
                sizeSmall: {
                    padding: '6px 16px',
                    fontSize: '0.875rem',
                },
            },
        },
        MuiTextField: {
            styleOverrides: {
                root: {
                    '& .MuiOutlinedInput-root': {
                        borderRadius: 8,
                        backgroundColor: '#ffffff',
                        transition: 'all 0.2s',
                        '&:hover': {
                            backgroundColor: '#f9fafb',
                        },
                        '&.Mui-focused': {
                            backgroundColor: '#ffffff',
                        },
                    },
                },
            },
        },
        MuiPaper: {
            styleOverrides: {
                root: {
                    borderRadius: 12,
                },
                elevation1: {
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                },
                elevation2: {
                    boxShadow: '0 4px 6px rgba(0,0,0,0.07)',
                },
            },
        },
        MuiCard: {
            styleOverrides: {
                root: {
                    borderRadius: 12,
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                    border: '1px solid #e5e7eb',
                },
            },
        },
        MuiDialog: {
            styleOverrides: {
                paper: {
                    borderRadius: 16,
                    boxShadow: '0 20px 25px rgba(0,0,0,0.15)',
                },
            },
        },
        MuiTableCell: {
            styleOverrides: {
                head: {
                    fontWeight: 600,
                    backgroundColor: '#f9fafb',
                    borderBottom: '2px solid #e5e7eb',
                },
            },
        },
        MuiChip: {
            styleOverrides: {
                root: {
                    borderRadius: 6,
                    fontWeight: 500,
                },
            },
        },
        MuiTab: {
            styleOverrides: {
                root: {
                    textTransform: 'none',
                    fontWeight: 600,
                    fontSize: '0.9375rem',
                },
            },
        },
    },
});

export default theme;
