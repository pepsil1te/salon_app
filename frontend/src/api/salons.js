import { ApiClient } from './ApiClient';

// API-клиент для работы с салонами
class SalonApiClient extends ApiClient {
  constructor() {
    super('/salons', 'салон');
  }

  /**
   * Получение статистики салона
   * @param {number} id ID салона
   * @param {string} startDate Дата начала (YYYY-MM-DD)
   * @param {string} endDate Дата окончания (YYYY-MM-DD)
   * @returns {Promise<Object>} Объект со статистикой
   */
  async getStatistics(id, startDate, endDate) {
    try {
      console.log(`🔍 Запрос статистики для салона #${id} (${startDate} - ${endDate})`);
      
      const response = await this.api.get(`${this.basePath}/${id}/statistics`, {
        params: { startDate, endDate },
      });
      
      console.log(`✅ Получена статистика для салона #${id}:`, response.data);
      return response.data;
    } catch (error) {
      console.error(`❌ Ошибка при получении статистики для салона #${id}:`, error);
      console.error('Детали ошибки:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Принудительное обновление данных салонов
   * @returns {Promise<Array>} Массив обновленных объектов салонов
   */
  async forceRefresh() {
    return this.getAll({}, true);
  }
}

export const salonApi = new SalonApiClient(); 