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

// Инициализация необходимых таблиц при запуске сервера
(async function initializeTables() {
  try {
    // Проверка и создание таблицы employee_time_off если она не существует
    await db.query(`
      CREATE TABLE IF NOT EXISTS employee_time_off (
        id SERIAL PRIMARY KEY,
        employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
        date DATE NOT NULL,
        reason TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
    
    // Создаем индексы для оптимизации запросов
    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_employee_time_off_employee_id ON employee_time_off(employee_id);
      CREATE INDEX IF NOT EXISTS idx_employee_time_off_date ON employee_time_off(date);
    `);
    
    logger.info('Таблица employee_time_off инициализирована успешно');
  } catch (error) {
    logger.error('Ошибка при инициализации таблицы employee_time_off:', error);
  }
})();

// Get all employees
router.get('/', cache(CACHE_TTL.MEDIUM), async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT e.*, 
              json_agg(DISTINCT s.id) FILTER (WHERE s.id IS NOT NULL) as service_ids,
              json_agg(DISTINCT s.name) FILTER (WHERE s.name IS NOT NULL) as service_names
       FROM employees e
       LEFT JOIN employee_services es ON e.id = es.employee_id
       LEFT JOIN services s ON es.service_id = s.id
       GROUP BY e.id
       ORDER BY e.salon_id, e.last_name, e.first_name`
    );

    // Возвращаем данные из БД (даже если это пустой массив)
    logger.info(`Получено ${rows.length} сотрудников из базы данных`);
    res.json(rows);
  } catch (error) {
    logger.error('Get all employees error:', error);
    res.status(500).json({ 
      message: 'Error fetching employees', 
      error: error.message 
    });
  }
});

// Get all employees for a salon (public)
router.get('/salon/:salonId', cache(CACHE_TTL.MEDIUM), async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT e.*, 
              json_agg(DISTINCT s.id) as service_ids,
              json_agg(DISTINCT s.name) as service_names
       FROM employees e
       LEFT JOIN employee_services es ON e.id = es.employee_id
       LEFT JOIN services s ON es.service_id = s.id
       WHERE e.salon_id = $1 AND e.is_active = true
       GROUP BY e.id`,
      [req.params.salonId]
    );

    res.json(rows);
  } catch (error) {
    logger.error('Get employees error:', error);
    res.status(500).json({ message: 'Error fetching employees' });
  }
});

