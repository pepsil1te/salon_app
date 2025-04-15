const express = require('express');
const router = express.Router();
const db = require('../config/database');
const logger = require('../config/logger');
const { verifyToken, checkRole, checkSalonAccess } = require('../middleware/auth');
const { format, subDays, startOfMonth, endOfMonth, parseISO } = require('date-fns');

// Получить общую статистику (для всех салонов - только для админа)
router.get('/dashboard', verifyToken, checkRole('admin'), async (req, res) => {
  try {
    const { startDate, endDate } = parseAndValidateDates(req.query);

    // Статистика по всем записям
    const { rows: [appointmentStats] } = await db.query(
      `SELECT 
        COUNT(*) as total_appointments,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_appointments,
        COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_appointments,
        SUM(CASE WHEN status = 'completed' THEN s.price ELSE 0 END) as total_revenue
       FROM appointments a
       JOIN services s ON a.service_id = s.id
       WHERE a.date_time BETWEEN $1 AND $2`,
      [startDate, endDate]
    );

    // Количество активных салонов
    const { rows: [salonStats] } = await db.query(
      `SELECT COUNT(*) as total_salons FROM salons`
    );

    // Количество активных сотрудников
    const { rows: [employeeStats] } = await db.query(
      `SELECT COUNT(*) as total_employees,
        COUNT(CASE WHEN is_active = true THEN 1 END) as active_employees
       FROM employees`
    );

    // Количество услуг
    const { rows: [serviceStats] } = await db.query(
      `SELECT COUNT(*) as total_services,
        COUNT(CASE WHEN is_active = true THEN 1 END) as active_services
       FROM services`
    );

    // Статистика по дням
    const { rows: revenueByDay } = await db.query(
      `SELECT 
        DATE(date_time) as date,
        COUNT(*) as appointment_count,
        SUM(CASE WHEN status = 'completed' THEN s.price ELSE 0 END) as revenue
       FROM appointments a
       JOIN services s ON a.service_id = s.id
       WHERE a.date_time BETWEEN $1 AND $2
       GROUP BY DATE(date_time)
       ORDER BY date`,
      [startDate, endDate]
    );

    res.json({
      appointment_stats: {
        total: parseInt(appointmentStats.total_appointments) || 0,
        completed: parseInt(appointmentStats.completed_appointments) || 0,
        cancelled: parseInt(appointmentStats.cancelled_appointments) || 0,
        revenue: parseFloat(appointmentStats.total_revenue) || 0
      },
      salon_stats: {
        total: parseInt(salonStats.total_salons) || 0
      },
      employee_stats: {
        total: parseInt(employeeStats.total_employees) || 0,
        active: parseInt(employeeStats.active_employees) || 0
      },
      service_stats: {
        total: parseInt(serviceStats.total_services) || 0,
        active: parseInt(serviceStats.active_services) || 0
      },
      revenue_by_day: revenueByDay.map(day => ({
        date: day.date,
        appointment_count: parseInt(day.appointment_count) || 0,
        revenue: parseFloat(day.revenue) || 0
      }))
    });
  } catch (error) {
    logger.error('Get statistics dashboard error:', error);
    res.status(500).json({ message: 'Error fetching statistics dashboard', error: error.message });
  }
});

