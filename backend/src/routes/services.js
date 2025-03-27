const express = require('express');
const router = express.Router();
const db = require('../config/database');
const logger = require('../config/logger');
const { verifyToken, checkRole, checkSalonAccess } = require('../middleware/auth');
const { cache, invalidate } = require('../middleware/cache');

// Cache TTL constants (in milliseconds)
const CACHE_TTL = {
  SHORT: 5 * 60 * 1000,          // 5 minutes
  MEDIUM: 30 * 60 * 1000,        // 30 minutes
  LONG: 60 * 60 * 1000           // 1 hour
};

// Get all services (for admin panel)
router.get('/', cache(CACHE_TTL.MEDIUM), async (req, res) => {
  try {
    logger.info('Запрос списка всех услуг');
    
    // Изменим SQL запрос, чтобы избежать возможных проблем с JOIN
    const { rows } = await db.query(
      `SELECT s.*, 
              (SELECT name FROM salons WHERE id = s.salon_id) as salon_name
       FROM services s
       ORDER BY s.salon_id, s.name`
    );

    // Добавим отладочную информацию
    logger.info(`Получено ${rows.length} услуг из базы данных`);

    // Больше не используем мок-данные, просто возвращаем результаты из БД (даже если это пустой массив)
    // Добавляем поле active для каждой услуги для совместимости с frontend
    const servicesWithActive = rows.map(service => ({
      ...service,
      active: service.is_active
    }));

    res.json(servicesWithActive);
  } catch (error) {
    logger.error('Get all services error:', error);
    res.status(500).json({ message: 'Error fetching services', error: error.message });
  }
});

// Get all services for a salon (public)
router.get('/salon/:salonId', cache(CACHE_TTL.MEDIUM), async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT s.*, 
              json_agg(DISTINCT e.id) as employee_ids,
              json_agg(DISTINCT e.name) as employee_names
       FROM services s
       LEFT JOIN employee_services es ON s.id = es.service_id
       LEFT JOIN employees e ON es.employee_id = e.id
       WHERE s.salon_id = $1 AND s.is_active = true
       GROUP BY s.id`,
      [req.params.salonId]
    );

    // Добавляем поле active для каждой услуги для совместимости с frontend
    const servicesWithActive = rows.map(service => ({
      ...service,
      active: service.is_active
    }));

    res.json(servicesWithActive);
  } catch (error) {
    logger.error('Get services error:', error);
    res.status(500).json({ message: 'Error fetching services' });
  }
});

// Get service by ID (public)
router.get('/:id', cache(CACHE_TTL.MEDIUM), async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT s.*, 
              json_agg(DISTINCT e.id) as employee_ids,
              json_agg(DISTINCT e.name) as employee_names
       FROM services s
       LEFT JOIN employee_services es ON s.id = es.service_id
       LEFT JOIN employees e ON es.employee_id = e.id
       WHERE s.id = $1
       GROUP BY s.id`,
      [req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Service not found' });
    }

    // Добавляем поле active для совместимости с frontend
    const serviceWithActive = {
      ...rows[0],
      active: rows[0].is_active
    };

    res.json(serviceWithActive);
  } catch (error) {
    logger.error('Get service error:', error);
    res.status(500).json({ message: 'Error fetching service' });
  }
});

