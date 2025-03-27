import api from './client';

export const authApi = {
  // Initialize Telegram Web App
  initTelegram: async (initData) => {
    const response = await api.post('/auth/init', initData);
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
    }
    return response.data;
  },

  // Phone login
  phoneLogin: async (phoneNumber) => {
    try {
      console.log('Отправка запроса на вход с номером:', phoneNumber);
      const response = await api.post('/auth/phone-login', { phoneNumber });
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
      }
      return response.data;
    } catch (error) {
      console.error('Ошибка при входе по телефону:', error);
      
      // Если есть детальная информация об ошибке в ответе сервера
      if (error.response && error.response.data) {
        console.error('Детали ошибки:', error.response.data);
      }
      
      // Если ошибка 404, пользователь не найден, возвращаем информацию для регистрации
      if (error.response && error.response.status === 404) {
        return { exists: false, message: 'Пользователь не найден' };
      }
      
      // Для других ошибок прокидываем более информативное сообщение
      throw new Error(
        error.response && error.response.data && error.response.data.error 
          ? error.response.data.error 
          : `Ошибка при входе: ${error.message}`
      );
    }
  },

  // Register new user
  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
    }
    return response.data;
  },

  // Get current user profile
  getProfile: async () => {
    const response = await api.get('/auth/profile');
    return response.data;
  },

  // Update user profile
  updateProfile: async (data) => {
    const response = await api.put('/auth/profile', data);
    return response.data;
  },

  // Logout
  logout: () => {
    localStorage.removeItem('token');
    window.location.href = '/';
  },
}; 