import React, { createContext, useState, useEffect, useContext } from 'react';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { ruRU, enUS } from '@mui/material/locale';
import { theme as baseTheme } from '../theme';

// Создаем контекст
export const ThemeLanguageContext = createContext({
  theme: 'light',
  language: 'ru',
  setTheme: () => {},
  setLanguage: () => {},
});

// Хук для использования контекста
export const useThemeLanguage = () => useContext(ThemeLanguageContext);

// Провайдер для темы и языка
export const ThemeLanguageProvider = ({ children }) => {
  // Получаем сохраненные настройки из localStorage, или устанавливаем значения по умолчанию
  const [themeMode, setThemeMode] = useState(localStorage.getItem('theme') || 'light');
  const [language, setLanguage] = useState(localStorage.getItem('language') || 'ru');

  // Создаем объединенную тему MUI с учетом выбранной темы и языка
  const theme = React.useMemo(() => {
    // Создаем объект темы на основе текущего режима
    const updatedTheme = createTheme(
      {
        ...baseTheme,
        palette: {
          ...baseTheme.palette,
          mode: themeMode === 'dark' ? 'dark' : 'light',
          background: {
            default: themeMode === 'dark' ? '#121212' : '#f5f5f5',
            paper: themeMode === 'dark' ? '#1e1e1e' : '#ffffff',
          },
          text: {
            primary: themeMode === 'dark' ? '#ffffff' : 'rgba(0, 0, 0, 0.87)',
            secondary: themeMode === 'dark' ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)',
          },
        },
      },
      // Добавляем локализацию на основе выбранного языка
      language === 'ru' ? ruRU : enUS
    );

    return updatedTheme;
  }, [themeMode, language]);

  // Функция для изменения темы
  const changeTheme = (newTheme) => {
    setThemeMode(newTheme);
    localStorage.setItem('theme', newTheme);
    
    // Устанавливаем атрибуты на корневом элементе
    document.documentElement.setAttribute('data-theme', newTheme);
    document.documentElement.classList.remove('light-theme', 'dark-theme');
    document.documentElement.classList.add(`${newTheme}-theme`);
    
    // Обновляем мета-тег для темы
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', newTheme === 'dark' ? '#121212' : '#ffffff');
    }
  };

  // Функция для изменения языка
  const changeLanguage = (newLanguage) => {
    setLanguage(newLanguage);
    localStorage.setItem('language', newLanguage);
    document.documentElement.setAttribute('lang', newLanguage);
  };

  // Применяем тему и язык при монтировании
  useEffect(() => {
    changeTheme(themeMode);
    document.documentElement.setAttribute('lang', language);
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