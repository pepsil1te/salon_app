const express = require('express');
const router = express.Router();
const db = require('../config/database');
const logger = require('../config/logger');
const { verifyToken, checkRole } = require('../middleware/auth');

// Получение профиля пользователя
router.get('/profile', verifyToken, async (req, res) => {
  try {
    // В зависимости от роли получаем данные из соответствующей таблицы
    let userData = null;
    
    if (req.user.role === 'client') {
      const { rows } = await db.query(
        `SELECT 
           c.id, 
           c.name, 
           c.contact_info, 
           c.birth_date, 
           c.preferences,
           c.contact_info->>'email' as email,
           c.contact_info->>'phone' as phone
         FROM clients c
         WHERE c.id = $1`,
        [req.user.id]
      );
      
      if (rows.length > 0) {
        userData = rows[0];
        
        // Проверка наличия полей для обратной совместимости
        userData.email = userData.email || (userData.contact_info && userData.contact_info.email);
        userData.phone = userData.phone || (userData.contact_info && userData.contact_info.phone);
        
        // Преобразование даты рождения в формат строки, если она есть
        if (userData.birth_date) {
          userData.birth_date = userData.birth_date.toISOString().split('T')[0];
        }
      }
    } else if (req.user.role === 'employee') {
      const { rows } = await db.query(
        `SELECT 
           e.id, 
           e.name, 
           e.contact_info->>'email' as email,
           e.contact_info->>'phone' as phone,
           e.salon_id, 
           e.position, 
           e.bio, 
           s.name as salon_name
         FROM employees e
         JOIN salons s ON e.salon_id = s.id
         WHERE e.id = $1`,
        [req.user.id]
      );
      userData = rows[0];
    } else if (req.user.role === 'admin') {
      const { rows } = await db.query(
        `SELECT 
           a.id, 
           a.name, 
           a.contact_info->>'email' as email
         FROM admins a
         WHERE a.id = $1`,
        [req.user.id]
      );
      userData = rows[0];
    }

    if (!userData) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Добавляем роль из токена
    userData.role = req.user.role;
    
    res.json(userData);
  } catch (error) {
    logger.error('Get user profile error:', error);
    res.status(500).json({ message: 'Error fetching user profile', error: error.message });
  }
});

// Обновление профиля пользователя
router.put('/profile', verifyToken, async (req, res) => {
  try {
    const { name, email, phone, birth_date, preferences } = req.body;
    let updatedUser = null;
    
    if (req.user.role === 'client') {
      // Сначала получаем текущие данные пользователя для обновления contact_info
      const { rows: [currentUser] } = await db.query(
        `SELECT contact_info FROM clients WHERE id = $1`,
        [req.user.id]
      );
      
      if (!currentUser) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Создаем обновленный объект contact_info
      const currentContactInfo = currentUser.contact_info || {};
      const updatedContactInfo = {
        ...currentContactInfo
      };
      
      // Обновляем email и phone, если они указаны
      if (email) updatedContactInfo.email = email;
      if (phone) updatedContactInfo.phone = phone;
      
      // Обновляем данные пользователя
      const { rows } = await db.query(
        `UPDATE clients
         SET 
           name = COALESCE($1, name),
           contact_info = COALESCE($2, contact_info),
           birth_date = COALESCE($3, birth_date),
           preferences = COALESCE($4, preferences)
         WHERE id = $5
         RETURNING id, name, contact_info, birth_date, preferences`,
        [name, JSON.stringify(updatedContactInfo), birth_date, preferences, req.user.id]
      );
      
      if (rows.length > 0) {
        updatedUser = rows[0];
        
        // Добавляем поля email и phone из contact_info для удобства на фронтенде
        updatedUser.email = updatedUser.contact_info && updatedUser.contact_info.email;
        updatedUser.phone = updatedUser.contact_info && updatedUser.contact_info.phone;
        
        // Форматируем дату рождения
        if (updatedUser.birth_date) {
          updatedUser.birth_date = updatedUser.birth_date.toISOString().split('T')[0];
        }
      }
    } else if (req.user.role === 'employee') {
      const { bio } = req.body;
      
      // Сначала получаем текущие данные сотрудника
      const { rows: [currentEmployee] } = await db.query(
        `SELECT contact_info FROM employees WHERE id = $1`,
        [req.user.id]
      );
      
      if (!currentEmployee) {
        return res.status(404).json({ message: 'Employee not found' });
      }
      
      // Создаем обновленный объект contact_info
      const currentContactInfo = currentEmployee.contact_info || {};
      const updatedContactInfo = {
        ...currentContactInfo
      };
      
      // Обновляем email, если он указан
      if (email) updatedContactInfo.email = email;
      if (phone) updatedContactInfo.phone = phone;
      
      const { rows } = await db.query(
        `UPDATE employees
         SET 
           name = COALESCE($1, name),
           contact_info = COALESCE($2, contact_info),
           bio = COALESCE($3, bio)
         WHERE id = $4
         RETURNING id, name, contact_info, salon_id, position, bio`,
        [name, JSON.stringify(updatedContactInfo), bio, req.user.id]
      );
      
      if (rows.length > 0) {
        updatedUser = rows[0];
        
        // Добавляем поля email и phone из contact_info
        updatedUser.email = updatedUser.contact_info && updatedUser.contact_info.email;
        updatedUser.phone = updatedUser.contact_info && updatedUser.contact_info.phone;
      }
    } else if (req.user.role === 'admin') {
      // Сначала получаем текущие данные админа
      const { rows: [currentAdmin] } = await db.query(
        `SELECT contact_info FROM admins WHERE id = $1`,
        [req.user.id]
      );
      
      if (!currentAdmin) {
        return res.status(404).json({ message: 'Admin not found' });
      }
      
      // Создаем обновленный объект contact_info
      const currentContactInfo = currentAdmin.contact_info || {};
      const updatedContactInfo = {
        ...currentContactInfo
      };
      
      // Обновляем email, если он указан
      if (email) updatedContactInfo.email = email;
      
      const { rows } = await db.query(
        `UPDATE admins
         SET 
           name = COALESCE($1, name),
           contact_info = COALESCE($2, contact_info)
         WHERE id = $3
         RETURNING id, name, contact_info`,
        [name, JSON.stringify(updatedContactInfo), req.user.id]
      );
      
      if (rows.length > 0) {
        updatedUser = rows[0];
        
        // Добавляем поле email из contact_info
        updatedUser.email = updatedUser.contact_info && updatedUser.contact_info.email;
      }
    }
    
    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Добавляем роль из токена
    updatedUser.role = req.user.role;
    
    res.json(updatedUser);
  } catch (error) {
    logger.error('Update user profile error:', error);
    res.status(500).json({ message: 'Error updating user profile', error: error.message });
  }
});

