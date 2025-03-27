require('dotenv').config();
const db = require('../src/config/database');
const logger = require('../src/config/logger');

/**
 * Утилита для исправления названия салона с ID=2
 * Запуск: node backend/tools/fixSalonName.js
 */
async function fixSalonName() {
  const client = await db.getClient();
  
  try {
    const salonId = 2;
    const correctName = 'Барбершоп "Бородач"';
    
    logger.info(`Исправление названия салона #${salonId} на "${correctName}"...`);
    
    // Получаем текущие данные
    const currentData = await client.query(
      'SELECT * FROM salons WHERE id = $1',
      [salonId]
    );
    
    if (currentData.rows.length === 0) {
      logger.error(`Салон с ID ${salonId} не найден`);
      return;
    }
    
    const oldName = currentData.rows[0].name;
    logger.info(`Текущее название: "${oldName}"`);
    
    // Начинаем транзакцию
    await client.query('BEGIN');
    
    // Обновляем название
    const result = await client.query(`
      UPDATE salons 
      SET name = $1, 
          updated_at = NOW() 
      WHERE id = $2 
      RETURNING *
    `, [correctName, salonId]);
    
    // Проверяем, что обновление прошло успешно
    if (result.rows.length === 0) {
      logger.error('Ошибка обновления: салон не найден или не обновлен');
      await client.query('ROLLBACK');
      return;
    }
    
    // Фиксируем изменения
    await client.query('COMMIT');
    
    logger.info(`Название салона успешно исправлено: "${oldName}" -> "${correctName}"`);
    
    // Проверяем, что изменения действительно сохранились
    const verification = await client.query(
      'SELECT name FROM salons WHERE id = $1',
      [salonId]
    );
    
    if (verification.rows.length > 0) {
      logger.info(`Проверка: текущее название в БД: "${verification.rows[0].name}"`);
    }
    
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Ошибка при исправлении названия салона:', error);
  } finally {
    client.release();
    process.exit(0);
  }
}

fixSalonName(); 