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
   * @throws {Error} Если ID сотрудника не определен
   */
  updateSchedule: async (id, scheduleData) => {
    console.log('updateSchedule called with params:', { id, scheduleData });
    
    // Сначала используем ID из параметра функции
    let employeeId = id;
    
    // Если параметр ID не определен, попробуем получить из scheduleData
    if (!employeeId && scheduleData?.employee_id) {
      console.log(`Using employee_id ${scheduleData.employee_id} from scheduleData`);
      employeeId = scheduleData.employee_id;
    }
    
    // Если ID всё еще не определен, выбрасываем ошибку
    if (!employeeId) {
      console.error('Employee ID is undefined in both function parameter and scheduleData', {
        idParam: id,
        scheduleDataId: scheduleData?.employee_id
      });
      throw new Error('ID сотрудника не определен. Пожалуйста, войдите в систему снова.');
    }
    
    // Преобразуем ID в число для надежности
    const numericId = Number(employeeId);
    if (isNaN(numericId)) {
      console.error(`Invalid employee ID: "${employeeId}" is not a number`);
      throw new Error(`ID сотрудника недействителен (не является числом): ${employeeId}`);
    }
    
    try {
      console.log(`Отправка запроса на обновление расписания для сотрудника ID ${numericId}`);
      
      // Клонируем данные для отправки
      const dataToSend = { ...scheduleData };
      
      // Удаляем employee_id из передаваемых данных, так как ID уже в URL
      if (dataToSend.employee_id) {
        delete dataToSend.employee_id;
      }
      
      // Логируем URL и данные запроса для отладки
      console.log(`Request URL: /employees/${numericId}/schedule`);
      console.log('Request data:', dataToSend);
      
      const { data } = await api.put(`/employees/${numericId}/schedule`, dataToSend);
      console.log('Update schedule response:', data);
      return data;
    } catch (error) {
      console.error(`Ошибка при обновлении расписания для сотрудника ID ${numericId}:`, error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      throw error;
    }
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
   * Связать сотрудника с услугой - прямое обновление через основной API
   * @param {number} id ID сотрудника
   * @param {number} serviceId ID услуги
   * @returns {Promise<Object>} Результат операции
   */
  assignService: async (id, serviceId) => {
    console.log(`Прямое добавление услуги ID ${serviceId} сотруднику ID ${id}`);
    
    try {
      // Получаем текущую информацию о сотруднике
      const employee = await api.get(`/employees/${id}`);
      
      // Получаем текущий список service_ids или создаем пустой массив
      const currentServiceIds = employee.data.service_ids || [];
      
      // Проверяем, есть ли уже эта услуга
      if (currentServiceIds.includes(serviceId)) {
        console.log(`Услуга ID ${serviceId} уже назначена сотруднику ID ${id}`);
        return employee.data;
      }
      
      // Добавляем новый ID услуги к существующим
      const updatedServiceIds = [...currentServiceIds, serviceId];
      
      // Обновляем сотрудника с новым списком услуг
      const updatedEmployeeData = {
        ...employee.data,
        service_ids: updatedServiceIds
      };
      
      console.log(`Обновление сотрудника ID ${id} с новыми услугами:`, updatedServiceIds);
      
      // Отправляем запрос на обновление
      const result = await api.put(`/employees/${id}`, updatedEmployeeData);
      console.log(`Результат добавления услуги:`, result.data);
      
      return result.data;
    } catch (error) {
      console.error(`Ошибка при добавлении услуги ${serviceId} сотруднику ${id}:`, error);
      throw error;
    }
  },

  /**
   * Удалить связь сотрудника с услугой - прямое обновление через основной API
   * @param {number} id ID сотрудника
   * @param {number} serviceId ID услуги
   * @returns {Promise<void>}
   */
  removeService: async (id, serviceId) => {
    console.log(`Прямое удаление услуги ID ${serviceId} у сотрудника ID ${id}`);
    
    try {
      // Получаем текущую информацию о сотруднике
      const employee = await api.get(`/employees/${id}`);
      
      // Получаем текущий список service_ids или создаем пустой массив
      const currentServiceIds = employee.data.service_ids || [];
      
      // Удаляем ID услуги из списка
      const updatedServiceIds = currentServiceIds.filter(sid => sid !== serviceId);
      
      // Проверяем, изменился ли список услуг
      if (currentServiceIds.length === updatedServiceIds.length) {
        console.log(`Услуга ID ${serviceId} не найдена у сотрудника ID ${id}`);
        return employee.data;
      }
      
      // Обновляем сотрудника с новым списком услуг
      const updatedEmployeeData = {
        ...employee.data,
        service_ids: updatedServiceIds
      };
      
      console.log(`Обновление сотрудника ID ${id} после удаления услуги:`, updatedServiceIds);
      
      // Отправляем запрос на обновление
      const result = await api.put(`/employees/${id}`, updatedEmployeeData);
      console.log(`Результат удаления услуги:`, result.data);
      
      return result.data;
    } catch (error) {
      console.error(`Ошибка при удалении услуги ${serviceId} у сотрудника ${id}:`, error);
      throw error;
    }
  },

  /**
   * Получить услуги, предоставляемые сотрудником
   * @param {number} id ID сотрудника
   * @returns {Promise<Array>} Список услуг
   */
  getServices: async (id) => {
    try {
      // Получаем текущую информацию о сотруднике
      const employeeResponse = await api.get(`/employees/${id}`);
      const employee = employeeResponse.data;
      
      // Получаем список ID услуг сотрудника
      const serviceIds = employee.service_ids || [];
      console.log(`Получены service_ids сотрудника ${id} из профиля:`, serviceIds);
      
      if (serviceIds.length === 0) {
        console.log(`У сотрудника ${id} нет назначенных услуг`);
        return [];
      }
      
      // Пробуем получить услуги через API
      try {
        const servicesResponse = await api.get(`/employees/${id}/services`);
        const services = servicesResponse.data;
        
        // Проверяем соответствие между service_ids сотрудника и полученными услугами
        const receivedServiceIds = services.map(s => s.id);
        console.log(`Получены ID услуг из API /employees/${id}/services:`, receivedServiceIds);
        
        // Проверяем различия между списками
        const missingInApi = serviceIds.filter(id => !receivedServiceIds.includes(id));
        if (missingInApi.length > 0) {
          console.warn(`Обнаружены расхождения между service_ids (${serviceIds}) и API (${receivedServiceIds})`,
            `Отсутствуют в API: ${missingInApi}`);
          
          // В этом случае, получаем все услуги отдельным запросом
          const allServices = (await api.get('/services')).data;
          
          // Фильтруем услуги по ID из профиля сотрудника
          const combinedServices = serviceIds.map(serviceId => {
            const service = allServices.find(s => s.id === serviceId);
            if (!service) {
              console.warn(`Услуга с ID ${serviceId} не найдена в общем списке услуг`);
              return { id: serviceId, name: `Услуга ${serviceId}`, category: 'Неизвестно', price: 0, duration: 0 };
            }
            return service;
          });
          
          console.log(`Составлен полный список услуг сотрудника на основе service_ids:`, combinedServices);
          return combinedServices;
        }
        
        return services;
      } catch (error) {
        console.error(`Ошибка при получении услуг через API для сотрудника ${id}:`, error);
        console.log(`Используем запасной вариант для получения услуг`);
        
        // Получаем все услуги
        const allServices = (await api.get('/services')).data;
        
        // Фильтруем по ID из профиля сотрудника
        const employeeServices = serviceIds.map(serviceId => {
          const service = allServices.find(s => s.id === serviceId);
          if (!service) {
            console.warn(`Услуга с ID ${serviceId} не найдена в общем списке услуг`);
            return { id: serviceId, name: `Услуга ${serviceId}`, category: 'Неизвестно', price: 0, duration: 0 };
          }
          return service;
        });
        
        return employeeServices;
      }
    } catch (error) {
      console.error(`Ошибка при получении услуг сотрудника ${id}:`, error);
      throw error;
    }
  },
  
  /**
   * Обновить список услуг сотрудника через основной API сотрудников
   * @param {number} id ID сотрудника
   * @param {Array<number>} serviceIds Массив ID услуг
   * @returns {Promise<Object>} Результат операции
   */
  updateServices: async (id, serviceIds) => {
    console.log(`Прямое обновление всех услуг для сотрудника ID ${id}:`, serviceIds);
    try {
      // Проверяем, что ID является валидным числом
      if (!id || isNaN(parseInt(id, 10))) {
        throw new Error('Некорректный ID сотрудника');
      }
      
      // Проверяем, что serviceIds - массив
      if (!Array.isArray(serviceIds)) {
        console.warn('serviceIds не является массивом, используем пустой массив');
        serviceIds = [];
      }
      
      // Фильтруем невалидные ID и преобразуем все ID в числа
      const validServiceIds = serviceIds
        .filter(sid => sid !== null && sid !== undefined && !isNaN(parseInt(sid, 10)))
        .map(sid => parseInt(sid, 10));
      
      console.log(`Отфильтрованные ID услуг:`, validServiceIds);
      
      // Получаем текущую информацию о сотруднике
      const employee = await api.get(`/employees/${id}`);
      
      // Создаем обновленный объект данных сотрудника с новым списком услуг
      const updatedEmployeeData = {
        ...employee.data,
        service_ids: validServiceIds
      };
      
      // Удаляем ненужные поля, которые могут вызвать конфликты
      delete updatedEmployeeData.created_at;
      delete updatedEmployeeData.updated_at;
      delete updatedEmployeeData.service_names;
      
      // Отправляем запрос на обновление через основной API сотрудников
      console.log(`Отправка данных на обновление сотрудника с услугами:`, updatedEmployeeData);
      const result = await api.put(`/employees/${id}`, updatedEmployeeData);
      
      console.log(`Сотрудник успешно обновлен с новым списком услуг`);
      
      // Получаем все услуги
      const allServices = (await api.get('/services')).data;
      
      // Используем данные из результата обновления, а не дополнительный запрос
      const updatedEmployee = result.data;
      const updatedServiceIds = updatedEmployee.service_ids || [];
      
      console.log(`ID услуг после обновления из профиля:`, updatedServiceIds);
      
      // Фильтруем услуги по ID
      const updatedServices = updatedServiceIds.map(serviceId => {
        const service = allServices.find(s => s.id === serviceId);
        if (!service) {
          console.warn(`Услуга с ID ${serviceId} не найдена в общем списке услуг`);
          return { id: serviceId, name: `Услуга ${serviceId}`, category: 'Неизвестно', price: 0, duration: 0 };
        }
        return service;
      });
      
      console.log(`Сформирован список услуг на основе обновленных данных:`, updatedServices);
      return updatedServices;
    } catch (error) {
      console.error(`Ошибка при обновлении списка услуг сотрудника ${id}:`, error);
      throw error;
    }
  }
}; 