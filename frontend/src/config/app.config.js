/**
 * Общие настройки для фронтенд-приложения
 */

// API URL
export const API_URL = '/api';

// React Query настройки
export const QUERY_CONFIG = {
  // Базовые настройки для всех запросов
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false, // Отключаем повторный запрос при фокусе окна
      refetchOnMount: false, // Отключаем повторный запрос при монтировании
      retry: 1, // Ограничиваем количество повторных попыток
      staleTime: 5 * 60 * 1000, // 5 минут - считаем данные свежими
      cacheTime: 10 * 60 * 1000 // 10 минут - храним данные в кэше
    }
  }
};

// Настройки формата дат
export const DATE_FORMAT = {
  fullDate: 'dd.MM.yyyy', // 31.12.2023
  dateTime: 'dd.MM.yyyy HH:mm', // 31.12.2023 12:30
  time: 'HH:mm', // 12:30
  dayMonth: 'dd MMMM', // 31 декабря
  monthYear: 'MMMM yyyy' // Декабрь 2023
};

// Настройки форматирования
export const FORMATTING = {
  currency: 'RUB', // Валюта для форматирования цен
  currencyOptions: { 
    style: 'currency', 
    currency: 'RUB',
    minimumFractionDigits: 0
  }
};

// Настройки для пагинации
export const PAGINATION = {
  defaultPageSize: 10,
  pageSizeOptions: [5, 10, 20, 50, 100]
};

// Настройки файлов и изображений
export const FILE_CONFIG = {
  maxFileSize: 5 * 1024 * 1024, // 5 MB
  supportedImageTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  defaultImageUrl: '/images/placeholder.jpg'
};

// Константы приложения
export const APP_CONSTANTS = {
  APP_NAME: 'Салон красоты - Система управления',
  COMPANY_NAME: 'Beauty Salon',
  COPYRIGHT_YEAR: new Date().getFullYear(),
  SUPPORT_EMAIL: 'support@example.com',
  SUPPORT_PHONE: '+7 (999) 123-45-67'
};

// Настройки уведомлений
export const NOTIFICATION_CONFIG = {
  defaultDuration: 5000, // 5 секунд для уведомлений
  maxVisibleNotifications: 3 // Максимальное число видимых уведомлений
};

// Настройки ролей пользователей
export const USER_ROLES = {
  ADMIN: 'admin',
  EMPLOYEE: 'employee',
  CLIENT: 'client'
};

// Статусы записей
export const APPOINTMENT_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
};

// Категории услуг
export const SERVICE_CATEGORIES = [
  'Волосы',
  'Ногти',
  'Макияж',
  'Массаж',
  'СПА',
  'Эпиляция',
  'Другое'
];

// Экспортируем все настройки по умолчанию
export default {
  API_URL,
  QUERY_CONFIG,
  DATE_FORMAT,
  FORMATTING,
  PAGINATION,
  FILE_CONFIG,
  APP_CONSTANTS,
  NOTIFICATION_CONFIG,
  USER_ROLES,
  APPOINTMENT_STATUS,
  SERVICE_CATEGORIES
}; 