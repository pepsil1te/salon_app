import api from './client';

export const favoritesApi = {
  // Получение всех избранных салонов пользователя
  getFavoriteSalons: async () => {
    const response = await api.get('/favorites/salons');
    return response.data;
  },

  // Добавление салона в избранное
  addSalonToFavorites: async (salonId) => {
    const response = await api.post('/favorites/salons', { salonId });
    return response.data;
  },

  // Удаление салона из избранного
  removeSalonFromFavorites: async (salonId) => {
    const response = await api.delete(`/favorites/salons/${salonId}`);
    return response.data;
  },
  
  // Проверка, находится ли салон в избранном
  checkIfSalonIsFavorite: async (salonId) => {
    const response = await api.get(`/favorites/salons/check/${salonId}`);
    return response.data.isFavorite;
  },
  
  // Получение избранных мастеров
  getFavoriteEmployees: async () => {
    const response = await api.get('/favorites/employees');
    return response.data;
  },
  
  // Добавление мастера в избранное
  addEmployeeToFavorites: async (employeeId) => {
    const response = await api.post('/favorites/employees', { employeeId });
    return response.data;
  },
  
  // Удаление мастера из избранного
  removeEmployeeFromFavorites: async (employeeId) => {
    const response = await api.delete(`/favorites/employees/${employeeId}`);
    return response.data;
  }
}; 