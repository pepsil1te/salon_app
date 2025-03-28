import React, { createContext, useState, useEffect, useContext } from 'react';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { ruRU, enUS } from '@mui/material/locale';
import { theme as baseTheme } from '../theme';
import i18n from '../i18n';

// Создаем контекст
export const ThemeLanguageContext = createContext({
  theme: 'light',
  language: 'ru',
  setTheme: () => {},
  setLanguage: () => {},
});

// Хук для использования контекста
export const useThemeLanguage = () => useContext(ThemeLanguageContext);

// Определение системной темы
const getSystemTheme = () => {
  return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches 
    ? 'dark' 
    : 'light';
};

// Определение языка браузера
const getBrowserLanguage = () => {
  const browserLang = navigator.language || navigator.userLanguage;
  return browserLang.startsWith('ru') ? 'ru' : 'en';
};

// Провайдер для темы и языка
export const ThemeLanguageProvider = ({ children }) => {
  // Получаем сохраненные настройки из localStorage, или используем системные настройки
  const [themeMode, setThemeMode] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    return savedTheme || 'system';
  });
  
  const [language, setLanguage] = useState(() => {
    const savedLanguage = localStorage.getItem('language');
    return savedLanguage || getBrowserLanguage();
  });
  
  // Вычисляем текущую тему с учетом системных настроек
  const [computedTheme, setComputedTheme] = useState(() => {
    return themeMode === 'system' ? getSystemTheme() : themeMode;
  });

  // Реагируем на изменения системной темы
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = () => {
      if (themeMode === 'system') {
        setComputedTheme(getSystemTheme());
      }
    };
    
    mediaQuery.addEventListener('change', handleChange);
    
    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, [themeMode]);
  
  // При изменении themeMode обновляем computedTheme
  useEffect(() => {
    if (themeMode === 'system') {
      setComputedTheme(getSystemTheme());
    } else {
      setComputedTheme(themeMode);
    }
  }, [themeMode]);

  // Создаем объединенную тему MUI с учетом выбранной темы и языка
  const theme = React.useMemo(() => {
    // Создаем объект темы на основе текущего режима
    const updatedTheme = createTheme(
      {
        ...baseTheme,
        palette: {
          ...baseTheme.palette,
          mode: computedTheme === 'dark' ? 'dark' : 'light',
          background: {
            default: computedTheme === 'dark' ? '#121212' : '#f5f5f5',
            paper: computedTheme === 'dark' ? '#1e1e1e' : '#ffffff',
          },
          text: {
            primary: computedTheme === 'dark' ? '#ffffff' : 'rgba(0, 0, 0, 0.87)',
            secondary: computedTheme === 'dark' ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)',
          },
        },
      },
      // Добавляем локализацию на основе выбранного языка
      language === 'ru' ? ruRU : enUS
    );

    return updatedTheme;
  }, [computedTheme, language]);

  // Функция для изменения темы
  const changeTheme = (newTheme) => {
    setThemeMode(newTheme);
    localStorage.setItem('theme', newTheme);
    
    // Применяем тему к корневому элементу
    if (newTheme !== 'system') {
      document.documentElement.setAttribute('data-theme', newTheme);
      document.documentElement.classList.remove('light-theme', 'dark-theme');
      document.documentElement.classList.add(`${newTheme}-theme`);
    } else {
      const systemTheme = getSystemTheme();
      document.documentElement.setAttribute('data-theme', systemTheme);
      document.documentElement.classList.remove('light-theme', 'dark-theme');
      document.documentElement.classList.add(`${systemTheme}-theme`);
    }
    
    // Обновляем мета-тег для темы
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      const colorValue = computedTheme === 'dark' ? '#121212' : '#ffffff';
      metaThemeColor.setAttribute('content', colorValue);
    }
  };

  // Функция для изменения языка
  const changeLanguage = (newLanguage) => {
    setLanguage(newLanguage);
    localStorage.setItem('language', newLanguage);
    document.documentElement.setAttribute('lang', newLanguage);
    
    // Устанавливаем язык для i18next
    i18n.changeLanguage(newLanguage).catch(err => 
      console.error('Ошибка при смене языка:', err)
    );
  };

  // Применяем тему и язык при монтировании
  useEffect(() => {
    const systemTheme = themeMode === 'system' ? getSystemTheme() : themeMode;
    document.documentElement.setAttribute('data-theme', systemTheme);
    document.documentElement.classList.remove('light-theme', 'dark-theme');
    document.documentElement.classList.add(`${systemTheme}-theme`);
    document.documentElement.setAttribute('lang', language);
    
    // Устанавливаем начальный язык для i18next
    i18n.changeLanguage(language).catch(err => 
      console.error('Ошибка при инициализации языка:', err)
    );
  }, []);

  // Значение для контекста
  const contextValue = {
    theme: themeMode,
    language,
    setTheme: changeTheme,
    setLanguage: changeLanguage,
  };

  return (
    <ThemeLanguageContext.Provider value={contextValue}>
      <ThemeProvider theme={theme}>
        {children}
      </ThemeProvider>
    </ThemeLanguageContext.Provider>
  );
}; 