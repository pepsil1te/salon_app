require('dotenv').config();
const db = require('../src/config/database');
const logger = require('../src/config/logger');

/**
 * Утилита для принудительного обновления названия салона
 * Запуск: node backend/tools/updateSalonName.js [salonId] [newName]
 */
async function updateSalonName() {
  const client = await db.getClient();
  
  try {
    // Получаем параметры командной строки
    const salonId = process.argv[2] || 2; // По умолчанию салон с ID=2
    const newName = process.argv[3] || 'Барбершоп "Бордач"'; // Новое название по умолчанию
    
    logger.info(`Принудительное обновление названия салона #${salonId} на "${newName}"...`);
    
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
    
    // Обновляем только название
    const result = await client.query(`
      UPDATE salons 
      SET name = $1, 
          updated_at = NOW() 
      WHERE id = $2 
      RETURNING *
    `, [newName, salonId]);
    
    // Проверяем, что обновление прошло успешно
    if (result.rows.length === 0) {
      logger.error('Ошибка обновления: салон не найден или не обновлен');
      await client.query('ROLLBACK');
      return;
    }
    
    // Фиксируем изменения
    await client.query('COMMIT');
    
    logger.info(`Название салона успешно обновлено: "${oldName}" -> "${newName}"`);
    
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
    logger.error('Ошибка при обновлении названия салона:', error);
  } finally {
    client.release();
    process.exit(0);
  }
}

updateSalonName(); 