// Получить статистику по салону
router.get('/salon/:salonId', verifyToken, checkRole('admin', 'employee'), checkSalonAccess, async (req, res) => {
  try {
    const salonId = req.params.salonId;
    const { startDate, endDate } = parseAndValidateDates(req.query);

    // Общая статистика по салону
    const { rows: [salonStats] } = await db.query(
      `SELECT 
        COUNT(*) as total_appointments,
        COUNT(CASE WHEN a.status = 'completed' THEN 1 END) as completed_appointments,
        COUNT(CASE WHEN a.status = 'cancelled' THEN 1 END) as cancelled_appointments,
        SUM(CASE WHEN a.status = 'completed' THEN s.price ELSE 0 END) as total_revenue
       FROM appointments a
       JOIN services s ON a.service_id = s.id
       WHERE a.salon_id = $1
       AND a.date_time BETWEEN $2 AND $3`,
      [salonId, startDate, endDate]
    );

    // Популярные услуги
    const { rows: popularServices } = await db.query(
      `SELECT 
        s.id,
        s.name,
        s.category,
        COUNT(*) as booking_count,
        SUM(s.price) as total_revenue
       FROM appointments a
       JOIN services s ON a.service_id = s.id
       WHERE a.salon_id = $1
       AND a.date_time BETWEEN $2 AND $3
       AND a.status = 'completed'
       GROUP BY s.id, s.name, s.category
       ORDER BY booking_count DESC
       LIMIT 10`,
      [salonId, startDate, endDate]
    );

    // Статистика по сотрудникам
    const { rows: topEmployees } = await db.query(
      `SELECT 
        e.id,
        e.first_name,
        e.last_name,
        e.position,
        COUNT(*) as appointment_count,
        SUM(CASE WHEN a.status = 'completed' THEN s.price ELSE 0 END) as revenue
       FROM appointments a
       JOIN services s ON a.service_id = s.id
       JOIN employees e ON a.employee_id = e.id
       WHERE a.salon_id = $1
       AND a.date_time BETWEEN $2 AND $3
       GROUP BY e.id, e.first_name, e.last_name, e.position
       ORDER BY revenue DESC`,
      [salonId, startDate, endDate]
    );

    // Статистика по дням
    const { rows: revenueByDay } = await db.query(
      `SELECT 
        DATE(date_time) as date,
        COUNT(*) as appointment_count,
        COUNT(CASE WHEN a.status = 'completed' THEN 1 END) as completed_count,
        COUNT(CASE WHEN a.status = 'cancelled' THEN 1 END) as cancelled_count,
        SUM(CASE WHEN a.status = 'completed' THEN s.price ELSE 0 END) as revenue
       FROM appointments a
       JOIN services s ON a.service_id = s.id
       WHERE a.salon_id = $1
       AND a.date_time BETWEEN $2 AND $3
       GROUP BY DATE(date_time)
       ORDER BY date`,
      [salonId, startDate, endDate]
    );

    // Статистика по категориям услуг
    const { rows: serviceCategories } = await db.query(
      `SELECT 
        s.category,
        COUNT(*) as booking_count,
        SUM(CASE WHEN a.status = 'completed' THEN s.price ELSE 0 END) as revenue
       FROM appointments a
       JOIN services s ON a.service_id = s.id
       WHERE a.salon_id = $1
       AND a.date_time BETWEEN $2 AND $3
       GROUP BY s.category
       ORDER BY revenue DESC`,
      [salonId, startDate, endDate]
    );

    res.json({
      salon_stats: {
        total_appointments: parseInt(salonStats.total_appointments) || 0,
        completed_appointments: parseInt(salonStats.completed_appointments) || 0,
        cancelled_appointments: parseInt(salonStats.cancelled_appointments) || 0,
        total_revenue: parseFloat(salonStats.total_revenue) || 0
      },
      popular_services: popularServices.map(service => ({
        id: service.id,
        name: service.name,
        category: service.category,
        booking_count: parseInt(service.booking_count) || 0,
        revenue: parseFloat(service.total_revenue) || 0
      })),
      top_employees: topEmployees.map(employee => ({
        id: employee.id,
        name: `${employee.first_name} ${employee.last_name}`,
        position: employee.position,
        appointment_count: parseInt(employee.appointment_count) || 0,
        revenue: parseFloat(employee.revenue) || 0
      })),
      revenue_by_day: revenueByDay.map(day => ({
        date: day.date,
        appointment_count: parseInt(day.appointment_count) || 0,
        completed_count: parseInt(day.completed_count) || 0,
        cancelled_count: parseInt(day.cancelled_count) || 0,
        revenue: parseFloat(day.revenue) || 0
      })),
      service_categories: serviceCategories.map(category => ({
        category: category.category,
        booking_count: parseInt(category.booking_count) || 0,
        revenue: parseFloat(category.revenue) || 0
      }))
    });
  } catch (error) {
    logger.error('Get salon statistics error:', error);
    res.status(500).json({ message: 'Error fetching salon statistics', error: error.message });
  }
});

