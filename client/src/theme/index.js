import { createTheme, alpha } from '@mui/material/styles';

const getTheme = (mode = 'light') => {
  const isDark = mode === 'dark';

  return createTheme({
    palette: {
      mode,
      primary: {
        main: '#2563EB',
        light: '#60A5FA',
        dark: '#1D4ED8',
        contrastText: '#FFFFFF',
      },
      secondary: {
        main: '#7C3AED',
        light: '#A78BFA',
        dark: '#5B21B6',
        contrastText: '#FFFFFF',
      },
      success: {
        main: '#059669',
        light: '#34D399',
        dark: '#047857',
      },
      warning: {
        main: '#D97706',
        light: '#FBBF24',
        dark: '#B45309',
      },
      error: {
        main: '#DC2626',
        light: '#F87171',
        dark: '#B91C1C',
      },
      info: {
        main: '#0891B2',
        light: '#22D3EE',
        dark: '#0E7490',
      },
      background: {
        default: isDark ? '#0F172A' : '#F1F5F9',
        paper: isDark ? '#1E293B' : '#FFFFFF',
      },
      text: {
        primary: isDark ? '#F1F5F9' : '#1E293B',
        secondary: isDark ? '#94A3B8' : '#64748B',
        disabled: isDark ? '#64748B' : '#94A3B8',
      },
      divider: isDark ? '#334155' : '#E2E8F0',
    },
    typography: {
      fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      h1: { fontSize: '2rem', fontWeight: 700, lineHeight: 1.2, letterSpacing: '-0.02em' },
      h2: { fontSize: '1.5rem', fontWeight: 700, lineHeight: 1.3, letterSpacing: '-0.01em' },
      h3: { fontSize: '1.25rem', fontWeight: 600, lineHeight: 1.4 },
      h4: { fontSize: '1.125rem', fontWeight: 600, lineHeight: 1.4 },
      h5: { fontSize: '1rem', fontWeight: 600, lineHeight: 1.5 },
      h6: { fontSize: '0.875rem', fontWeight: 600, lineHeight: 1.5 },
      subtitle1: { fontSize: '1rem', fontWeight: 500, lineHeight: 1.5 },
      subtitle2: { fontSize: '0.875rem', fontWeight: 500, lineHeight: 1.57 },
      body1: { fontSize: '0.938rem', lineHeight: 1.6 },
      body2: { fontSize: '0.875rem', lineHeight: 1.57 },
      caption: { fontSize: '0.75rem', lineHeight: 1.66 },
      button: { textTransform: 'none', fontWeight: 600, fontSize: '0.875rem' },
    },
    shape: {
      borderRadius: 10,
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            padding: '8px 20px',
            fontWeight: 600,
            boxShadow: 'none',
            '&:hover': { boxShadow: '0 1px 3px 0 rgba(0,0,0,0.1)' },
          },
          contained: {
            '&:hover': { boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' },
          },
          outlined: {
            borderWidth: '1.5px',
            '&:hover': { borderWidth: '1.5px' },
          },
          sizeSmall: { padding: '4px 12px', fontSize: '0.813rem' },
          sizeLarge: { padding: '12px 28px', fontSize: '0.938rem' },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            boxShadow: isDark
              ? '0 1px 3px 0 rgba(0,0,0,0.3)'
              : '0 1px 3px 0 rgba(0,0,0,0.1), 0 1px 2px -1px rgba(0,0,0,0.1)',
            border: `1px solid ${isDark ? '#334155' : '#F1F5F9'}`,
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: { backgroundImage: 'none' },
          rounded: { borderRadius: 12 },
        },
      },
      MuiTableCell: {
        styleOverrides: {
          root: { borderColor: isDark ? '#334155' : '#F1F5F9', padding: '14px 16px' },
          head: {
            fontWeight: 600,
            backgroundColor: isDark ? '#1E293B' : '#F8FAFC',
            color: isDark ? '#94A3B8' : '#475569',
            fontSize: '0.813rem',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          },
        },
      },
      MuiTableRow: {
        styleOverrides: {
          root: { '&:hover': { backgroundColor: isDark ? '#334155 !important' : '#F8FAFC !important' } },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              borderRadius: 8,
              '& fieldset': { borderColor: isDark ? '#475569' : '#E2E8F0' },
              '&:hover fieldset': { borderColor: isDark ? '#64748B' : '#94A3B8' },
            },
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: { borderRadius: 6, fontWeight: 500, fontSize: '0.75rem' },
        },
      },
      MuiDialog: {
        styleOverrides: {
          paper: { borderRadius: 16, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' },
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: { border: 'none' },
        },
      },
      MuiListItemButton: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            marginBottom: 2,
            '&.Mui-selected': {
              backgroundColor: alpha('#2563EB', 0.08),
              '&:hover': { backgroundColor: alpha('#2563EB', 0.12) },
            },
          },
        },
      },
      MuiAlert: {
        styleOverrides: {
          root: { borderRadius: 10 },
        },
      },
      MuiTooltip: {
        styleOverrides: {
          tooltip: { borderRadius: 6, fontSize: '0.75rem' },
        },
      },
    },
  });
};

// Default export for backward compatibility
const theme = getTheme('light');
export { getTheme };
export default theme;
