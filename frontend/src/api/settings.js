import { ApiClient } from './ApiClient';

const apiClient = new ApiClient('/settings', 'настройка');

/**
 * Получение всех настроек
 * @returns {Promise<Object>} Объект с настройками
 */
export const getSettings = () => {
  return apiClient.get('');
};

/**
 * Обновление настроек для указанного раздела
 * @param {string} section - Раздел настроек
 * @param {Object} settings - Объект с настройками
 * @returns {Promise<Object>} Результат операции
 */
export const updateSettings = (section, settings) => {
  return apiClient.put('', { section, settings });
};

/**
 * Получение списка пользователей для настроек
 * @returns {Promise<Array>} Массив пользователей
 */
export const getUsers = () => {
  return apiClient.get('/users');
};

/**
 * Обновление статуса пользователя
 * @param {number} userId - ID пользователя
 * @param {string} status - Новый статус ('active' или 'inactive')
 * @param {string} userType - Тип пользователя ('employee' или 'client')
 * @returns {Promise<Object>} Результат операции
 */
export const updateUserStatus = (userId, status, userType) => {
  return apiClient.put(`/users/${userId}/status`, { status, userType });
};

/**
 * Обновление роли пользователя
 * @param {number} userId - ID пользователя
 * @param {string} role - Новая роль ('admin', 'manager' или 'employee')
 * @param {string} userType - Тип пользователя (должен быть 'employee')
 * @returns {Promise<Object>} Результат операции
 */
export const updateUserRole = (userId, role, userType) => {
  return apiClient.put(`/users/${userId}/role`, { role, userType });
};

/**
 * Удаление пользователя из базы данных
 * @param {number} userId - ID пользователя
 * @param {string} userType - Тип пользователя ('employee' или 'client')
 * @returns {Promise<Object>} Результат операции
 */
export const deleteUser = (userId, userType) => {
  return apiClient.api.delete(`${apiClient.basePath}/users/${userId}?userType=${userType}`);
};

/**
 * Создание резервной копии (моковый метод)
 * @returns {Promise<Object>} Результат операции
 */
export const createBackup = () => {
  // Имитация задержки и успешного результата
  return new Promise(resolve => {
    setTimeout(() => {
      resolve({
        success: true,
        message: 'Резервная копия успешно создана',
        timestamp: new Date().toISOString()
      });
    }, 1500);
  });
};

const settingsApi = {
  getSettings,
  updateSettings,
  getUsers,
  updateUserStatus,
  updateUserRole,
  deleteUser,
  createBackup
};

export default settingsApi; 