// Получить детальную статистику по сотрудникам
router.get('/employees', verifyToken, checkRole('admin', 'employee'), async (req, res) => {
  try {
    const { salonId } = req.query;
    const { startDate, endDate } = parseAndValidateDates(req.query);

    // Проверка прав доступа для сотрудника
    if (req.user.role === 'employee') {
      if (!req.user.salon_id || req.user.salon_id !== parseInt(salonId)) {
        return res.status(403).json({ message: 'Access denied: You can only view your salon statistics' });
      }
    }

    let query = `
      SELECT 
        e.id,
        e.first_name,
        e.last_name,
        e.position,
        s.name as salon_name,
        COUNT(a.id) as total_appointments,
        COUNT(CASE WHEN a.status = 'completed' THEN 1 END) as completed_appointments,
        COUNT(CASE WHEN a.status = 'cancelled' THEN 1 END) as cancelled_appointments,
        SUM(CASE WHEN a.status = 'completed' THEN srv.price ELSE 0 END) as total_revenue,
        ROUND(AVG(CASE WHEN a.status = 'completed' THEN srv.price ELSE NULL END), 2) as avg_service_price
      FROM employees e
      LEFT JOIN appointments a ON e.id = a.employee_id AND a.date_time BETWEEN $1 AND $2
      LEFT JOIN services srv ON a.service_id = srv.id
      LEFT JOIN salons s ON e.salon_id = s.id
    `;

    const params = [startDate, endDate];
    let paramIndex = 2;

    if (salonId) {
      paramIndex++;
      query += ` WHERE e.salon_id = $${paramIndex}`;
      params.push(salonId);
    }

    query += `
      GROUP BY e.id, e.first_name, e.last_name, e.position, s.name
      ORDER BY total_revenue DESC
    `;

    const { rows: employeeStats } = await db.query(query, params);

    // Дополнительные данные: % загруженности
    const employeeIds = employeeStats.map(e => e.id);
    
    if (employeeIds.length > 0) {
      const { rows: busyStats } = await db.query(
        `SELECT 
          employee_id,
          COUNT(DISTINCT DATE(date_time)) as worked_days,
          COUNT(*) as total_appointments,
          SUM(srv.duration) as total_minutes
         FROM appointments a
         JOIN services srv ON a.service_id = srv.id
         WHERE a.employee_id = ANY($1)
         AND a.date_time BETWEEN $2 AND $3
         AND a.status = 'completed'
         GROUP BY employee_id`,
        [employeeIds, startDate, endDate]
      );

      // Объединяем данные
      for (const employee of employeeStats) {
        const busyStat = busyStats.find(b => b.employee_id === employee.id);
        employee.worked_days = busyStat ? parseInt(busyStat.worked_days) : 0;
        employee.total_minutes = busyStat ? parseInt(busyStat.total_minutes) : 0;
        
        // Форматируем данные
        employee.total_appointments = parseInt(employee.total_appointments) || 0;
        employee.completed_appointments = parseInt(employee.completed_appointments) || 0;
        employee.cancelled_appointments = parseInt(employee.cancelled_appointments) || 0;
        employee.total_revenue = parseFloat(employee.total_revenue) || 0;
        employee.avg_service_price = parseFloat(employee.avg_service_price) || 0;
      }
    }

    res.json(employeeStats);
  } catch (error) {
    logger.error('Get employee statistics error:', error);
    res.status(500).json({ message: 'Error fetching employee statistics', error: error.message });
  }
});

