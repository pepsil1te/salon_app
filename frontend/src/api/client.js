import axios from 'axios';

// Создаем базовый API-клиент
const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  // Настройки таймаутов для повышения надежности
  timeout: 30000, // 30 секунд таймаут для запросов
});

// Включаем подробную отладку в консоли
const DEBUG = false;

// Добавляем интерсептор для аутентификации
api.interceptors.request.use(
  (config) => {
    // Отладочная информация о запросе
    if (DEBUG) {
      console.log(`🚀 Отправка запроса: ${config.method.toUpperCase()} ${config.baseURL}${config.url}`, {
        params: config.params,
        data: config.data,
        headers: config.headers
      });
      
      // Особое внимание к запросам на обновление расписания
      if (config.url.includes('/schedule') && config.method === 'put') {
        console.log('📅 Запрос на обновление расписания:', config.data);
      }
    }
    
    // Добавляем токен в заголовки для авторизации
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Добавляем метку времени для предотвращения кеширования
    if (config.method === 'get') {
      config.params = {
        ...config.params,
        _t: Date.now()
      };
    }
    
    return config;
  },
  (error) => {
    console.error('Ошибка в запросе:', error);
    return Promise.reject(error);
  }
);

// Интерсептор для обработки ответов
api.interceptors.response.use(
  (response) => {
    // Отладочная информация об успешном ответе
    if (DEBUG) {
      console.log(`✅ Ответ получен: ${response.config.method.toUpperCase()} ${response.config.url}`, {
        status: response.status,
        data: response.data
      });
      
      // Особое внимание к ответам на обновление расписания
      if (response.config.url.includes('/schedule') && response.config.method === 'put') {
        console.log('📅 Ответ на обновление расписания:', response.data);
      }
    }
    return response;
  },
  async (error) => {
    // Отладочная информация об ошибке
    if (DEBUG) {
      console.error(`❌ Ошибка запроса: ${error.config?.method?.toUpperCase()} ${error.config?.url}`, {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
      
      // Особое внимание к ошибкам обновления расписания
      if (error.config?.url.includes('/schedule') && error.config?.method === 'put') {
        console.error('📅 Ошибка обновления расписания:', {
          request: error.config?.data ? JSON.parse(error.config.data) : null,
          response: error.response?.data
        });
      }
    }
    
    // Обработка 401 Unauthorized - перенаправление на страницу входа
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // Проверяем, не находимся ли мы уже на странице входа
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    
    // Обработка 503 Service Unavailable - повторные попытки
    if (error.response?.status === 503) {
      const config = error.config;
      
      // Максимальное количество повторов
      config.retryCount = config.retryCount || 0;
      const maxRetries = 3;
      
      if (config.retryCount < maxRetries) {
        config.retryCount++;
        
        // Экспоненциальная задержка с случайным фактором
        const delay = Math.pow(2, config.retryCount) * 1000 + Math.random() * 1000;
        console.warn(`Повторная попытка ${config.retryCount}/${maxRetries} через ${Math.round(delay)}мс...`);
        
        await new Promise(resolve => setTimeout(resolve, delay));
        return api(config);
      }
    }
    
    // Логируем подробности ошибки для отладки
    console.error('API ошибка:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      data: error.response?.data
    });
    
    return Promise.reject(error);
  }
);

// Утилита для добавления параметров кеширования
api.noCacheParams = () => ({
  _t: Date.now(),
  _nocache: true
});

// Утилита для форматирования ошибок API
api.formatError = (error) => {
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  
  if (error.response?.statusText) {
    return `Ошибка: ${error.response.status} ${error.response.statusText}`;
  }
  
  if (error.message) {
    return error.message;
  }
  
  return 'Произошла неизвестная ошибка';
};

export default api; 