// Create new service (admin and salon employees)
router.post('/', 
  verifyToken, 
  checkRole('admin', 'employee'), 
  checkSalonAccess, 
  invalidate([
    (req) => `/services/salon/${req.body.salon_id}`
  ]), 
  async (req, res) => {
  try {
    const { name, description, duration, price, category, salon_id, employee_ids } = req.body;

    const client = await db.getClient();
    try {
      await client.query('BEGIN');

      // Insert service
      const { rows: [service] } = await client.query(
        `INSERT INTO services (name, description, duration, price, category, salon_id)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [name, description, duration, price, category, salon_id]
      );

      // Add employee associations
      if (employee_ids && employee_ids.length > 0) {
        const values = employee_ids.map(empId => `(${service.id}, ${empId})`).join(',');
        await client.query(
          `INSERT INTO employee_services (service_id, employee_id)
           VALUES ${values}`
        );
      }

      await client.query('COMMIT');
      
      // Добавляем поле active для совместимости с frontend
      const serviceWithActive = {
        ...service,
        active: service.is_active
      };
      
      res.status(201).json(serviceWithActive);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    logger.error('Create service error:', error);
    res.status(500).json({ message: 'Error creating service' });
  }
});

// Update service (admin and salon employees)
router.put('/:id', 
  verifyToken, 
  checkRole('admin', 'employee'), 
  checkSalonAccess, 
  invalidate([
    (req) => `/services/${req.params.id}`,
    // Invalidate salon services list and any employee services lists
    async (req) => {
      try {
        const { rows } = await db.query('SELECT salon_id FROM services WHERE id = $1', [req.params.id]);
        if (rows.length > 0) {
          return `/services/salon/${rows[0].salon_id}`;
        }
        return null;
      } catch (error) {
        logger.error('Error invalidating cache:', error);
        return null;
      }
    }
  ]),
  async (req, res) => {
  try {
    const serviceId = req.params.id;
    logger.info(`Обновление услуги #${serviceId}, данные:`, req.body);
    
    // Проверим, существует ли услуга
    const checkResult = await db.query('SELECT id FROM services WHERE id = $1', [serviceId]);
    if (checkResult.rows.length === 0) {
      logger.warn(`Услуга #${serviceId} не найдена для обновления`);
      return res.status(404).json({ message: 'Service not found' });
    }

    const { name, description, duration, price, category, is_active, active, employee_ids } = req.body;

    // Обрабатываем оба варианта поля активности (is_active и active)
    // При обновлении данных используем значение is_active из базы данных
    const activeStatus = (is_active !== undefined) ? !!is_active : (active !== undefined ? !!active : true);

    const client = await db.getClient();
    try {
      await client.query('BEGIN');

      // Update service
      const { rows: [service] } = await client.query(
        `UPDATE services
         SET name = $1, 
             description = $2, 
             duration = $3, 
             price = $4, 
             category = $5, 
             is_active = $6
         WHERE id = $7
         RETURNING *`,
        [name, description, duration, price, category, activeStatus, serviceId]
      );

      // Преобразуем is_active в active для совместимости с клиентом
      const responseService = { 
        ...service,
        active: service.is_active 
      };

      logger.info(`Услуга #${serviceId} успешно обновлена в базе данных, статус активности: ${activeStatus}`);

      // Update employee associations if provided
      if (employee_ids) {
        // Удаляем старые связи
        await client.query('DELETE FROM employee_services WHERE service_id = $1', [serviceId]);
        logger.info(`Удалены старые связи с сотрудниками для услуги #${serviceId}`);
        
        // Добавляем новые связи, если есть сотрудники
        if (employee_ids.length > 0) {
          // Создаем безопасный запрос с параметрами для вставки
          const params = [];
          const valuesSql = employee_ids.map((empId, idx) => {
            params.push(serviceId, empId);
            return `($${idx*2+1}, $${idx*2+2})`;
          }).join(',');
          
          await client.query(
            `INSERT INTO employee_services (service_id, employee_id)
             VALUES ${valuesSql}`,
            params
          );
          
          logger.info(`Добавлены новые связи с сотрудниками для услуги #${serviceId}`);
        }
      }

      await client.query('COMMIT');
      logger.info(`Транзакция для обновления услуги #${serviceId} успешно завершена`);
      res.json(responseService);
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error(`Ошибка в транзакции при обновлении услуги #${serviceId}:`, error);
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    logger.error('Update service error:', error);
    res.status(500).json({ 
      message: 'Error updating service', 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Delete service (admin only)
router.delete('/:id', 
  verifyToken, 
  checkRole('admin'), 
  invalidate([
    (req) => `/services/${req.params.id}`,
    async (req) => {
      try {
        const { rows } = await db.query('SELECT salon_id FROM services WHERE id = $1', [req.params.id]);
        if (rows.length > 0) {
          return `/services/salon/${rows[0].salon_id}`;
        }
        return null;
      } catch (error) {
        logger.error('Error invalidating cache:', error);
        return null;
      }
    }
  ]),
  async (req, res) => {
  try {
    const { rows } = await db.query(
      'DELETE FROM services WHERE id = $1 RETURNING *',
      [req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Service not found' });
    }

    res.json({ message: 'Service deleted successfully' });
  } catch (error) {
    logger.error('Delete service error:', error);
    res.status(500).json({ message: 'Error deleting service' });
  }
});

// Get available time slots for a service and employee
router.get('/:id/availability', 
  cache(CACHE_TTL.SHORT, (req) => {
    // Include query params in cache key
    return `${req.originalUrl}-${req.query.employee_id}-${req.query.date}`;
  }),
  async (req, res) => {
  try {
    const { employee_id, date } = req.query;
    const serviceId = req.params.id;

    // Get service duration
    const { rows: [service] } = await db.query(
      'SELECT duration FROM services WHERE id = $1',
      [serviceId]
    );

    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }

    // Get employee working hours
    const { rows: [employee] } = await db.query(
      'SELECT working_hours FROM employees WHERE id = $1',
      [employee_id]
    );

    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    // Get booked appointments for the day
    const { rows: appointments } = await db.query(
      `SELECT date_time
       FROM appointments
       WHERE employee_id = $1
       AND service_id = $2
       AND date_time::date = $3::date
       AND status != 'cancelled'
       ORDER BY date_time`,
      [employee_id, serviceId, date]
    );

    // Calculate available time slots
    const workingHours = employee.working_hours;
    const serviceDuration = service.duration;
    const bookedSlots = appointments.map(apt => new Date(apt.date_time));
    
    // Generate available time slots based on working hours and booked appointments
    const availableSlots = [];
    const startDate = new Date(date);
    const endDate = new Date(date);
    
    // Set working hours for the day
    const dayOfWeek = startDate.getDay();
    const daySchedule = workingHours[dayOfWeek];
    
    if (daySchedule) {
      const [startHour, startMinute] = daySchedule.start.split(':').map(Number);
      const [endHour, endMinute] = daySchedule.end.split(':').map(Number);
      
      startDate.setHours(startHour, startMinute, 0, 0);
      endDate.setHours(endHour, endMinute, 0, 0);
      
      let currentSlot = new Date(startDate);
      
      while (currentSlot < endDate) {
        const slotEnd = new Date(currentSlot.getTime() + serviceDuration * 60000);
        
        // Check if slot overlaps with any booked appointments
        const isAvailable = !bookedSlots.some(bookedSlot => {
          const bookedEnd = new Date(bookedSlot.getTime() + serviceDuration * 60000);
          return (currentSlot >= bookedSlot && currentSlot < bookedEnd) ||
                 (slotEnd > bookedSlot && slotEnd <= bookedEnd);
        });
        
        if (isAvailable) {
          availableSlots.push(new Date(currentSlot));
        }
        
        currentSlot = new Date(currentSlot.getTime() + 30 * 60000); // 30-minute intervals
      }
    }

    res.json({
      service_id: serviceId,
      employee_id,
      date,
      available_slots: availableSlots
    });
  } catch (error) {
    logger.error('Get availability error:', error);
    res.status(500).json({ message: 'Error fetching available time slots' });
  }
});

module.exports = router; 