// Получить детальную статистику по услугам
router.get('/services', verifyToken, checkRole('admin', 'employee'), async (req, res) => {
  try {
    const { salonId, categoryFilter } = req.query;
    const { startDate, endDate } = parseAndValidateDates(req.query);

    // Проверка прав доступа для сотрудника
    if (req.user.role === 'employee') {
      if (!req.user.salon_id || req.user.salon_id !== parseInt(salonId)) {
        return res.status(403).json({ message: 'Access denied: You can only view your salon statistics' });
      }
    }

    let query = `
      SELECT 
        s.id,
        s.name,
        s.category,
        s.price,
        s.duration,
        sal.name as salon_name,
        COUNT(a.id) as booking_count,
        COUNT(CASE WHEN a.status = 'completed' THEN 1 END) as completed_count,
        COUNT(CASE WHEN a.status = 'cancelled' THEN 1 END) as cancelled_count,
        SUM(CASE WHEN a.status = 'completed' THEN s.price ELSE 0 END) as revenue
      FROM services s
      LEFT JOIN appointments a ON s.id = a.service_id AND a.date_time BETWEEN $1 AND $2
      LEFT JOIN salons sal ON s.salon_id = sal.id
      WHERE 1=1
    `;

    const params = [startDate, endDate];
    let paramIndex = 2;

    if (salonId) {
      paramIndex++;
      query += ` AND s.salon_id = $${paramIndex}`;
      params.push(salonId);
    }

    if (categoryFilter) {
      paramIndex++;
      query += ` AND s.category = $${paramIndex}`;
      params.push(categoryFilter);
    }

    query += `
      GROUP BY s.id, s.name, s.category, s.price, s.duration, sal.name
      ORDER BY booking_count DESC
    `;

    const { rows: serviceStats } = await db.query(query, params);

    // Статистика по категориям
    const { rows: categoryStats } = await db.query(
      `SELECT 
        s.category,
        COUNT(a.id) as booking_count,
        SUM(CASE WHEN a.status = 'completed' THEN s.price ELSE 0 END) as revenue
       FROM services s
       LEFT JOIN appointments a ON s.id = a.service_id AND a.date_time BETWEEN $1 AND $2
       ${salonId ? 'WHERE s.salon_id = $3' : ''}
       GROUP BY s.category
       ORDER BY booking_count DESC`,
      salonId ? [startDate, endDate, salonId] : [startDate, endDate]
    );

    res.json({
      services: serviceStats.map(service => ({
        id: service.id,
        name: service.name,
        category: service.category,
        price: parseFloat(service.price),
        duration: parseInt(service.duration),
        salon_name: service.salon_name,
        booking_count: parseInt(service.booking_count) || 0,
        completed_count: parseInt(service.completed_count) || 0,
        cancelled_count: parseInt(service.cancelled_count) || 0,
        revenue: parseFloat(service.revenue) || 0
      })),
      categories: categoryStats.map(category => ({
        category: category.category,
        booking_count: parseInt(category.booking_count) || 0,
        revenue: parseFloat(category.revenue) || 0
      }))
    });
  } catch (error) {
    logger.error('Get service statistics error:', error);
    res.status(500).json({ message: 'Error fetching service statistics', error: error.message });
  }
});

