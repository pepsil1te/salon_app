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
  
  /**
   * Получение всех категорий услуг для салона
   * @param {number} salonId ID салона
   * @returns {Promise<Array>} Массив категорий услуг
   */
  async getCategories(salonId) {
    try {
      console.log(`🔍 Запрос категорий услуг для салона #${salonId}`);
      
      try {
        // Пытаемся получить категории с эндпоинта
        const response = await this.api.get('/services/service-categories', {
          params: { salon_id: salonId }
        });
        
        console.log(`✅ Получены категории услуг для салона #${salonId}:`, response.data.length, 'записей');
        return response.data;
      } catch (apiError) {
        // Если эндпоинт не существует (404), извлекаем категории из услуг
        if (apiError.response && apiError.response.status === 404) {
          console.log(`⚠️ Эндпоинт категорий не найден, извлекаем категории из услуг`);
          
          // Получаем все услуги для салона
          const services = await this.getBySalon(salonId);
          
          if (!services || services.length === 0) {
            console.log(`⚠️ Услуги не найдены, возвращаем пустой массив категорий`);
            return [];
          }
          
          // Извлекаем уникальные категории из услуг
          const uniqueCategories = [...new Set(services.map(service => service.category))]
            .filter(Boolean)
            .map((name, index) => ({
              id: `extracted-${index}`,
              name,
              description: 'Извлечено из услуг',
              color: this._getCategoryColor(name),
              sort_order: index,
              salon_id: salonId,
              is_extracted: true // Помечаем как извлеченную категорию
            }));
          
          console.log(`✅ Извлечены категории из услуг:`, uniqueCategories.length, 'записей');
          return uniqueCategories;
        } else {
          // Другие ошибки пробрасываем дальше
          throw apiError;
        }
      }
    } catch (error) {
      console.error(`❌ Ошибка при получении категорий услуг:`, error);
      return []; // Возвращаем пустой массив вместо ошибки
    }
  }
  
  // Helper method to generate consistent colors for categories
  _getCategoryColor(name) {
    const colors = [
      '#673ab7', '#3f51b5', '#2196f3', '#009688', '#4caf50',
      '#8bc34a', '#cddc39', '#ffc107', '#ff9800', '#ff5722'
    ];
    
    // Use the sum of character codes to create a deterministic color
    const charSum = name.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
    return colors[charSum % colors.length];
  }
  
  /**
   * Создание новой категории услуг
   * @param {Object} categoryData Данные новой категории
   * @returns {Promise<Object>} Созданная категория
   */
  async createCategory(categoryData) {
    try {
      console.log(`🔍 Создание новой категории услуг:`, categoryData);
      
      const response = await this.api.post('/services/service-categories', categoryData);
      
      console.log(`✅ Создана новая категория услуг:`, response.data);
      return response.data;
    } catch (error) {
      console.error(`❌ Ошибка при создании категории услуг:`, error);
      throw error;
    }
  }
  
  /**
   * Обновление категории услуг
   * @param {number} categoryId ID категории
   * @param {Object} categoryData Обновленные данные категории
   * @returns {Promise<Object>} Обновленная категория
   */
  async updateCategory(categoryId, categoryData) {
    try {
      console.log(`🔍 Обновление категории услуг #${categoryId}:`, categoryData);
      
      const response = await this.api.put(`/services/service-categories/${categoryId}`, categoryData);
      
      console.log(`✅ Обновлена категория услуг #${categoryId}:`, response.data);
      return response.data;
    } catch (error) {
      console.error(`❌ Ошибка при обновлении категории услуг:`, error);
      throw error;
    }
  }
  
  /**
   * Удаление категории услуг
   * @param {number} categoryId ID категории
   * @returns {Promise<Object>} Результат удаления
   */
  async deleteCategory(categoryId) {
    try {
      console.log(`🔍 Удаление категории услуг #${categoryId}`);
      
      const response = await this.api.delete(`/services/service-categories/${categoryId}`);
      
      console.log(`✅ Удалена категория услуг #${categoryId}`);
      return response.data;
    } catch (error) {
      console.error(`❌ Ошибка при удалении категории услуг:`, error);
      throw error;
    }
  }
}

export const serviceApi = new ServiceApiClient(); 