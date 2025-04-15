import { createTheme } from '@mui/material/styles';

/**
 * Цветовая палитра приложения
 */
const defaultPalette = {
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
 * Получает базовый набор компонентов
 * @param {Object} appearanceSettings - настройки внешнего вида из пользовательских настроек
 * @param {Object} palette - текущая палитра цветов
 */
const getComponents = (appearanceSettings = {}, palette) => {
  // Получаем настройки из объекта или используем значения по умолчанию
  const enableAnimations = appearanceSettings.enableAnimations !== false;
  const enableBlur = appearanceSettings.enableBlur !== false;
  const roundedCorners = appearanceSettings.roundedCorners !== false;

  // Базовый радиус закругления в зависимости от настроек
  const baseRadius = roundedCorners ? 12 : 4;

  return {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          transition: enableAnimations 
            ? 'background-color 0.3s ease-in-out, color 0.3s ease-in-out' 
            : 'none',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: baseRadius,
          padding: `8px 16px`,
          transition: enableAnimations 
            ? 'all 0.2s ease-in-out' 
            : 'none',
        },
        containedPrimary: {
          '&:hover': {
            backgroundColor: palette.primary.dark,
            transform: enableAnimations ? 'translateY(-1px)' : 'none',
            boxShadow: enableAnimations ? '0 4px 12px rgba(0,0,0,0.15)' : 'none',
          },
        },
        containedSecondary: {
          '&:hover': {
            backgroundColor: palette.secondary.dark,
            transform: enableAnimations ? 'translateY(-1px)' : 'none',
            boxShadow: enableAnimations ? '0 4px 12px rgba(0,0,0,0.15)' : 'none',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: baseRadius,
          boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
          transition: enableAnimations ? 'all 0.3s ease-in-out' : 'none',
          backdropFilter: enableBlur ? 'blur(8px)' : 'none',
          ...(enableAnimations && {
            '&:hover': {
              boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
              transform: 'translateY(-4px)'
            }
          })
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
          borderRadius: baseRadius,
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: baseRadius,
          boxShadow: '0 24px 48px rgba(0,0,0,0.10)',
          backdropFilter: enableBlur ? 'blur(12px)' : 'none',
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          padding: `16px 24px`,
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
          borderRadius: roundedCorners ? 16 : 4,
          transition: enableAnimations ? 'all 0.2s ease' : 'none',
        },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: {
          borderRadius: baseRadius / 2,
          height: 6,
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: baseRadius,
          transition: enableAnimations ? 'all 0.2s ease' : 'none',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiInputBase-root': {
            borderRadius: baseRadius,
          }
        }
      }
    },
    MuiListItem: {
      styleOverrides: {
        root: {
          transition: enableAnimations ? 'background-color 0.2s ease' : 'none',
          borderRadius: baseRadius / 2,
        }
      }
    },
    MuiSwitch: {
      styleOverrides: {
        root: {
          transition: enableAnimations ? 'all 0.2s ease' : 'none',
        }
      }
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backdropFilter: enableBlur ? 'blur(10px)' : 'none',
          borderRadius: `${baseRadius}px ${baseRadius}px 0 0`,
        }
      }
    },
    MuiBackdrop: {
      styleOverrides: {
        root: {
          backdropFilter: enableBlur ? 'blur(4px)' : 'none'
        }
      }
    }
  };
};

/**
 * Создание и экспорт функции создания темы на основе настроек внешнего вида
 */
export const createAppTheme = (appearanceSettings = {}) => {
  // Создаем персонализированную палитру на основе настроек
  const mode = appearanceSettings.palette?.mode || 'light';
  
  const palette = {
    ...defaultPalette,
    mode: mode, // Явно устанавливаем режим в корне палитры
    primary: {
      ...defaultPalette.primary,
      main: appearanceSettings.primaryColor || defaultPalette.primary.main
    },
    secondary: {
      ...defaultPalette.secondary,
      main: appearanceSettings.secondaryColor || defaultPalette.secondary.main
    },
    background: {
      default: mode === 'dark' ? '#121212' : '#f5f5f5',
      paper: mode === 'dark' ? '#1e1e1e' : '#ffffff',
    },
    text: {
      primary: mode === 'dark' ? '#ffffff' : 'rgba(0, 0, 0, 0.87)',
      secondary: mode === 'dark' ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)',
    }
  };

  // Формируем компоненты на основе настроек внешнего вида
  const components = getComponents(appearanceSettings, palette);

  // Базовый радиус закругления для shape (общее значение)
  const baseRadius = appearanceSettings.roundedCorners !== false ? 8 : 4;

  // Создаем тему на основе настроек
  return createTheme({
    palette,
    typography,
    components,
    shape: {
      borderRadius: baseRadius,
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
    ],
  });
};

// Экспортируем тему по умолчанию (для обратной совместимости)
export const theme = createAppTheme(); 