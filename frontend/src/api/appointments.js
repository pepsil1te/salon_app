import api from './client';
import { format, addDays } from 'date-fns';

/**
 * API сервис для управления записями на услуги
 */
export const appointmentApi = {
  /**
   * Получить все записи
   * @returns {Promise<Array>} Список записей
   */
  getAll: async () => {
    const { data } = await api.get('/appointments');
    return data;
  },

  /**
   * Получить запись по ID
   * @param {number} id ID записи
   * @returns {Promise<Object>} Информация о записи
   */
  getById: async (id) => {
    const { data } = await api.get(`/appointments/${id}`);
    return data;
  },

  /**
   * Получить записи пользователя
   * @param {number} userId ID пользователя
   * @returns {Promise<Array>} Список записей пользователя
   */
  getUserAppointments: async (userId) => {
    const { data } = await api.get(`/users/${userId}/appointments`);
    return data;
  },

  /**
   * Получить записи сотрудника
   * @param {number} employeeId ID сотрудника
   * @param {string} date Дата в формате YYYY-MM-DD (опционально)
   * @returns {Promise<Array>} Список записей сотрудника
   */
  getEmployeeAppointments: async (employeeId, date) => {
    const params = date ? { date } : {};
    const { data } = await api.get(`/employees/${employeeId}/appointments`, { params });
    return data;
  },

  /**
   * Получить записи салона
   * @param {number} salonId ID салона
   * @param {string} date Дата в формате YYYY-MM-DD (опционально)
   * @returns {Promise<Array>} Список записей салона
   */
  getSalonAppointments: async (salonId, date) => {
    const params = date ? { date } : {};
    const { data } = await api.get(`/salons/${salonId}/appointments`, { params });
    return data;
  },

  /**
   * Создать новую запись
   * @param {Object} appointmentData Данные для создания записи
   * @returns {Promise<Object>} Созданная запись
   */
  create: async (appointmentData) => {
    const { data } = await api.post('/appointments', appointmentData);
    return data;
  },

  /**
   * Обновить запись
   * @param {number} id ID записи
   * @param {Object} appointmentData Данные для обновления записи
   * @returns {Promise<Object>} Обновленная запись
   */
  update: async (id, appointmentData) => {
    const { data } = await api.put(`/appointments/${id}`, appointmentData);
    return data;
  },

  /**
   * Изменить статус записи
   * @param {number} id ID записи
   * @param {string} status Новый статус (completed, cancelled, pending)
   * @returns {Promise<Object>} Обновленная запись
   */
  updateStatus: async (id, status) => {
    const { data } = await api.patch(`/appointments/${id}/status`, { status });
    return data;
  },

  /**
   * Отменить запись
   * @param {number} id ID записи
   * @param {string} reason Причина отмены
   * @returns {Promise<Object>} Обновленная запись
   */
  cancel: async (id, reason = '') => {
    const { data } = await api.post(`/appointments/${id}/cancel`, { reason });
    return data;
  },

  /**
   * Добавить отзыв к записи
   * @param {number} id ID записи
   * @param {Object} reviewData Данные отзыва
   * @param {number} reviewData.rating Оценка (1-5)
   * @param {string} reviewData.comment Комментарий
   * @returns {Promise<Object>} Обновленная запись
   */
  addReview: async (id, reviewData) => {
    const { data } = await api.post(`/appointments/${id}/review`, reviewData);
    return data;
  },

  /**
   * Удалить запись
   * @param {number} id ID записи
   * @returns {Promise<void>}
   */
  delete: async (id) => {
    await api.delete(`/appointments/${id}`);
  },

  /**
   * Получить предстоящие записи
   * @returns {Promise<Array>} Список предстоящих записей
   */
  getUpcoming: async () => {
    const response = await api.get('/appointments/upcoming');
    return response.data;
  },

  /**
   * Получить прошедшие записи
   * @returns {Promise<Array>} Список прошедших записей
   */
  getPast: async () => {
    const response = await api.get('/appointments/past');
    return response.data;
  }
}; 