// Получение статистики клиента
router.get('/client/stats', verifyToken, async (req, res) => {
  try {
    // Получаем ID пользователя из токена
    const userId = req.user.id;
    
    // Объект для хранения результатов
    const stats = {
      totalVisits: 0,
      bonusPoints: 0,
      favoriteSalon: null
    };
    
    try {
      // Получаем основную статистику: общее количество визитов
      const { rows: [totalVisits] } = await db.query(
        `SELECT COUNT(*) as total_visits
         FROM appointments
         WHERE client_id = $1
         AND status = 'completed'`,
        [userId]
      );
      
      stats.totalVisits = parseInt(totalVisits.total_visits, 10);
    } catch (error) {
      logger.warn('Error getting total visits, may be missing table:', error.message);
      // Продолжаем выполнение, не прерывая запрос
    }
    
    try {
      // Получаем сумму бонусных баллов клиента
      const { rows: [bonusPoints] } = await db.query(
        `SELECT COALESCE(SUM(points), 0) as bonus_points
         FROM client_bonuses
         WHERE client_id = $1`,
        [userId]
      );
      
      stats.bonusPoints = parseInt(bonusPoints.bonus_points, 10);
    } catch (error) {
      logger.warn('Error getting bonus points, may be missing table:', error.message);
      // Продолжаем выполнение, не прерывая запрос
    }
    
    try {
      // Получаем любимый салон (с наибольшим количеством посещений)
      const { rows: favoriteSalons } = await db.query(
        `SELECT s.id, s.name, COUNT(*) as visit_count
         FROM appointments a
         JOIN salons s ON a.salon_id = s.id
         WHERE a.client_id = $1
         AND a.status = 'completed'
         GROUP BY s.id, s.name
         ORDER BY visit_count DESC
         LIMIT 1`,
        [userId]
      );
      
      if (favoriteSalons.length > 0) {
        stats.favoriteSalon = favoriteSalons[0];
      }
    } catch (error) {
      logger.warn('Error getting favorite salon, may be missing table:', error.message);
      // Продолжаем выполнение, не прерывая запрос
    }
    
    res.json(stats);
  } catch (error) {
    logger.error('Get client stats error:', error);
    res.status(500).json({ message: 'Error fetching client statistics', error: error.message });
  }
});

// Изменение пароля
router.put('/change-password', verifyToken, async (req, res) => {
  try {
    const { current_password, new_password } = req.body;
    
    if (!current_password || !new_password) {
      return res.status(400).json({ message: 'Current password and new password are required' });
    }
    
    const bcrypt = require('bcrypt');
    
    // Получаем текущий хэш пароля пользователя в зависимости от роли
    let table = '';
    if (req.user.role === 'client') table = 'clients';
    else if (req.user.role === 'employee') table = 'employees';
    else if (req.user.role === 'admin') table = 'admins';
    
    const { rows } = await db.query(
      `SELECT password FROM ${table} WHERE id = $1`,
      [req.user.id]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Проверяем текущий пароль
    const passwordMatches = await bcrypt.compare(current_password, rows[0].password);
    if (!passwordMatches) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }
    
    // Хэшируем новый пароль
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(new_password, saltRounds);
    
    // Обновляем пароль в базе данных
    await db.query(
      `UPDATE ${table} SET password = $1 WHERE id = $2`,
      [hashedPassword, req.user.id]
    );
    
    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    logger.error('Change password error:', error);
    res.status(500).json({ message: 'Error changing password' });
  }
});

module.exports = router; 