import api from './client';

/**
 * API сервис для управления сотрудниками
 */
export const employeeApi = {
  /**
   * Получить всех сотрудников
   * @returns {Promise<Array>} Список сотрудников
   */
  getAll: async () => {
    const { data } = await api.get('/employees');
    return data;
  },

  /**
   * Получить сотрудника по ID
   * @param {number} id ID сотрудника
   * @returns {Promise<Object>} Информация о сотруднике
   */
  getById: async (id) => {
    const { data } = await api.get(`/employees/${id}`);
    return data;
  },

  /**
   * Получить сотрудников салона
   * @param {number} salonId ID салона
   * @returns {Promise<Array>} Список сотрудников салона
   */
  getBySalon: async (salonId) => {
    const { data } = await api.get(`/salons/${salonId}/employees`);
    return data;
  },

  /**
   * Получить сотрудников, предоставляющих определенную услугу
   * @param {number} serviceId ID услуги
   * @returns {Promise<Array>} Список сотрудников
   */
  getByService: async (serviceId) => {
    const { data } = await api.get(`/services/${serviceId}/employees`);
    return data;
  },

  /**
   * Создать нового сотрудника
   * @param {Object} employeeData Данные для создания сотрудника
   * @returns {Promise<Object>} Созданный сотрудник
   */
  create: async (employeeData) => {
    const { data } = await api.post('/employees', employeeData);
    return data;
  },

  /**
   * Обновить сотрудника
   * @param {number} id ID сотрудника
   * @param {Object} employeeData Данные для обновления сотрудника
   * @returns {Promise<Object>} Обновленный сотрудник
   */
  update: async (id, employeeData) => {
    const { data } = await api.put(`/employees/${id}`, employeeData);
    return data;
  },

  /**
   * Удалить сотрудника
   * @param {number} id ID сотрудника
   * @returns {Promise<void>}
   */
  delete: async (id) => {
    await api.delete(`/employees/${id}`);
  },

  /**
   * Получить расписание сотрудника
   * @param {number} id ID сотрудника
   * @param {string} startDate Начальная дата в формате YYYY-MM-DD
   * @param {string} endDate Конечная дата в формате YYYY-MM-DD
   * @returns {Promise<Object>} Расписание сотрудника
   */
  getSchedule: async (id, startDate, endDate) => {
    const { data } = await api.get(`/employees/${id}/schedule`, {
      params: { start_date: startDate, end_date: endDate }
    });
    return data;
  },

  /**
   * Обновить расписание сотрудника
   * @param {number} id ID сотрудника
   * @param {Object} scheduleData Данные расписания
   * @returns {Promise<Object>} Обновленное расписание
   */
  updateSchedule: async (id, scheduleData) => {
    const { data } = await api.put(`/employees/${id}/schedule`, scheduleData);
    return data;
  },

  /**
   * Получить производительность сотрудника
   * @param {number} id ID сотрудника
   * @param {string} startDate Начальная дата в формате YYYY-MM-DD
   * @param {string} endDate Конечная дата в формате YYYY-MM-DD
   * @returns {Promise<Object>} Данные о производительности
   */
  getPerformance: async (id, startDate, endDate) => {
    const { data } = await api.get(`/employees/${id}/performance`, {
      params: { start_date: startDate, end_date: endDate }
    });
    return data;
  },

  /**
   * Связать сотрудника с услугой
   * @param {number} id ID сотрудника
   * @param {number} serviceId ID услуги
   * @returns {Promise<Object>} Результат операции
   */
  assignService: async (id, serviceId) => {
    const { data } = await api.post(`/employees/${id}/services`, { service_id: serviceId });
    return data;
  },

  /**
   * Удалить связь сотрудника с услугой
   * @param {number} id ID сотрудника
   * @param {number} serviceId ID услуги
   * @returns {Promise<void>}
   */
  removeService: async (id, serviceId) => {
    await api.delete(`/employees/${id}/services/${serviceId}`);
  },

  /**
   * Получить услуги, предоставляемые сотрудником
   * @param {number} id ID сотрудника
   * @returns {Promise<Array>} Список услуг
   */
  getServices: async (id) => {
    const { data } = await api.get(`/employees/${id}/services`);
    return data;
  }
}; 