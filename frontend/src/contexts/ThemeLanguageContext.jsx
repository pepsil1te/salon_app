import React, { createContext, useState, useEffect, useContext } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import { ruRU, enUS } from '@mui/material/locale';
import { createAppTheme } from '../theme';
import i18n from '../i18n';
import settingsApi from '../api/settings';

// Создаем контекст
export const ThemeLanguageContext = createContext({
  theme: 'light',
  language: 'ru',
  setTheme: () => {},
  setLanguage: () => {},
  appearanceSettings: {},
  updateAppearanceSettings: () => {},
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

  // Состояние для хранения настроек внешнего вида
  const [appearanceSettings, setAppearanceSettings] = useState({
    theme: themeMode,
    primaryColor: '#00838f',
    secondaryColor: '#ff6f00',
    enableAnimations: true,
    enableBlur: true,
    roundedCorners: true,
    density: 'standard',
    showIcons: true,
    showLabels: true,
    showLogo: true
  });

  // Загрузка настроек при инициализации
  useEffect(() => {
    // Функция для получения настроек с сервера
    const fetchSettings = async () => {
      try {
        const response = await settingsApi.getSettings();
        
        if (response && response.appearance) {
          // Обновляем настройки внешнего вида
          setAppearanceSettings(prevSettings => ({
            ...prevSettings,
            ...response.appearance
          }));
          
          // Обновляем тему, если она указана в настройках
          if (response.appearance.theme) {
            setThemeMode(response.appearance.theme);
          }
        }
        
        // Обновляем язык, если он указан в настройках
        if (response && response.general && response.general.defaultLanguage) {
          setLanguage(response.general.defaultLanguage);
        }
      } catch (error) {
        console.error('Ошибка при загрузке настроек:', error);
      }
    };
    
    fetchSettings();
  }, []);

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
    
    // Обновляем настройки внешнего вида с новой темой
    setAppearanceSettings(prev => ({
      ...prev,
      theme: themeMode
    }));
  }, [themeMode]);

  // Функция для обновления настроек внешнего вида
  const updateAppearanceSettings = async (newSettings) => {
    try {
      // Создаем копию настроек, чтобы не изменять оригинал
      const updatedSettings = {
        ...appearanceSettings,
        ...newSettings
      };
      
      // Определяем персональные настройки, которые не сохраняются в базе
      const personalSettings = {
        theme: updatedSettings.theme
      };
      
      // Глобальные настройки - все кроме персональных
      const globalSettings = { ...updatedSettings };
      delete globalSettings.theme;
      
      // Применяем настройки локально (все)
      setAppearanceSettings(updatedSettings);
      
      // Если тема изменилась, применяем её локально
      if (newSettings.theme && newSettings.theme !== themeMode) {
        setThemeMode(newSettings.theme);
        
        // Тему также сохраняем в localStorage
        localStorage.setItem('theme', newSettings.theme);
      }
      
      // Сохраняем только глобальные настройки на сервере
      if (Object.keys(globalSettings).length > 0) {
        console.log('Сохранение глобальных настроек на сервере:', globalSettings);
        
        // Используем метод upsert для избежания ошибок с дубликатами ключей
        const response = await settingsApi.updateSettings('appearance', globalSettings);
        console.log('Ответ сервера:', response);
        
        return true;
      }
      
      return true;
    } catch (error) {
      console.error('Ошибка при обновлении настроек внешнего вида:', error);
      return false;
    }
  };

  // Создаем объединенную тему MUI с учетом выбранных настроек
  const theme = React.useMemo(() => {
    // Включаем настройки текущей темы в общие настройки внешнего вида
    const themeWithModeSettings = {
      ...appearanceSettings,
      palette: {
        mode: computedTheme
      }
    };
    
    console.log('Applying theme mode:', computedTheme, 'with settings:', themeWithModeSettings);
    
    // Создаем объект темы на основе текущих настроек внешнего вида
    const baseTheme = createAppTheme(themeWithModeSettings);
    
    // Добавляем локализацию
    return {
      ...baseTheme,
      ...(language === 'ru' ? ruRU : enUS)
    };
  }, [computedTheme, language, appearanceSettings]);

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
    
    // Синхронизируем с настройками внешнего вида
    updateAppearanceSettings({ theme: newTheme });
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
    
    // Синхронизируем с настройками на сервере
    settingsApi.updateSettings('general', { defaultLanguage: newLanguage })
      .catch(err => console.error('Ошибка при сохранении языка:', err));
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
    appearanceSettings,
    updateAppearanceSettings
  };

  return (
    <ThemeLanguageContext.Provider value={contextValue}>
      <ThemeProvider theme={theme}>
        {children}
      </ThemeProvider>
    </ThemeLanguageContext.Provider>
  );
}; 