// Get employee by ID (public)
router.get('/:id', cache(CACHE_TTL.MEDIUM), async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT e.*, 
              json_agg(DISTINCT s.id) as service_ids,
              json_agg(DISTINCT s.name) as service_names
       FROM employees e
       LEFT JOIN employee_services es ON e.id = es.employee_id
       LEFT JOIN services s ON es.service_id = s.id
       WHERE e.id = $1
       GROUP BY e.id`,
      [req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    res.json(rows[0]);
  } catch (error) {
    logger.error('Get employee error:', error);
    res.status(500).json({ message: 'Error fetching employee' });
  }
});

// Get employee appointments
router.get('/:id/appointments', cache(CACHE_TTL.SHORT, (req) => {
  // Include query params in cache key
  return `${req.originalUrl}-${req.query.startDate || ''}-${req.query.endDate || ''}-${req.query.status || ''}`;
}), async (req, res) => {
  try {
    const employeeId = req.params.id;
    let { startDate, endDate, status, date } = req.query;
    
    // If date is provided, use it for both start and end
    if (date) {
      startDate = date;
      endDate = date;
      logger.info(`Using date parameter for employee appointments: ${date}`);
    }
    
    // If dates are not provided and we're using date filtering, set default to current month
    if ((startDate || endDate) && (!startDate || !endDate)) {
      const today = new Date();
      const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      
      startDate = startDate || firstDayOfMonth.toISOString().split('T')[0];
      endDate = endDate || lastDayOfMonth.toISOString().split('T')[0];
      
      logger.info(`Using default date range for employee appointments: ${startDate} to ${endDate}`);
    }
    
    // Build the base query to fetch appointments for the employee
    let query = `
      SELECT 
        a.id,
        a.client_id,
        c.first_name AS client_first_name,
        c.last_name AS client_last_name,
        a.service_id,
        s.name AS service_name,
        s.duration,
        s.price,
        a.date_time,
        a.status,
        a.notes
      FROM appointments a
      JOIN clients c ON a.client_id = c.id
      JOIN services s ON a.service_id = s.id
      WHERE a.employee_id = $1
    `;
    
    const queryParams = [employeeId];
    let paramCounter = 2;
    
    // Add date range filter if provided
    if (startDate && endDate) {
      query += ` AND a.date_time::date BETWEEN $${paramCounter}::date AND $${paramCounter + 1}::date`;
      queryParams.push(startDate, endDate);
      paramCounter += 2;
    }
    
    // Add status filter if provided
    if (status) {
      query += ` AND a.status = $${paramCounter}`;
      queryParams.push(status);
    }
    
    // Add order by clause
    query += ` ORDER BY a.date_time`;
    
    // Execute the query
    const { rows } = await db.query(query, queryParams);
    
    if (rows && rows.length > 0) {
      res.json(rows);
    } else {
      logger.info('No appointments found for employee');
      res.json([]);
    }
  } catch (error) {
    logger.error('Error fetching employee appointments:', error);
    res.status(500).json({ 
      status: 'error', 
      message: 'Error fetching employee appointments',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get employee schedule
router.get('/:id/schedule', cache(CACHE_TTL.SHORT, (req) => {
  // Include query params in cache key for schedule
  return `${req.originalUrl}-${req.query.startDate || ''}-${req.query.endDate || ''}`;
}), async (req, res) => {
  try {
    const employeeId = req.params.id;
    let { startDate, endDate } = req.query;
    
    // If dates are not provided, use current week as default range
    if (!startDate || !endDate) {
      const today = new Date();
      const firstDayOfWeek = new Date(today);
      firstDayOfWeek.setDate(today.getDate() - today.getDay() + 1); // Monday
      
      const lastDayOfWeek = new Date(firstDayOfWeek);
      lastDayOfWeek.setDate(firstDayOfWeek.getDate() + 6); // Sunday
      
      startDate = firstDayOfWeek.toISOString().split('T')[0];
      endDate = lastDayOfWeek.toISOString().split('T')[0];
    }
    
    // 1. Get employee's working hours
    const { rows: employeeRows } = await db.query(
      'SELECT working_hours FROM employees WHERE id = $1',
      [employeeId]
    );
    
    if (employeeRows.length === 0) {
      return res.status(404).json({ message: 'Employee not found' });
    }
    
    const workingHours = employeeRows[0].working_hours || {};
    
    // 2. Get time off days for the employee
    let timeOffDays = [];
    try {
      const { rows: timeOffRows } = await db.query(
        `SELECT date, reason FROM employee_time_off 
        WHERE employee_id = $1 
        AND date BETWEEN $2::date AND $3::date
        ORDER BY date`,
        [employeeId, startDate, endDate]
      );
      
      // Format time off data
      timeOffDays = timeOffRows.map(item => ({
        date: item.date.toISOString().split('T')[0],
        reason: item.reason || 'Личные причины'
      }));
    } catch (error) {
      logger.warn(`Ошибка при получении выходных дней для сотрудника #${employeeId}:`, error.message);
      // Continue without time off data
    }
    
    // 3. Get all appointments for the employee in date range
    const { rows: appointmentsRows } = await db.query(
      `SELECT a.id, a.client_id, a.service_id, a.date_time, s.duration, a.status
       FROM appointments a
       JOIN services s ON a.service_id = s.id
       WHERE a.employee_id = $1
       AND a.date_time::date BETWEEN $2::date AND $3::date
       ORDER BY a.date_time`,
      [employeeId, startDate, endDate]
    );
    
    // 4. Get additional data for appointments (client name, service name)
    const appointments = await Promise.all(appointmentsRows.map(async (appointment) => {
      try {
        // Get client data
        const { rows: clientRows } = await db.query(
          'SELECT name FROM clients WHERE id = $1',
          [appointment.client_id]
        );
        
        // Get service data
        const { rows: serviceRows } = await db.query(
          'SELECT name, price FROM services WHERE id = $1',
          [appointment.service_id]
        );
        
        const clientName = clientRows.length > 0 ? clientRows[0].name : 'Unknown Client';
        const serviceName = serviceRows.length > 0 ? serviceRows[0].name : 'Unknown Service';
        const servicePrice = serviceRows.length > 0 ? serviceRows[0].price : 0;
        
        // Calculate end time based on duration
        const startTime = new Date(appointment.date_time);
        const endTime = new Date(startTime.getTime() + appointment.duration * 60000);
        
        return {
          id: appointment.id,
          client_id: appointment.client_id,
          client_name: clientName,
          service_id: appointment.service_id,
          service_name: serviceName,
          service_price: servicePrice,
          start_time: startTime.toISOString(),
          end_time: endTime.toISOString(),
          duration: appointment.duration,
          status: appointment.status
        };
      } catch (error) {
        logger.error(`Error enriching appointment data for appointment #${appointment.id}:`, error);
        return null;
      }
    }));
    
    // Filter out null values (failed to enrich)
    const validAppointments = appointments.filter(a => a !== null);
    
    // 5. Build schedule array (one entry per day in range)
    const scheduleArray = [];
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    for (let current = new Date(start); current <= end; current.setDate(current.getDate() + 1)) {
      const date = current.toISOString().split('T')[0];
      const dayOfWeek = current.getDay().toString(); // 0 for Sunday, 1 for Monday, etc.
      
      // Get working hours for this day of week
      const dayWorkingHours = workingHours[dayOfWeek] || null;
      
      // Filter appointments for this date
      const dayAppointments = validAppointments.filter(appointment => {
        const aptDate = new Date(appointment.start_time).toISOString().split('T')[0];
        return aptDate === date;
      });
      
      scheduleArray.push({
        date,
        working_hours: dayWorkingHours,
        appointments: dayAppointments
      });
    }
    
    // Return complete schedule
    res.json({
      employee_id: parseInt(employeeId),
      working_hours: workingHours,
      time_off: timeOffDays,
      appointments: validAppointments
    });
    
  } catch (error) {
    logger.error('Error getting employee schedule:', error);
    res.status(500).json({ 
      message: 'Error fetching employee schedule', 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Get services provided by employee
router.get('/:id/services', cache(CACHE_TTL.MEDIUM), async (req, res) => {
  try {
    const employeeId = req.params.id;
    
    // First check if the employee exists and get salon_id
    const { rows: employeeData } = await db.query(
      'SELECT id, salon_id FROM employees WHERE id = $1',
      [employeeId]
    );
    
    if (employeeData.length === 0) {
      return res.status(404).json({ 
        message: 'Employee not found' 
      });
    }
    
    const salonId = employeeData[0].salon_id;
    
    // Query to get all services for the salon
    // Removing image_url which doesn't exist in the table
    const { rows: salonServices } = await db.query(
      `SELECT 
        id, 
        name, 
        description,
        price, 
        duration, 
        category,
        is_active
      FROM services
      WHERE salon_id = $1
      ORDER BY name`,
      [salonId]
    );
    
    // Add the 'active' field for frontend compatibility
    const servicesWithActive = salonServices.map(service => ({
      ...service,
      active: service.is_active
    }));
    
    logger.info(`Получено ${salonServices.length} услуг салона для сотрудника #${employeeId}`);
    return res.json(servicesWithActive);
  } catch (error) {
    logger.error('Error fetching employee services:', error);
    res.status(500).json({ 
      message: 'Error fetching employee services', 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Get employee performance stats
router.get('/:id/performance', cache(CACHE_TTL.SHORT, (req) => {
  // Include query params in cache key for performance data
  return `${req.originalUrl}-${req.query.startDate || ''}-${req.query.endDate || ''}`;
}), async (req, res) => {
  try {
    const employeeId = req.params.id;
    let { startDate, endDate } = req.query;
    
    // If dates are not provided, use current month as default range
    if (!startDate || !endDate) {
      const today = new Date();
      const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      
      startDate = firstDayOfMonth.toISOString().split('T')[0];
      endDate = lastDayOfMonth.toISOString().split('T')[0];
      
      logger.info(`Using default date range for employee performance: ${startDate} to ${endDate}`);
    }
    
    // Format dates with time to include all appointments on the end date
    const startDateTime = `${startDate} 00:00:00`;
    const endDateTime = `${endDate} 23:59:59`;
    
    // Get total appointments and revenue
    const { rows: apptStats } = await db.query(
      `SELECT 
        COUNT(*) as total_appointments,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_appointments,
        COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_appointments,
        SUM(CASE WHEN status = 'completed' THEN s.price ELSE 0 END) as total_revenue
       FROM appointments a
       JOIN services s ON a.service_id = s.id
       WHERE a.employee_id = $1
       AND a.date_time BETWEEN $2 AND $3`,
      [employeeId, startDateTime, endDateTime]
    );
    
    // Get client statistics
    const { rows: clientStats } = await db.query(
      `SELECT 
        COUNT(DISTINCT a.client_id) as total_clients,
        COUNT(DISTINCT CASE WHEN c.created_at >= $2 THEN a.client_id END) as new_clients,
        COUNT(DISTINCT CASE WHEN c.created_at < $2 THEN a.client_id END) as returning_clients
       FROM appointments a
       JOIN clients c ON a.client_id = c.id
       WHERE a.employee_id = $1
       AND a.date_time BETWEEN $2 AND $3`,
      [employeeId, startDateTime, endDateTime]
    );
    
    // Get average rating
    let ratingStats;
    try {
      // Проверяем существование таблицы reviews
      const { rows: tableExists } = await db.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = 'reviews'
        );
      `);
      
      if (tableExists[0].exists) {
        // Таблица существует, выполняем запрос
        const { rows } = await db.query(
          `SELECT 
            COALESCE(AVG(rating), 0) as average_rating,
            COUNT(*) as rating_count,
            COUNT(CASE WHEN rating = 5 THEN 1 END) as rating_5,
            COUNT(CASE WHEN rating = 4 THEN 1 END) as rating_4,
            COUNT(CASE WHEN rating = 3 THEN 1 END) as rating_3,
            COUNT(CASE WHEN rating = 2 THEN 1 END) as rating_2,
            COUNT(CASE WHEN rating = 1 THEN 1 END) as rating_1
           FROM reviews
           WHERE employee_id = $1
           AND created_at BETWEEN $2 AND $3`,
          [employeeId, startDateTime, endDateTime]
        );
        ratingStats = rows;
      } else {
        // Таблица не существует, используем значения по умолчанию
        logger.warn('Table "reviews" does not exist. Using default values.');
        ratingStats = [{
          average_rating: 0,
          rating_count: 0,
          rating_5: 0,
          rating_4: 0,
          rating_3: 0,
          rating_2: 0,
          rating_1: 0
        }];
      }
    } catch (error) {
      logger.error('Error while checking reviews table or getting ratings:', error);
      // Используем значения по умолчанию в случае ошибки
      ratingStats = [{
        average_rating: 0,
        rating_count: 0,
        rating_5: 0,
        rating_4: 0,
        rating_3: 0,
        rating_2: 0,
        rating_1: 0
      }];
    }
    
    // Get service breakdown
    const { rows: serviceStats } = await db.query(
      `SELECT 
        s.name,
        s.category,
        COUNT(*) as appointment_count,
        SUM(CASE WHEN a.status = 'completed' THEN s.price ELSE 0 END) as revenue
       FROM appointments a
       JOIN services s ON a.service_id = s.id
       WHERE a.employee_id = $1
       AND a.date_time BETWEEN $2 AND $3
       GROUP BY s.id, s.name, s.category
       ORDER BY appointment_count DESC`,
      [employeeId, startDateTime, endDateTime]
    );
    
    // Get services by category
    const { rows: categoryStats } = await db.query(
      `SELECT 
        s.category,
        COUNT(*) as count,
        SUM(CASE WHEN a.status = 'completed' THEN s.price ELSE 0 END) as revenue
       FROM appointments a
       JOIN services s ON a.service_id = s.id
       WHERE a.employee_id = $1
       AND a.date_time BETWEEN $2 AND $3
       GROUP BY s.category
       ORDER BY count DESC`,
      [employeeId, startDateTime, endDateTime]
    );
    
    // Get daily breakdown
    const { rows: dailyStats } = await db.query(
      `SELECT 
        DATE(a.date_time) as date,
        COUNT(*) as appointment_count,
        SUM(CASE WHEN a.status = 'completed' THEN s.price ELSE 0 END) as revenue
       FROM appointments a
       JOIN services s ON a.service_id = s.id
       WHERE a.employee_id = $1
       AND a.date_time BETWEEN $2 AND $3
       GROUP BY DATE(a.date_time)
       ORDER BY date`,
      [employeeId, startDateTime, endDateTime]
    );
    
    // Get working hours data
    // This is simplified - in a real app you might calculate from time entries or schedule
    const totalWorkDays = Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24));
    const workHoursPerDay = 8; // Assuming 8 hours per workday
    const scheduledHours = totalWorkDays * workHoursPerDay;
    
    // Calculate actual hours based on appointment durations
    const { rows: actualHoursData } = await db.query(
      `SELECT 
        SUM(s.duration) / 60 as actual_hours
       FROM appointments a
       JOIN services s ON a.service_id = s.id
       WHERE a.employee_id = $1
       AND a.status = 'completed'
       AND a.date_time BETWEEN $2 AND $3`,
      [employeeId, startDateTime, endDateTime]
    );
    
    const actualHours = parseFloat(actualHoursData[0]?.actual_hours || 0);
    const utilizationRate = scheduledHours > 0 ? Math.min(actualHours / scheduledHours, 1) : 0;
    
    // Format the ratings array for the UI
    const ratingsArray = [
      { rating: 5, count: parseInt(ratingStats[0]?.rating_5 || 0) },
      { rating: 4, count: parseInt(ratingStats[0]?.rating_4 || 0) },
      { rating: 3, count: parseInt(ratingStats[0]?.rating_3 || 0) },
      { rating: 2, count: parseInt(ratingStats[0]?.rating_2 || 0) },
      { rating: 1, count: parseInt(ratingStats[0]?.rating_1 || 0) }
    ];
    
    // Format the appointments_by_date array
    const appointmentsByDate = dailyStats.map(day => ({
      date: day.date,
      count: parseInt(day.appointment_count)
    }));
    
    // Structure the response to match the frontend expectations
    const performanceData = {
      employee_id: parseInt(employeeId),
      period: {
        start_date: startDate,
        end_date: endDate
      },
      appointments: {
        total: parseInt(apptStats[0]?.total_appointments || 0),
        completed: parseInt(apptStats[0]?.completed_appointments || 0),
        cancelled: parseInt(apptStats[0]?.cancelled_appointments || 0),
        revenue: parseFloat(apptStats[0]?.total_revenue || 0),
        average_rating: parseFloat(ratingStats[0]?.average_rating || 0),
        services_by_category: categoryStats.map(cat => ({
          category: cat.category,
          count: parseInt(cat.count),
          revenue: parseFloat(cat.revenue)
        })),
        clients: {
          total: parseInt(clientStats[0]?.total_clients || 0),
          new: parseInt(clientStats[0]?.new_clients || 0),
          returning: parseInt(clientStats[0]?.returning_clients || 0)
        }
      },
      working_hours: {
        scheduled: scheduledHours,
        actual: actualHours,
        utilization_rate: utilizationRate
      },
      ratings: ratingsArray,
      top_services: serviceStats.slice(0, 5).map(service => ({
        name: service.name,
        count: parseInt(service.appointment_count),
        revenue: parseFloat(service.revenue)
      })),
      appointments_by_date: appointmentsByDate
    };
    
    logger.info(`Retrieved performance data for employee #${employeeId} from ${startDate} to ${endDate}`);
    res.json(performanceData);
  } catch (error) {
    logger.error('Error fetching employee performance:', error);
    res.status(500).json({ 
      status: 'error', 
      message: 'Error fetching employee performance data',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Create new employee (admin and salon employees)
router.post('/', 
  verifyToken, 
  checkRole('admin', 'employee'), 
  checkSalonAccess, 
  invalidate([
    '/employees',
    (req) => `/employees/salon/${req.body.salon_id}`
  ]), 
  async (req, res) => {
  try {
    const { name, role, contact_info, working_hours, salon_id, service_ids } = req.body;

    const client = await db.getClient();
    try {
      await client.query('BEGIN');

      // Insert employee
      const { rows: [employee] } = await client.query(
        `INSERT INTO employees (name, role, contact_info, working_hours, salon_id)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [name, role, contact_info, working_hours, salon_id]
      );

      // Add service associations
      if (service_ids && service_ids.length > 0) {
        const values = service_ids.map(serviceId => `(${employee.id}, ${serviceId})`).join(',');
        await client.query(
          `INSERT INTO employee_services (employee_id, service_id)
           VALUES ${values}`
        );
      }

      await client.query('COMMIT');
      res.status(201).json(employee);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    logger.error('Create employee error:', error);
    res.status(500).json({ message: 'Error creating employee' });
  }
});

// Update employee (admin and salon employees)
router.put('/:id', 
  verifyToken, 
  checkRole('admin', 'employee'), 
  checkSalonAccess, 
  invalidate([
    '/employees',
    (req) => `/employees/${req.params.id}`,
    async (req) => {
      try {
        const { rows } = await db.query('SELECT salon_id FROM employees WHERE id = $1', [req.params.id]);
        if (rows.length > 0) {
          return `/employees/salon/${rows[0].salon_id}`;
        }
        return null;
      } catch (error) {
        logger.error('Error invalidating cache:', error);
        return null;
      }
    },
    (req) => `/employees/${req.params.id}/services`
  ]),
  async (req, res) => {
  try {
    // Извлекаем все поля из запроса
    const { 
      name, first_name, last_name, role, position, contact_info, 
      working_hours, is_active, service_ids, salon_id, photo_url 
    } = req.body;

    logger.info('Получен запрос на обновление сотрудника:', { 
      id: req.params.id,
      name, first_name, last_name, 
      role, position, 
      contact_info: JSON.stringify(contact_info),
      working_hours_keys: working_hours ? Object.keys(working_hours) : null,
      is_active, 
      service_ids_length: service_ids ? service_ids.length : 0,
      salon_id
    });

    // Убедимся, что у нас есть имя для обновления
    // Если передано как name, используем его, иначе составляем из first_name и last_name
    const employeeName = name || (first_name && last_name ? `${first_name} ${last_name}` : null);
    
    // Проверяем, что имя не пустое
    if (!employeeName) {
      return res.status(400).json({ 
        message: 'Name is required for employee update', 
        details: 'Provide either "name" field or both "first_name" and "last_name" fields'
      });
    }
    
    // Проверяем наличие контактной информации
    const employeeContactInfo = contact_info || {};
    
    // Получаем роль из поля role или принимаем 'employee' по умолчанию
    const employeeRole = role || 'employee';  // Разрешаем только роли из enum
    
    // Должность (позиция) сотрудника как отдельное поле
    const employeePosition = position || '';
    
    // Запрашиваем текущие данные сотрудника для сохранения неизменяемых полей
    const { rows: currentEmployeeData } = await db.query(
      'SELECT * FROM employees WHERE id = $1',
      [req.params.id]
    );
    
    if (currentEmployeeData.length === 0) {
      return res.status(404).json({ message: 'Employee not found' });
    }
    
    // Для отладки - логируем текущие рабочие часы до обновления
    logger.debug('Текущие рабочие часы сотрудника:', currentEmployeeData[0].working_hours);
    
    // Логируем информацию о запросе
    logger.info(`Updating employee #${req.params.id} with name: ${employeeName}, role: ${employeeRole}, position: ${employeePosition}`);
    logger.debug('Contact info:', employeeContactInfo);

    const client = await db.getClient();
    try {
      await client.query('BEGIN');

      // Включаем position как отдельное поле при обновлении
      const updateQuery = `
        UPDATE employees
        SET name = $1, 
            role = $2, 
            position = $3,
            contact_info = $4, 
            working_hours = $5, 
            is_active = $6,
            ${photo_url ? 'photo_url = $8,' : ''}
            updated_at = NOW()
        WHERE id = $7
        RETURNING *
      `;
      
      const queryParams = [
        employeeName, 
        employeeRole, 
        employeePosition,
        employeeContactInfo, 
        working_hours || currentEmployeeData[0].working_hours, 
        is_active !== undefined ? is_active : currentEmployeeData[0].is_active, 
        req.params.id
      ];
      
      if (photo_url) {
        queryParams.push(photo_url);
      }
      
      // Update employee with refined data
      const { rows: [employee] } = await client.query(
        photo_url 
          ? updateQuery 
          : `UPDATE employees
             SET name = $1, 
                 role = $2, 
                 position = $3,
                 contact_info = $4, 
                 working_hours = $5, 
                 is_active = $6,
                 updated_at = NOW()
             WHERE id = $7
             RETURNING *`,
        queryParams
      );

      if (!employee) {
        await client.query('ROLLBACK');
        return res.status(404).json({ message: 'Employee not found' });
      }

      // Обновление связи с салоном, если предоставлено
      if (salon_id) {
        await client.query(
          `UPDATE employees SET salon_id = $1 WHERE id = $2`,
          [salon_id, req.params.id]
        );
      }

      // Update service associations
      await client.query('DELETE FROM employee_services WHERE employee_id = $1', [req.params.id]);
      
      if (service_ids && service_ids.length > 0) {
        const values = service_ids.map(serviceId => `(${req.params.id}, ${serviceId})`).join(',');
        await client.query(
          `INSERT INTO employee_services (employee_id, service_id)
           VALUES ${values}`
        );
      }

      await client.query('COMMIT');
      logger.info(`Employee #${req.params.id} updated successfully`);
      
      // Для отладки - логируем обновленные рабочие часы после обновления
      logger.debug('Обновленные рабочие часы сотрудника:', employee.working_hours);
      
      res.json(employee);
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Database error during employee update:', error);
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    logger.error('Update employee error:', error);
    res.status(500).json({ 
      message: 'Error updating employee', 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Delete employee (admin only)
router.delete('/:id', 
  verifyToken, 
  checkRole('admin'), 
  invalidate([
    '/employees',
    (req) => `/employees/${req.params.id}`,
    async (req) => {
      try {
        const { rows } = await db.query('SELECT salon_id FROM employees WHERE id = $1', [req.params.id]);
        if (rows.length > 0) {
          return `/employees/salon/${rows[0].salon_id}`;
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
      'DELETE FROM employees WHERE id = $1 RETURNING *',
      [req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    res.json({ message: 'Employee deleted successfully' });
  } catch (error) {
    logger.error('Delete employee error:', error);
    res.status(500).json({ message: 'Error deleting employee' });
  }
});

// Update appointment status (admin and salon employees)
router.put('/:id/appointments/:appointmentId/status', 
  verifyToken, 
  checkRole('admin', 'employee'), 
  checkSalonAccess, 
  invalidate([
    (req) => `/employees/${req.params.id}/appointments`,
    (req) => `/employees/${req.params.id}/schedule`
  ]),
  async (req, res) => {
  try {
    const { status } = req.body;
    const { appointmentId } = req.params;

    const { rows } = await db.query(
      `UPDATE appointments
       SET status = $1
       WHERE id = $2 AND employee_id = $3
       RETURNING *`,
      [status, appointmentId, req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    res.json(rows[0]);
  } catch (error) {
    logger.error('Update appointment status error:', error);
    res.status(500).json({ message: 'Error updating appointment status' });
  }
});

// Update employee schedule
router.put('/:id/schedule', verifyToken, async (req, res) => {
  try {
    const employeeId = req.params.id;
    const { working_hours, time_off } = req.body;
    
    logger.info(`Запрос на обновление расписания сотрудника #${employeeId}`, { 
      working_hours_days: working_hours ? Object.keys(working_hours).length : 0,
      time_off_days: time_off ? time_off.length : 0 
    });
    
    // Check if employee exists
    const { rows: employeeRows } = await db.query(
      'SELECT id FROM employees WHERE id = $1',
      [employeeId]
    );
    
    if (employeeRows.length === 0) {
      logger.warn(`Сотрудник #${employeeId} не найден при попытке обновить расписание`);
      return res.status(404).json({ message: 'Employee not found' });
    }
    
    // Update employee's working hours
    await db.query(
      'UPDATE employees SET working_hours = $1, updated_at = NOW() WHERE id = $2',
      [working_hours || {}, employeeId]
    );
    
    // Handle time_off data - first delete existing time offs
    if (time_off && Array.isArray(time_off)) {
      try {
        // Удаляем существующие записи
        await db.query('DELETE FROM employee_time_off WHERE employee_id = $1', [employeeId]);
        
        // Вставляем новые записи о выходных днях
        if (time_off.length > 0) {
          const insertValues = time_off.map((item, index) => {
            return `($1, $${index * 2 + 2}, $${index * 2 + 3})`;
          }).join(', ');
          
          const insertParams = [employeeId];
          time_off.forEach(item => {
            insertParams.push(item.date);
            insertParams.push(item.reason || 'Личные причины');
          });
          
          await db.query(
            `INSERT INTO employee_time_off (employee_id, date, reason) VALUES ${insertValues}`,
            insertParams
          );
          
          logger.info(`Добавлено ${time_off.length} выходных дней для сотрудника #${employeeId}`);
        }
      } catch (error) {
        logger.error('Ошибка при обновлении выходных дней:', error);
        // Продолжаем выполнение, даже если были ошибки с выходными днями
      }
    }
    
    logger.info(`Успешно обновлено расписание для сотрудника #${employeeId}`);
    
    // Получаем актуальные данные о выходных днях из базы
    let formattedTimeOff = [];
    try {
      const { rows: currentTimeOff } = await db.query(
        `SELECT date, reason FROM employee_time_off 
         WHERE employee_id = $1 
         ORDER BY date`,
        [employeeId]
      );
      
      // Форматируем даты в строковом формате для API
      formattedTimeOff = currentTimeOff.map(item => ({
        date: item.date.toISOString().split('T')[0],
        reason: item.reason
      }));
    } catch (error) {
      logger.warn('Ошибка при получении выходных дней из базы:', error.message);
      // Если не удалось получить данные из БД, используем переданные данные
      formattedTimeOff = time_off || [];
    }
    
    res.json({ 
      message: 'Schedule updated successfully',
      working_hours: working_hours || {},
      time_off: formattedTimeOff
    });
  } catch (error) {
    logger.error('Error updating employee schedule:', error);
    res.status(500).json({ 
      message: 'Error updating employee schedule', 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

module.exports = router; 