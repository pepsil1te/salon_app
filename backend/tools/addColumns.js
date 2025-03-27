require('dotenv').config();
const db = require('../src/config/database');
const logger = require('../src/config/logger');

/**
 * Утилита для принудительного добавления колонок в таблицу salons
 * Запуск: node backend/tools/addColumns.js
 */
async function addColumns() {
  const client = await db.getClient();
  
  try {
    logger.info('Начало добавления колонок в таблицу salons...');
    
    await client.query('BEGIN');
    
    // Проверяем наличие колонки status
    const hasStatusColumn = await client.query(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'salons' AND column_name = 'status'
      )
    `);
    
    if (!hasStatusColumn.rows[0].exists) {
      logger.info('Добавление колонки status...');
      await client.query(`
        ALTER TABLE salons 
        ADD COLUMN status VARCHAR(20) DEFAULT 'active'
      `);
      logger.info('Колонка status успешно добавлена');
    } else {
      logger.info('Колонка status уже существует');
    }
    
    // Проверяем наличие колонки image_url
    const hasImageUrlColumn = await client.query(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'salons' AND column_name = 'image_url'
      )
    `);
    
    if (!hasImageUrlColumn.rows[0].exists) {
      logger.info('Добавление колонки image_url...');
      await client.query(`
        ALTER TABLE salons 
        ADD COLUMN image_url TEXT DEFAULT NULL
      `);
      logger.info('Колонка image_url успешно добавлена');
    } else {
      logger.info('Колонка image_url уже существует');
    }
    
    // Проверяем наличие колонки description
    const hasDescriptionColumn = await client.query(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'salons' AND column_name = 'description'
      )
    `);
    
    if (!hasDescriptionColumn.rows[0].exists) {
      logger.info('Добавление колонки description...');
      await client.query(`
        ALTER TABLE salons 
        ADD COLUMN description TEXT DEFAULT NULL
      `);
      logger.info('Колонка description успешно добавлена');
    } else {
      logger.info('Колонка description уже существует');
    }
    
    // Обновляем status для всех салонов где он NULL
    await client.query(`
      UPDATE salons 
      SET status = 'active' 
      WHERE status IS NULL
    `);
    
    await client.query('COMMIT');
    logger.info('Все необходимые колонки успешно добавлены и обновлены.');
    
    // Выводим текущую структуру таблицы
    const schemaResult = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'salons'
      ORDER BY ordinal_position
    `);
    
    logger.info('Текущая структура таблицы salons:');
    schemaResult.rows.forEach(column => {
      logger.info(`- ${column.column_name}: ${column.data_type}, ${column.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}${column.column_default ? `, DEFAULT: ${column.column_default}` : ''}`);
    });
    
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Ошибка при добавлении колонок:', error);
  } finally {
    client.release();
    process.exit(0);
  }
}

addColumns(); 