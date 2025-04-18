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
      // console.log(`🔍 Запрос списка ${this.resourceName}ов`);
      
      const queryParams = noCache ? { ...params, ...api.noCacheParams() } : params;
      const response = await api.get(this.basePath, { params: queryParams });
      
      // console.log(`✅ Получены данные ${this.resourceName}ов:`, response.data.length, 'записей');
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
      // console.log(`🔍 Запрос ${this.resourceName}а #${id}`);
      
      const response = await api.get(`${this.basePath}/${id}`, { params });
      
      // console.log(`✅ Получены данные ${this.resourceName}а #${id}`);
      return response.data;
    } catch (error) {
      console.error(`❌ Ошибка при получении ${this.resourceName}а #${id}:`, error);
      throw error;
    }
  }

  /**
   * Выполнение GET-запроса по указанному пути
   * @param {string} path - Относительный путь (добавляется к basePath)
   * @param {Object} params - Параметры запроса
   * @returns {Promise<any>} Результат запроса
   */
  async get(path = '', params = {}) {
    try {
      const fullPath = path ? `${this.basePath}${path}` : this.basePath;
      // console.log(`🔍 GET-запрос к ${fullPath}`);
      
      const response = await api.get(fullPath, { params });
      
      // console.log(`✅ Получены данные от ${fullPath}`);
      return response.data;
    } catch (error) {
      console.error(`❌ Ошибка при GET-запросе к ${this.basePath}${path}:`, error);
      throw error;
    }
  }

  /**
   * Выполнение PUT-запроса по указанному пути
   * @param {string} path - Относительный путь (добавляется к basePath)
   * @param {Object} data - Данные для отправки
   * @returns {Promise<any>} Результат запроса
   */
  async put(path = '', data = {}) {
    try {
      const fullPath = path ? `${this.basePath}${path}` : this.basePath;
      // console.log(`📝 PUT-запрос к ${fullPath}:`, data);
      
      const response = await api.put(fullPath, data);
      
      // console.log(`✅ Данные успешно обновлены через ${fullPath}:`, response.data);
      return response.data;
    } catch (error) {
      console.error(`❌ Ошибка при PUT-запросе к ${this.basePath}${path}:`, error);
      console.error('Детали ошибки:', error.response?.data || error.message);
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
      console.log(`ApiClient.create: Создание нового ${this.resourceName}а`, JSON.stringify(data, null, 2));
      console.log(`ApiClient.create: Запрос на URL: ${this.basePath}`);
      
      const response = await this.api.post(this.basePath, data);
      
      console.log(`ApiClient.create: ${this.resourceName} успешно создан:`, JSON.stringify(response.data, null, 2));
      return response.data;
    } catch (error) {
      console.error(`ApiClient.create: Ошибка при создании ${this.resourceName}а:`, error);
      console.error('ApiClient.create: Детали ошибки:', error.response?.data || error.message);
      
      if (error.response) {
        console.error('ApiClient.create: Статус ответа:', error.response.status);
        console.error('ApiClient.create: Заголовки ответа:', error.response.headers);
        console.error('ApiClient.create: Тело ответа:', error.response.data);
      } else if (error.request) {
        console.error('ApiClient.create: Запрос был отправлен, но ответ не получен:', error.request);
      } else {
        console.error('ApiClient.create: Ошибка при настройке запроса:', error.message);
      }
      
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
      // console.log(`📝 Обновление ${this.resourceName}а #${id}:`, data);
      
      const response = await api.put(`${this.basePath}/${id}`, data);
      
      // console.log(`✅ ${this.resourceName} #${id} успешно обновлен:`, response.data);
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
      // console.log(`🗑️ Удаление ${this.resourceName}а #${id}`);
      
      const response = await api.delete(`${this.basePath}/${id}`);
      
      // console.log(`✅ ${this.resourceName} #${id} успешно удален`);
      return response.data;
    } catch (error) {
      console.error(`❌ Ошибка при удалении ${this.resourceName}а #${id}:`, error);
      console.error('Детали ошибки:', error.response?.data || error.message);
      throw error;
    }
  }
} 