import api from './client';

export const userApi = {
  // Получение профиля пользователя
  getProfile: async () => {
    const response = await api.get('/users/profile');
    return response.data;
  },

  // Обновление профиля пользователя
  updateProfile: async (profileData) => {
    const response = await api.put('/users/profile', profileData);
    return response.data;
  },
  
  // Изменение пароля (если есть)
  changePassword: async (passwordData) => {
    const response = await api.put('/users/change-password', passwordData);
    return response.data;
  },
  
  // Обновление настроек уведомлений
  updateNotificationSettings: async (settings) => {
    const response = await api.put('/users/notifications/settings', settings);
    return response.data;
  },
  
  // Получение настроек уведомлений
  getNotificationSettings: async () => {
    const response = await api.get('/users/notifications/settings');
    return response.data;
  },
  
  // Получение статистики клиента
  getClientStats: async () => {
    const response = await api.get('/users/client/stats');
    return response.data;
  }
}; 