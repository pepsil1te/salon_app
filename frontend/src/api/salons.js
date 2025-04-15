import { ApiClient } from './ApiClient';

/**
 * API-клиент для работы с салонами
 */
class SalonsApi extends ApiClient {
  constructor() {
    super('/salons', 'салон');
  }

  /**
   * Создание нового салона
   * @param {Object} data Данные салона
   * @returns {Promise<Object>} Созданный салон
   */
  async create(data) {
    console.log('SalonsApi.create: Запрос на создание салона с данными:', JSON.stringify(data, null, 2));
    try {
      const result = await super.create(data);
      console.log('SalonsApi.create: Салон успешно создан:', JSON.stringify(result, null, 2));
      return result;
    } catch (error) {
      console.error('SalonsApi.create: Ошибка при создании салона:', error);
      if (error.response) {
        console.error('SalonsApi.create: Детали ошибки от сервера:', {
          status: error.response.status,
          data: error.response.data,
          headers: error.response.headers
        });
      }
      throw error;
    }
  }

  /**
   * Обновление салона
   * @param {number} id ID салона
   * @param {Object} data Данные для обновления
   * @returns {Promise<Object>} Обновленный салон
   */
  async update(id, data) {
    console.log('Обновление салона #' + id + ' с данными:', JSON.stringify(data, null, 2));
    return super.update(id, data);
  }

  /**
   * Удаление салона
   * @param {number} id ID салона
   * @returns {Promise<Object>} Ответ сервера
   */
  async remove(id) {
    console.log('Удаление салона #' + id);
    return super.remove(id);
  }

  /**
   * Получение статистики по салону
   * @param {number} id ID салона
   * @param {Object} params Параметры запроса
   * @returns {Promise<Object>} Статистика салона
   */
  async getStatistics(id, params = {}) {
    try {
      console.log(`Запрос статистики салона #${id} с параметрами:`, params);
      const response = await this.api.get(`${this.endpoint}/${id}/statistics`, { params });
      console.log(`Получена статистика салона #${id}:`, response.data);
      return response.data;
    } catch (error) {
      console.error(`Ошибка получения статистики салона #${id}:`, error);
      throw error;
    }
  }

  /**
   * Получение списка салонов с загруженными расписаниями
   * @returns {Promise<Array>} Список салонов с расписаниями
   */
  async getAllWithSchedules() {
    return this.getAll({}, true);
  }
}

// Экспортируем экземпляр API для салонов как именованный экспорт
export const salonApi = new SalonsApi(); 