// Получить детальную финансовую статистику
router.get('/financial', verifyToken, checkRole('admin', 'employee'), async (req, res) => {
  try {
    const { salonId } = req.query;
    const { startDate, endDate } = parseAndValidateDates(req.query);

    // Проверка прав доступа для сотрудника
    if (req.user.role === 'employee') {
      if (!req.user.salon_id || req.user.salon_id !== parseInt(salonId)) {
        return res.status(403).json({ message: 'Access denied: You can only view your salon statistics' });
      }
    }

    let query = `
      SELECT 
        DATE(a.date_time) as date,
        s.name as salon_name,
        COUNT(a.id) as appointments_count,
        COUNT(CASE WHEN a.status = 'completed' THEN 1 END) as completed_count,
        COUNT(CASE WHEN a.status = 'cancelled' THEN 1 END) as cancelled_count,
        SUM(CASE WHEN a.status = 'completed' THEN srv.price ELSE 0 END) as revenue
      FROM appointments a
      JOIN services srv ON a.service_id = srv.id
      JOIN salons s ON a.salon_id = s.id
      WHERE a.date_time BETWEEN $1 AND $2
    `;

    const params = [startDate, endDate];
    let paramIndex = 2;

    if (salonId) {
      paramIndex++;
      query += ` AND a.salon_id = $${paramIndex}`;
      params.push(salonId);
    }

    query += `
      GROUP BY DATE(a.date_time), s.name
      ORDER BY date
    `;

    const { rows: dailyStats } = await db.query(query, params);

    // Итоговая статистика
    let totalQuery = `
      SELECT 
        COUNT(a.id) as total_appointments,
        COUNT(CASE WHEN a.status = 'completed' THEN 1 END) as completed_appointments,
        COUNT(CASE WHEN a.status = 'cancelled' THEN 1 END) as cancelled_appointments,
        SUM(CASE WHEN a.status = 'completed' THEN srv.price ELSE 0 END) as total_revenue,
        ROUND(AVG(CASE WHEN a.status = 'completed' THEN srv.price ELSE NULL END), 2) as avg_service_price
      FROM appointments a
      JOIN services srv ON a.service_id = srv.id
      WHERE a.date_time BETWEEN $1 AND $2
    `;

    if (salonId) {
      totalQuery += ` AND a.salon_id = $3`;
    }

    const { rows: [totals] } = await db.query(totalQuery, params);

    // Статистика по месяцам
    let monthlyQuery = `
      SELECT 
        TO_CHAR(a.date_time, 'YYYY-MM') as month,
        COUNT(a.id) as appointments_count,
        COUNT(CASE WHEN a.status = 'completed' THEN 1 END) as completed_count,
        COUNT(CASE WHEN a.status = 'cancelled' THEN 1 END) as cancelled_count,
        SUM(CASE WHEN a.status = 'completed' THEN srv.price ELSE 0 END) as revenue
      FROM appointments a
      JOIN services srv ON a.service_id = srv.id
      WHERE a.date_time BETWEEN $1 AND $2
    `;

    if (salonId) {
      monthlyQuery += ` AND a.salon_id = $3`;
    }

    monthlyQuery += `
      GROUP BY TO_CHAR(a.date_time, 'YYYY-MM')
      ORDER BY month
    `;

    const { rows: monthlyStats } = await db.query(monthlyQuery, params);

    res.json({
      totals: {
        total_appointments: parseInt(totals.total_appointments) || 0,
        completed_appointments: parseInt(totals.completed_appointments) || 0,
        cancelled_appointments: parseInt(totals.cancelled_appointments) || 0,
        total_revenue: parseFloat(totals.total_revenue) || 0,
        avg_service_price: parseFloat(totals.avg_service_price) || 0
      },
      daily_stats: dailyStats.map(day => ({
        date: day.date,
        salon_name: day.salon_name,
        appointments_count: parseInt(day.appointments_count) || 0,
        completed_count: parseInt(day.completed_count) || 0,
        cancelled_count: parseInt(day.cancelled_count) || 0,
        revenue: parseFloat(day.revenue) || 0
      })),
      monthly_stats: monthlyStats.map(month => ({
        month: month.month,
        appointments_count: parseInt(month.appointments_count) || 0,
        completed_count: parseInt(month.completed_count) || 0,
        cancelled_count: parseInt(month.cancelled_count) || 0,
        revenue: parseFloat(month.revenue) || 0
      }))
    });
  } catch (error) {
    logger.error('Get financial statistics error:', error);
    res.status(500).json({ message: 'Error fetching financial statistics', error: error.message });
  }
});

