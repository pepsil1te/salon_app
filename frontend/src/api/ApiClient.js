import api from './client';

/**
 * Базовый класс для всех API-клиентов
 * Предоставляет общие методы для работы с API
 */
export class ApiClient {
  /**
   * Создает новый экземпляр API-клиента
   * @param {string} basePath - Базовый путь для всех запросов (например, `/salons`)
   * @param {string} resourceName - Название ресурса для логирования (например, 'салон')
   */
  constructor(basePath, resourceName) {
    this.basePath = basePath;
    this.resourceName = resourceName || 'ресурс';
    this.api = api;
  }

  /**
   * Получение всех объектов
   * @param {Object} params - Параметры запроса
   * @param {boolean} noCache - Флаг для обхода кеша
   * @returns {Promise<Array>} Массив объектов 
   */
  async getAll(params = {}, noCache = false) {
    try {
      console.log(`🔍 Запрос списка ${this.resourceName}ов`);
      
      const queryParams = noCache ? { ...params, ...api.noCacheParams() } : params;
      const response = await api.get(this.basePath, { params: queryParams });
      
      console.log(`✅ Получены данные ${this.resourceName}ов:`, response.data.length, 'записей');
      return response.data;
    } catch (error) {
      console.error(`❌ Ошибка при получении списка ${this.resourceName}ов:`, error);
      throw error;
    }
  }

  /**
   * Получение объекта по ID
   * @param {number|string} id - ID объекта
   * @param {Object} params - Параметры запроса
   * @returns {Promise<Object>} Объект данных
   */
  async getById(id, params = {}) {
    try {
      console.log(`🔍 Запрос ${this.resourceName}а #${id}`);
      
      const response = await api.get(`${this.basePath}/${id}`, { params });
      
      console.log(`✅ Получены данные ${this.resourceName}а #${id}`);
      return response.data;
    } catch (error) {
      console.error(`❌ Ошибка при получении ${this.resourceName}а #${id}:`, error);
      throw error;
    }
  }

  /**
   * Создание нового объекта
   * @param {Object} data - Данные нового объекта
   * @returns {Promise<Object>} Созданный объект
   */
  async create(data) {
    try {
      console.log(`📝 Создание нового ${this.resourceName}а:`, data);
      
      const response = await api.post(this.basePath, data);
      
      console.log(`✅ ${this.resourceName} успешно создан:`, response.data);
      return response.data;
    } catch (error) {
      console.error(`❌ Ошибка при создании ${this.resourceName}а:`, error);
      console.error('Детали ошибки:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Обновление данных объекта
   * @param {number|string} id - ID объекта
   * @param {Object} data - Новые данные объекта
   * @returns {Promise<Object>} Обновленный объект
   */
  async update(id, data) {
    try {
      console.log(`📝 Обновление ${this.resourceName}а #${id}:`, data);
      
      const response = await api.put(`${this.basePath}/${id}`, data);
      
      console.log(`✅ ${this.resourceName} #${id} успешно обновлен:`, response.data);
      return response.data;
    } catch (error) {
      console.error(`❌ Ошибка при обновлении ${this.resourceName}а #${id}:`, error);
      console.error('Детали ошибки:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Удаление объекта
   * @param {number|string} id - ID объекта
   * @returns {Promise<Object>} Результат операции
   */
  async delete(id) {
    try {
      console.log(`🗑️ Удаление ${this.resourceName}а #${id}`);
      
      const response = await api.delete(`${this.basePath}/${id}`);
      
      console.log(`✅ ${this.resourceName} #${id} успешно удален`);
      return response.data;
    } catch (error) {
      console.error(`❌ Ошибка при удалении ${this.resourceName}а #${id}:`, error);
      console.error('Детали ошибки:', error.response?.data || error.message);
      throw error;
    }
  }
} 