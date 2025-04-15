import { ApiClient } from './ApiClient';

/**
 * Класс для работы с API статистики
 */
class StatisticsApi extends ApiClient {
  constructor() {
    super('/statistics', 'статистика');
  }

  /**
   * Получить общую статистику для дашборда (только для админа)
   * @param {Object} params - Параметры запроса
   * @param {string} params.startDate - Начальная дата (YYYY-MM-DD)
   * @param {string} params.endDate - Конечная дата (YYYY-MM-DD)
   * @returns {Promise<Object>} - Данные статистики
   */
  async getDashboard(params = {}) {
    const response = await this.api.get(`${this.basePath}/dashboard`, { params });
    return response.data;
  }

  /**
   * Получить статистику по салону
   * @param {number} salonId - ID салона
   * @param {Object} params - Параметры запроса
   * @param {string} params.startDate - Начальная дата (YYYY-MM-DD)
   * @param {string} params.endDate - Конечная дата (YYYY-MM-DD)
   * @returns {Promise<Object>} - Данные статистики салона
   */
  async getSalonStatistics(salonId, params = {}) {
    const response = await this.api.get(`${this.basePath}/salon/${salonId}`, { params });
    return response.data;
  }

  /**
   * Получить статистику по сотрудникам
   * @param {Object} params - Параметры запроса
   * @param {number} params.salonId - ID салона (опционально)
   * @param {string} params.startDate - Начальная дата (YYYY-MM-DD)
   * @param {string} params.endDate - Конечная дата (YYYY-MM-DD)
   * @returns {Promise<Array>} - Список статистики по сотрудникам
   */
  async getEmployeeStatistics(params = {}) {
    const response = await this.api.get(`${this.basePath}/employees`, { params });
    return response.data;
  }

  /**
   * Получить статистику по услугам
   * @param {Object} params - Параметры запроса
   * @param {number} params.salonId - ID салона (опционально)
   * @param {string} params.categoryFilter - Фильтр по категории (опционально)
   * @param {string} params.startDate - Начальная дата (YYYY-MM-DD)
   * @param {string} params.endDate - Конечная дата (YYYY-MM-DD)
   * @returns {Promise<Object>} - Данные статистики услуг
   */
  async getServiceStatistics(params = {}) {
    const response = await this.api.get(`${this.basePath}/services`, { params });
    return response.data;
  }

  /**
   * Получить финансовую статистику
   * @param {Object} params - Параметры запроса
   * @param {number} params.salonId - ID салона (опционально)
   * @param {string} params.startDate - Начальная дата (YYYY-MM-DD)
   * @param {string} params.endDate - Конечная дата (YYYY-MM-DD)
   * @returns {Promise<Object>} - Финансовая статистика
   */
  async getFinancialStatistics(params = {}) {
    const response = await this.api.get(`${this.basePath}/financial`, { params });
    return response.data;
  }

  /**
   * Получить расписание сотрудников
   * @param {Object} params - Параметры запроса
   * @param {number} params.salonId - ID салона (опционально)
   * @param {string} params.startDate - Начальная дата (YYYY-MM-DD)
   * @param {string} params.endDate - Конечная дата (YYYY-MM-DD)
   * @returns {Promise<Array>} - Список расписаний сотрудников
   */
  async getEmployeeSchedules(params = {}) {
    try {
      const response = await this.api.get(`${this.basePath}/employee-schedules`, { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching employee schedules:', error);
      throw error;
    }
  }

  /**
   * Получить данные о заработке сотрудников
   * @param {Object} params - Параметры запроса
   * @param {number} params.salonId - ID салона (опционально)
   * @param {string} params.startDate - Начальная дата (YYYY-MM-DD)
   * @param {string} params.endDate - Конечная дата (YYYY-MM-DD)
   * @returns {Promise<Array>} - Список заработка сотрудников
   */
  async getEmployeeEarnings(params = {}) {
    try {
      const response = await this.api.get(`${this.basePath}/employee-earnings`, { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching employee earnings:', error);
      throw error;
    }
  }

  /**
   * Отметить сотрудника о приходе на работу
   * @param {Object} data - Данные для отметки
   * @param {number} data.employeeId - ID сотрудника
   * @param {string} data.date - Дата (YYYY-MM-DD)
   * @param {string} data.checkinTime - Время прихода (опционально, ISO формат)
   * @returns {Promise<Object>} - Результат операции
   */
  async checkInEmployee(data) {
    try {
      const response = await this.api.post(`${this.basePath}/employee-checkin`, data);
      return response.data;
    } catch (error) {
      console.error('Error checking in employee:', error);
      throw error;
    }
  }
}

export const statisticsApi = new StatisticsApi(); 