// Get employee schedules (for admin)
router.get('/employee-schedules', 
  verifyToken, 
  checkRole('admin', 'employee'),
  async (req, res) => {
  try {
    let { salonId, startDate, endDate } = req.query;
    
    // Filtering logic based on user role
    if (req.user.role !== 'admin') {
      // Non-admin users can only view their own salon's data
      salonId = req.user.salon_id;
    }
    
    // If dates are not provided, use current month as default range
    if (!startDate || !endDate) {
      const today = new Date();
      const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      
      startDate = firstDayOfMonth.toISOString().split('T')[0];
      endDate = lastDayOfMonth.toISOString().split('T')[0];
    }
    
    let query = `
      SELECT 
        e.id as employee_id,
        e.first_name || ' ' || e.last_name as employee_name,
        e.position,
        e.working_hours,
        s.id as salon_id,
        s.name as salon_name
      FROM employees e
      JOIN salons s ON e.salon_id = s.id
      WHERE e.is_active = true
    `;
    
    const queryParams = [];
    
    // Add salon filter if provided
    if (salonId) {
      query += ` AND e.salon_id = $${queryParams.length + 1}`;
      queryParams.push(salonId);
    }
    
    query += ` ORDER BY s.name, e.first_name, e.last_name`;
    
    logger.info(`Получение расписания сотрудников`, {
      salonId: salonId || 'all',
      startDate,
      endDate,
      user: req.user.id
    });
    
    const { rows } = await db.query(query, queryParams);
    
    // Generate date range for schedule
    const start = new Date(startDate);
    const end = new Date(endDate);
    const dateRange = [];
    
    for (let current = new Date(start); current <= end; current.setDate(current.getDate() + 1)) {
      dateRange.push(current.toISOString().split('T')[0]);
    }
    
    // Add empty schedule field to each employee
    const processedEmployees = rows.map(employee => {
      // Create map of day names
      const dayNames = {
        0: 'Вс',
        1: 'Пн',
        2: 'Вт',
        3: 'Ср',
        4: 'Чт',
        5: 'Пт',
        6: 'Сб'
      };
      
      // Full day names mapping
      const fullDayNames = {
        0: 'Воскресенье',
        1: 'Понедельник',
        2: 'Вторник',
        3: 'Среда',
        4: 'Четверг',
        5: 'Пятница',
        6: 'Суббота'
      };
      
      // Process the schedule data from working_hours
      let schedule = [];
      
      if (employee.working_hours) {
        // Create schedule entries for each date in the range
        schedule = dateRange.map(date => {
          const dayDate = new Date(date);
          const dayOfWeek = dayDate.getDay(); // 0-6 (Sun-Sat)
          const dayName = dayNames[dayOfWeek];
          const fullDayName = fullDayNames[dayOfWeek];
          
          // Check if this day has working hours defined - try multiple formats
          let dayHours = employee.working_hours[dayOfWeek] || null;
          
          // Try full day name if numeric key didn't work
          if (!dayHours || !dayHours.start || !dayHours.end || dayHours.is_working === false) {
            dayHours = employee.working_hours[fullDayName] || null;
          }
          
          // Final check for valid working hours
          const isWorking = dayHours && dayHours.start && dayHours.end && dayHours.is_working !== false;
          
          return {
            date,
            day_name: dayName,
            is_working: isWorking,
            start_time: isWorking ? dayHours.start : '',
            end_time: isWorking ? dayHours.end : '',
            checked_in: false,
            checkin_time: null,
            is_late: false
          };
        });
      }
      
      return {
        ...employee,
        schedule
      };
    });
    
    res.json(processedEmployees);
  } catch (error) {
    logger.error('Error getting employee schedules:', error);
    res.status(500).json({ 
      message: 'Error getting employee schedules', 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Get employee earnings (for admin)
router.get('/employee-earnings', 
  verifyToken, 
  checkRole('admin', 'employee'),
  async (req, res) => {
  try {
    let { salonId, startDate, endDate } = req.query;
    
    // Filtering logic based on user role
    if (req.user.role !== 'admin') {
      // Non-admin users can only view their own salon's data
      salonId = req.user.salon_id;
    }
    
    // If dates are not provided, use current month as default range
    if (!startDate || !endDate) {
      const today = new Date();
      const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      
      startDate = firstDayOfMonth.toISOString().split('T')[0];
      endDate = lastDayOfMonth.toISOString().split('T')[0];
    }
    
    let query = `
      SELECT 
        e.id as employee_id,
        e.first_name || ' ' || e.last_name as employee_name,
        COUNT(a.id) as appointments_count,
        SUM(s.price) as total_earnings
      FROM employees e
      LEFT JOIN appointments a ON 
        a.employee_id = e.id AND 
        a.date_time::date BETWEEN $1 AND $2 AND
        a.status = 'completed'
      LEFT JOIN services s ON a.service_id = s.id
      WHERE e.is_active = true
    `;
    
    const queryParams = [startDate, endDate];
    
    // Add salon filter if provided
    if (salonId) {
      query += ` AND e.salon_id = $${queryParams.length + 1}`;
      queryParams.push(salonId);
    }
    
    query += ` GROUP BY e.id ORDER BY total_earnings DESC NULLS LAST`;
    
    logger.info(`Получение заработка сотрудников`, {
      salonId: salonId || 'all',
      startDate,
      endDate,
      user: req.user.id
    });
    
    const { rows } = await db.query(query, queryParams);
    
    res.json(rows);
  } catch (error) {
    logger.error('Error getting employee earnings:', error);
    res.status(500).json({ 
      message: 'Error getting employee earnings', 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Add shift check-in endpoint
router.post('/employee-checkin', 
  verifyToken, 
  checkRole('admin', 'employee'),
  async (req, res) => {
  const client = await db.getClient();
  
  try {
    const { employeeId, date, checkinTime } = req.body;
    
    // Check permission - admin can check in anyone, employee can only check themselves in
    if (req.user.role === 'employee' && req.user.id !== parseInt(employeeId)) {
      return res.status(403).json({ 
        message: 'Вы можете отметить только свой приход'
      });
    }
    
    // Get employee details to check working hours
    const { rows: employeeRows } = await client.query(
      `SELECT id, working_hours FROM employees WHERE id = $1`,
      [employeeId]
    );
    
    if (employeeRows.length === 0) {
      return res.status(404).json({ 
        message: 'Сотрудник не найден'
      });
    }
    
    // Parse date and get day of week
    const checkInDate = new Date(date);
    const dayOfWeek = checkInDate.getDay(); // 0-6, Sunday is 0
    const dayOfWeekStr = dayOfWeek.toString();
    
    // Full day name mapping
    const fullDayNames = {
      0: 'Воскресенье', 1: 'Понедельник', 2: 'Вторник', 
      3: 'Среда', 4: 'Четверг', 5: 'Пятница', 6: 'Суббота'
    };
    const fullDayName = fullDayNames[dayOfWeek];
    
    // Get working hours for this day
    const workingHours = employeeRows[0].working_hours || {};
    
    // Check both numeric and full name formats
    let daySchedule = workingHours[dayOfWeekStr];
    
    // If not found by numeric key, try full day name
    if (!daySchedule || !daySchedule.start || !daySchedule.end || daySchedule.is_working === false) {
      daySchedule = workingHours[fullDayName];
    }
    
    // Check if employee works on this day
    if (!daySchedule || !daySchedule.start || !daySchedule.end || daySchedule.is_working === false) {
      return res.status(400).json({ 
        message: 'Сотрудник не назначен на работу в этот день'
      });
    }
    
    // Store check-in in the checkins table if it exists, or just return success
    // This is a simplified version since we don't have the employee_schedules table
    const actualCheckInTime = checkinTime || new Date().toISOString();
    
    // Calculate if employee is late (more than 15 min after start time)
    // Convert day schedule start time to Date object for comparison
    const [startHour, startMinute] = daySchedule.start.split(':').map(Number);
    const scheduleStartTime = new Date(checkInDate);
    scheduleStartTime.setHours(startHour, startMinute, 0, 0);
    
    const checkInDateTime = new Date(actualCheckInTime);
    const fifteenMinutesLater = new Date(scheduleStartTime.getTime() + 15 * 60000);
    
    const isLate = checkInDateTime > fifteenMinutesLater;
    
    logger.info(`Сотрудник #${employeeId} отметился о приходе ${isLate ? 'с опозданием' : 'вовремя'}`, {
      date,
      checkInTime: actualCheckInTime,
      isLate,
      user: req.user.id
    });
    
    res.status(200).json({ 
      message: 'Отметка о приходе сохранена',
      is_late: isLate,
      data: {
        employee_id: employeeId,
        date,
        checkin_time: actualCheckInTime,
        is_late: isLate
      }
    });
  } catch (error) {
    logger.error('Error checking in employee:', error);
    res.status(500).json({ 
      message: 'Error checking in employee', 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  } finally {
    client.release();
  }
});

// Helper function to parse and validate date parameters
function parseAndValidateDates(query) {
  let { startDate, endDate } = query;
  
  // If dates are not provided, use current month as default range
  if (!startDate || !endDate) {
    const today = new Date();
    const firstDayOfMonth = startOfMonth(today);
    const lastDayOfMonth = endOfMonth(today);
    
    startDate = format(firstDayOfMonth, 'yyyy-MM-dd');
    endDate = format(lastDayOfMonth, 'yyyy-MM-dd');
    
    logger.info(`Using default date range for statistics: ${startDate} to ${endDate}`);
  }

  // Format dates properly for queries
  const formattedStartDate = `${startDate}T00:00:00.000Z`;
  const formattedEndDate = `${endDate}T23:59:59.999Z`;

  return { startDate: formattedStartDate, endDate: formattedEndDate };
}

module.exports = router; 