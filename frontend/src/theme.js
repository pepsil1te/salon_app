import { createTheme } from '@mui/material/styles';

/**
 * Цветовая палитра приложения
 */
const palette = {
  primary: {
    main: '#00838f',
    light: '#4fb3bf',
    dark: '#005662',
    contrastText: '#ffffff',
  },
  secondary: {
    main: '#ff6f00',
    light: '#ff9e40',
    dark: '#c43e00',
    contrastText: '#ffffff',
  },
  error: {
    main: '#d32f2f',
    light: '#ef5350',
    dark: '#c62828',
  },
  warning: {
    main: '#ed6c02',
    light: '#ff9800',
    dark: '#e65100',
  },
  info: {
    main: '#0288d1',
    light: '#03a9f4',
    dark: '#01579b',
  },
  success: {
    main: '#2e7d32',
    light: '#4caf50',
    dark: '#1b5e20',
  },
  grey: {
    50: '#fafafa',
    100: '#f5f5f5',
    200: '#eeeeee',
    300: '#e0e0e0',
    400: '#bdbdbd',
    500: '#9e9e9e',
    600: '#757575',
    700: '#616161',
    800: '#424242',
    900: '#212121',
  },
  background: {
    default: '#f5f5f5',
    paper: '#ffffff',
  },
  text: {
    primary: 'rgba(0, 0, 0, 0.87)',
    secondary: 'rgba(0, 0, 0, 0.6)',
    disabled: 'rgba(0, 0, 0, 0.38)',
  },
};

/**
 * Типографика приложения
 */
const typography = {
  fontFamily: [
    'Roboto',
    'Arial',
    'sans-serif',
  ].join(','),
  h1: {
    fontWeight: 500,
    fontSize: '2.5rem',
    lineHeight: 1.2,
  },
  h2: {
    fontWeight: 500,
    fontSize: '2rem',
    lineHeight: 1.3,
  },
  h3: {
    fontWeight: 500,
    fontSize: '1.75rem',
    lineHeight: 1.3,
  },
  h4: {
    fontWeight: 500,
    fontSize: '1.5rem',
    lineHeight: 1.4,
  },
  h5: {
    fontWeight: 500,
    fontSize: '1.25rem',
    lineHeight: 1.4,
  },
  h6: {
    fontWeight: 500,
    fontSize: '1.125rem',
    lineHeight: 1.5,
  },
  subtitle1: {
    fontSize: '1rem',
    lineHeight: 1.5,
    fontWeight: 400,
  },
  subtitle2: {
    fontSize: '0.875rem',
    lineHeight: 1.5,
    fontWeight: 500,
  },
  body1: {
    fontSize: '1rem',
    lineHeight: 1.5,
  },
  body2: {
    fontSize: '0.875rem',
    lineHeight: 1.5,
  },
  button: {
    textTransform: 'none',
    fontWeight: 500,
    fontSize: '0.875rem',
  },
  caption: {
    fontSize: '0.75rem',
    lineHeight: 1.5,
  },
  overline: {
    fontSize: '0.75rem',
    textTransform: 'uppercase',
    fontWeight: 500,
    letterSpacing: '0.08em',
  },
};

/**
 * Настройки форм компонентов
 */
const components = {
  MuiButton: {
    styleOverrides: {
      root: {
        borderRadius: 8,
        padding: '8px 16px',
      },
      containedPrimary: {
        '&:hover': {
          backgroundColor: palette.primary.dark,
        },
      },
      containedSecondary: {
        '&:hover': {
          backgroundColor: palette.secondary.dark,
        },
      },
    },
  },
  MuiCard: {
    styleOverrides: {
      root: {
        borderRadius: 12,
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
      },
    },
  },
  MuiCardContent: {
    styleOverrides: {
      root: {
        padding: 24,
        '&:last-child': {
          paddingBottom: 24,
        },
      },
    },
  },
  MuiPaper: {
    styleOverrides: {
      root: {
        borderRadius: 12,
      },
    },
  },
  MuiDialog: {
    styleOverrides: {
      paper: {
        borderRadius: 12,
        boxShadow: '0 24px 48px rgba(0,0,0,0.10)',
      },
    },
  },
  MuiTableCell: {
    styleOverrides: {
      root: {
        padding: '16px 24px',
      },
      head: {
        fontWeight: 600,
        backgroundColor: palette.grey[50],
      },
    },
  },
  MuiChip: {
    styleOverrides: {
      root: {
        fontSize: '0.875rem',
        fontWeight: 500,
        borderRadius: 16,
      },
    },
  },
  MuiLinearProgress: {
    styleOverrides: {
      root: {
        borderRadius: 4,
        height: 6,
      },
    },
  },
  MuiOutlinedInput: {
    styleOverrides: {
      root: {
        borderRadius: 8,
      },
    },
  },
};

/**
 * Создание и экспорт темы
 */
export const theme = createTheme({
  palette,
  typography,
  components,
  shape: {
    borderRadius: 8,
  },
  shadows: [
    'none',
    '0 2px 4px rgba(0,0,0,0.05)',
    '0 4px 8px rgba(0,0,0,0.05)',
    '0 6px 12px rgba(0,0,0,0.05)',
    '0 8px 16px rgba(0,0,0,0.05)',
    '0 12px 24px rgba(0,0,0,0.05)',
    '0 16px 32px rgba(0,0,0,0.05)',
    '0 20px 40px rgba(0,0,0,0.05)',
    '0 24px 48px rgba(0,0,0,0.05)',
    '0 28px 56px rgba(0,0,0,0.05)',
    '0 32px 64px rgba(0,0,0,0.05)',
    '0 36px 72px rgba(0,0,0,0.05)',
    '0 40px 80px rgba(0,0,0,0.05)',
    '0 44px 88px rgba(0,0,0,0.05)',
    '0 48px 96px rgba(0,0,0,0.05)',
    '0 52px 104px rgba(0,0,0,0.05)',
    '0 56px 112px rgba(0,0,0,0.05)',
    '0 60px 120px rgba(0,0,0,0.05)',
    '0 64px 128px rgba(0,0,0,0.05)',
    '0 68px 136px rgba(0,0,0,0.05)',
    '0 72px 144px rgba(0,0,0,0.05)',
    '0 76px 152px rgba(0,0,0,0.05)',
    '0 80px 160px rgba(0,0,0,0.05)',
    '0 84px 168px rgba(0,0,0,0.05)',
    '0 88px 176px rgba(0,0,0,0.08)',
  ],
}); 