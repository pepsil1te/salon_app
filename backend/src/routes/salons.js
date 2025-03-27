const express = require('express');
const router = express.Router();
const db = require('../config/database');
const logger = require('../config/logger');
const { verifyToken, checkRole, checkSalonAccess } = require('../middleware/auth');
const { cache, invalidate } = require('../middleware/cache');
const { asyncHandler } = require('../utils/routeHelpers');

// Get all salons (public)
router.get('/', cache(), asyncHandler(async (req, res) => {
  logger.info('Получение списка всех салонов');
  
  const { rows } = await db.query(
    `SELECT s.id, s.name, s.address, s.contact_info, s.working_hours, s.status, 
            s.image_url, s.description, s.created_at, s.updated_at,
            (SELECT COUNT(*) FROM services WHERE salon_id = s.id) as services_count,
            (SELECT COUNT(*) FROM employees WHERE salon_id = s.id) as employees_count
     FROM salons s
     ORDER BY s.name`
  );
  
  logger.info(`Получено ${rows.length} салонов из базы данных`);
  // Всегда возвращаем данные из БД, даже если это пустой массив
  res.json(rows);
}));

// Get salon by ID (public)
router.get('/:id', cache(), asyncHandler(async (req, res) => {
  const salonId = parseInt(req.params.id);
  logger.info(`Получение информации о салоне #${salonId}`);
  
  const { rows } = await db.query(
    `SELECT s.id, s.name, s.address, s.contact_info, s.working_hours, s.status, 
            s.image_url, s.description, s.created_at, s.updated_at,
            (SELECT COUNT(*) FROM services WHERE salon_id = s.id) as services_count,
            (SELECT COUNT(*) FROM employees WHERE salon_id = s.id) as employees_count
     FROM salons s
     WHERE s.id = $1`, 
    [salonId]
  );
  
  if (rows.length === 0) {
    logger.warn(`Салон #${salonId} не найден в базе данных`);
    return res.status(404).json({ message: 'Salon not found' });
  }
  
  res.json(rows[0]);
}));

// Create new salon (admin only)
router.post('/', 
  verifyToken, 
  checkRole('admin'), 
  async (req, res) => {
  try {
    logger.info('Создание нового салона', { user: req.user?.userId });
    
    const { name, address, contact_info, working_hours, status, image_url, description } = req.body;

    // SQL-запрос с поддержкой дополнительных полей
    const { rows } = await db.query(
      `INSERT INTO salons (name, address, contact_info, working_hours, status, image_url, description)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [name, address, contact_info, working_hours, status || 'active', image_url || null, description || null]
    );

    logger.info(`Новый салон #${rows[0].id} успешно создан`);
    res.status(201).json(rows[0]);
  } catch (error) {
    logger.error('Create salon error:', error);
    res.status(500).json({ message: 'Error creating salon', error: error.message });
  }
});

// Update salon (admin only)
router.put('/:id', 
  verifyToken, 
  checkRole('admin'), 
  async (req, res) => {
  const client = await db.getClient();
  
  try {
    const salonId = req.params.id;
    const { name, address, contact_info, working_hours, status, image_url, description } = req.body;
    
    logger.info(`Обновление салона #${salonId}`, { 
      user: req.user?.userId,
      body: JSON.stringify(req.body)
    });

    // Проверяем, что working_hours имеет правильный формат
    if (working_hours && typeof working_hours !== 'object') {
      logger.error(`Неверный формат working_hours для салона #${salonId}:`, working_hours);
      return res.status(400).json({ message: 'working_hours должен быть объектом' });
    }
    
    // Начинаем транзакцию
    await client.query('BEGIN');
    
    // Проверяем существование салона
    const checkResult = await client.query(
      'SELECT id FROM salons WHERE id = $1',
      [salonId]
    );
    
    if (checkResult.rows.length === 0) {
      await client.query('ROLLBACK');
      logger.warn(`Салон #${salonId} не найден для обновления`);
      return res.status(404).json({ message: 'Salon not found' });
    }

    // Обновляем данные салона
    const { rows } = await client.query(
      `UPDATE salons
       SET name = $1, 
           address = $2, 
           contact_info = $3, 
           working_hours = $4,
           status = $5,
           image_url = $6,
           description = $7
       WHERE id = $8
       RETURNING *`,
      [name, address, contact_info, working_hours, status || 'active', image_url, description, salonId]
    );
    
    // Фиксируем транзакцию
    await client.query('COMMIT');
    
    logger.info(`Салон #${salonId} успешно обновлен:`, rows[0]);
    res.json(rows[0]);
  } catch (error) {
    // Откатываем транзакцию в случае ошибки
    await client.query('ROLLBACK');
    logger.error('Update salon error:', error);
    res.status(500).json({ message: 'Error updating salon', error: error.message });
  } finally {
    // Освобождаем клиент
    client.release();
  }
});

// Delete salon (admin only)
router.delete('/:id', 
  verifyToken, 
  checkRole('admin'), 
  async (req, res) => {
  try {
    logger.info(`Удаление салона #${req.params.id}`, { user: req.user?.userId });
    
    const { rows } = await db.query(
      'DELETE FROM salons WHERE id = $1 RETURNING *',
      [req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Salon not found' });
    }

    logger.info(`Салон #${req.params.id} успешно удален`);
    res.json({ message: 'Salon deleted successfully' });
  } catch (error) {
    logger.error('Delete salon error:', error);
    res.status(500).json({ message: 'Error deleting salon', error: error.message });
  }
});

// Get salon statistics (admin and salon employees)
router.get('/:id/statistics', 
  verifyToken, 
  checkRole('admin', 'employee'), 
  checkSalonAccess, 
  async (req, res) => {
  try {
    const salonId = req.params.id;
    let { startDate, endDate } = req.query;
    
    // If dates are not provided, use current month as default range
    if (!startDate || !endDate) {
      const today = new Date();
      const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      
      startDate = firstDayOfMonth.toISOString().split('T')[0];
      endDate = lastDayOfMonth.toISOString().split('T')[0];
      
      logger.info(`Using default date range for salon statistics: ${startDate} to ${endDate}`);
    }

    // Get total appointments
    const { rows: appointmentStats } = await db.query(
      `SELECT 
        COUNT(*) as total_appointments,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_appointments,
        COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_appointments,
        SUM(CASE WHEN status = 'completed' THEN s.price ELSE 0 END) as total_revenue
       FROM appointments a
       JOIN services s ON a.service_id = s.id
       WHERE a.salon_id = $1
       AND a.date_time BETWEEN $2 AND $3`,
      [salonId, startDate, endDate]
    );

    // Get popular services
    const { rows: popularServices } = await db.query(
      `SELECT 
        s.name,
        COUNT(*) as booking_count,
        SUM(s.price) as total_revenue
       FROM appointments a
       JOIN services s ON a.service_id = s.id
       WHERE a.salon_id = $1
       AND a.date_time BETWEEN $2 AND $3
       AND a.status = 'completed'
       GROUP BY s.id, s.name
       ORDER BY booking_count DESC
       LIMIT 5`,
      [salonId, startDate, endDate]
    );

    res.json({
      appointment_stats: appointmentStats[0],
      popular_services: popularServices
    });
  } catch (error) {
    logger.error('Get salon statistics error:', error);
    res.status(500).json({ message: 'Error fetching salon statistics', error: error.message });
  }
});

module.exports = router; 