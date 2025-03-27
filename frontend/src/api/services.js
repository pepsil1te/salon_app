import { ApiClient } from './ApiClient';

// API-клиент для работы с услугами
class ServiceApiClient extends ApiClient {
  constructor() {
    super('/services', 'услуга');
  }

  /**
   * Получение всех услуг для салона
   * @param {number} salonId ID салона
   * @returns {Promise<Array>} Массив услуг
   */
  async getBySalon(salonId) {
    try {
      console.log(`🔍 Запрос услуг для салона #${salonId}`);
      
      const response = await this.api.get(`${this.basePath}/salon/${salonId}`);
      
      console.log(`✅ Получены услуги для салона #${salonId}:`, response.data.length, 'записей');
      return response.data;
    } catch (error) {
      console.error(`❌ Ошибка при получении услуг для салона #${salonId}:`, error);
      throw error;
    }
  }

  /**
   * Получение доступных временных слотов для услуги
   * @param {number} id ID услуги
   * @param {number} employeeId ID сотрудника
   * @param {string} date Дата (YYYY-MM-DD)
   * @returns {Promise<Array>} Массив доступных слотов
   */
  async getAvailability(id, employeeId, date) {
    try {
      console.log(`🔍 Запрос доступных слотов для услуги #${id}, сотрудника #${employeeId} на ${date}`);
      
      const response = await this.api.get(`${this.basePath}/${id}/availability`, {
        params: { employee_id: employeeId, date },
      });
      
      console.log(`✅ Получены доступные слоты для услуги #${id}:`, response.data.length, 'слотов');
      return response.data;
    } catch (error) {
      console.error(`❌ Ошибка при получении доступных слотов:`, error);
      throw error;
    }
  }
}

export const serviceApi = new ServiceApiClient(); 