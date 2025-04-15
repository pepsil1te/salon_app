const express = require('express');
const router = express.Router();
const db = require('../config/database');
const logger = require('../config/logger');
const { verifyToken, checkRole } = require('../middleware/auth');

// Получение списка избранных салонов клиента
router.get('/salons', verifyToken, async (req, res) => {
  try {
    // Сначала проверим, есть ли записи в таблице избранных салонов для данного пользователя
    const { rows: favoriteCheck } = await db.query(
      `SELECT COUNT(*) as count FROM favorite_salons WHERE client_id = $1`,
      [req.user.id]
    );
    
    // Если записей нет, сразу возвращаем пустой массив
    if (parseInt(favoriteCheck[0].count) === 0) {
      return res.json([]);
    }
    
    // Если есть записи, делаем запрос на получение информации о салонах
    const { rows } = await db.query(
      `SELECT s.id, s.name, s.address, s.contact_info, s.description, s.working_hours, s.image_url
       FROM salons s
       JOIN favorite_salons fs ON s.id = fs.salon_id
       WHERE fs.client_id = $1
       ORDER BY s.name`,
      [req.user.id]
    );
    
    // Преобразуем данные, добавляя фиктивный рейтинг и извлекая телефон из contact_info
    const salonsWithRating = rows.map(salon => {
      // Извлекаем телефон из contact_info, если он есть
      const phone = salon.contact_info && salon.contact_info.phone 
        ? salon.contact_info.phone 
        : null;
        
      return {
        ...salon,
        phone: phone,
        rating: 0,
        reviews_count: 0
      };
    });
    
    res.json(salonsWithRating);
  } catch (error) {
    logger.error('Get favorite salons error:', error);
    res.status(500).json({ message: 'Error fetching favorite salons', error: error.message });
  }
});

// Добавление салона в избранное
router.post('/salons', verifyToken, async (req, res) => {
  try {
    const { salon_id } = req.body;
    
    if (!salon_id) {
      return res.status(400).json({ message: 'Salon ID is required' });
    }
    
    // Проверяем, существует ли салон
    const { rows: [salon] } = await db.query(
      'SELECT id FROM salons WHERE id = $1',
      [salon_id]
    );
    
    if (!salon) {
      return res.status(404).json({ message: 'Salon not found' });
    }
    
    // Проверяем, есть ли уже такая запись в избранном
    const { rows: existing } = await db.query(
      'SELECT id FROM favorite_salons WHERE client_id = $1 AND salon_id = $2',
      [req.user.id, salon_id]
    );
    
    if (existing.length > 0) {
      return res.status(400).json({ message: 'Salon is already in favorites' });
    }
    
    // Добавляем салон в избранное
    await db.query(
      'INSERT INTO favorite_salons (client_id, salon_id) VALUES ($1, $2)',
      [req.user.id, salon_id]
    );
    
    res.status(201).json({ message: 'Salon added to favorites' });
  } catch (error) {
    logger.error('Add favorite salon error:', error);
    res.status(500).json({ message: 'Error adding salon to favorites' });
  }
});

// Удаление салона из избранного
router.delete('/salons/:id', verifyToken, async (req, res) => {
  try {
    const salon_id = req.params.id;
    
    // Удаляем салон из избранного
    const { rowCount } = await db.query(
      'DELETE FROM favorite_salons WHERE client_id = $1 AND salon_id = $2',
      [req.user.id, salon_id]
    );
    
    if (rowCount === 0) {
      return res.status(404).json({ message: 'Salon not found in favorites' });
    }
    
    res.json({ message: 'Salon removed from favorites' });
  } catch (error) {
    logger.error('Remove favorite salon error:', error);
    res.status(500).json({ message: 'Error removing salon from favorites' });
  }
});

// Проверка, находится ли салон в избранном
router.get('/salons/check/:id', verifyToken, async (req, res) => {
  try {
    const salon_id = req.params.id;
    
    const { rows } = await db.query(
      'SELECT id FROM favorite_salons WHERE client_id = $1 AND salon_id = $2',
      [req.user.id, salon_id]
    );
    
    const isFavorite = rows.length > 0;
    
    res.json({ isFavorite });
  } catch (error) {
    logger.error('Check favorite salon error:', error);
    res.status(500).json({ message: 'Error checking favorite status' });
  }
});

module.exports = router; 