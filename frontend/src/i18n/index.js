import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { ru } from './locales/ru';
import { en } from './locales/en';

// Настройка i18next
i18n
  // Определение языка браузера
  .use(LanguageDetector)
  // Интеграция с React
  .use(initReactI18next)
  // Инициализация i18next
  .init({
    // Ресурсы перевода
    resources: {
      ru: {
        translation: ru
      },
      en: {
        translation: en
      }
    },
    // Язык по умолчанию
    fallbackLng: 'ru',
    // Определение языка из localStorage или браузера
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: 'language',
    },
    // Не логировать ошибки missing translation
    saveMissing: false,
    // Интерполяция
    interpolation: {
      escapeValue: false, // не экранировать HTML в React
    },
  });

export default i18n; 