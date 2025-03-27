require('dotenv').config();
const db = require('../src/config/database');
const logger = require('../src/config/logger');

/**
 * Утилита для получения всех салонов из базы данных
 * Запуск: node backend/tools/getSalons.js
 */
async function getSalons() {
  const client = await db.getClient();
  
  try {
    logger.info('Получение всех салонов из базы данных...');
    
    // Получаем все салоны
    const result = await client.query('SELECT * FROM salons ORDER BY id');
    
    if (result.rows.length === 0) {
      logger.info('В базе данных нет салонов');
      return;
    }
    
    logger.info(`Найдено ${result.rows.length} салонов:`);
    
    // Выводим подробную информацию о каждом салоне
    result.rows.forEach((salon, index) => {
      logger.info(`\n--- Салон #${salon.id} ---`);
      logger.info(`Название: "${salon.name}"`);
      logger.info(`Адрес: ${salon.address}`);
      logger.info(`Контактная информация: ${JSON.stringify(salon.contact_info)}`);
      logger.info(`Рабочие часы: ${JSON.stringify(salon.working_hours)}`);
      logger.info(`Статус: ${salon.status || 'не указан'}`);
      logger.info(`URL изображения: ${salon.image_url || 'не указан'}`);
      logger.info(`Описание: ${salon.description || 'не указано'}`);
      logger.info(`Создан: ${salon.created_at}`);
      logger.info(`Обновлен: ${salon.updated_at}`);
    });
    
  } catch (error) {
    logger.error('Ошибка при получении салонов:', error);
  } finally {
    client.release();
    process.exit(0);
  }
}

getSalons(); 