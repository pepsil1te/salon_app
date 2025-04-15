require('dotenv').config();
const db = require('../src/config/database');
const logger = require('../src/config/logger');

/**
 * Утилита для добавления таблицы категорий услуг в базу данных
 * Запуск: node backend/tools/add_service_categories_table.js
 */
async function addServiceCategoriesTable() {
  const client = await db.getClient();
  
  try {
    logger.info('Начало добавления таблицы категорий услуг...');
    
    await client.query('BEGIN');
    
    // Проверка существования таблицы
    const tableExists = await client.query(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'service_categories'
      )
    `);
    
    if (!tableExists.rows[0].exists) {
      logger.info('Создание таблицы service_categories...');
      await client.query(`
        CREATE TABLE service_categories (
          id SERIAL PRIMARY KEY,
          salon_id INTEGER REFERENCES salons(id) ON DELETE CASCADE,
          name VARCHAR(100) NOT NULL,
          description TEXT,
          color VARCHAR(20) DEFAULT '#3f51b5',
          sort_order INTEGER DEFAULT 0,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      // Добавление триггера для обновления updated_at
      await client.query(`
        CREATE TRIGGER update_service_categories_updated_at
        BEFORE UPDATE ON service_categories
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column()
      `);
      
      // Создание индекса
      await client.query(`
        CREATE INDEX idx_service_categories_salon_id ON service_categories(salon_id)
      `);
      
      logger.info('Таблица service_categories успешно создана');
      
      // Добавление связи с услугами - создаем колонку category_id
      const hasCategoryIdColumn = await client.query(`
        SELECT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'services' AND column_name = 'category_id'
        )
      `);
      
      if (!hasCategoryIdColumn.rows[0].exists) {
        logger.info('Добавление колонки category_id в таблицу services...');
        await client.query(`
          ALTER TABLE services 
          ADD COLUMN category_id INTEGER REFERENCES service_categories(id) ON DELETE SET NULL
        `);
        logger.info('Колонка category_id успешно добавлена');
      } else {
        logger.info('Колонка category_id уже существует в таблице services');
      }
      
    } else {
      logger.info('Таблица service_categories уже существует');
    }
    
    // Миграция существующих категорий из услуг
    logger.info('Миграция существующих категорий из услуг...');
    
    // Проверяем наличие колонки category_id в таблице services
    const hasCategoryIdColumn = await client.query(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'services' AND column_name = 'category_id'
      )
    `);
    
    if (!hasCategoryIdColumn.rows[0].exists) {
      logger.info('Добавление колонки category_id в таблицу services...');
      await client.query(`
        ALTER TABLE services 
        ADD COLUMN category_id INTEGER REFERENCES service_categories(id) ON DELETE SET NULL
      `);
      logger.info('Колонка category_id успешно добавлена');
    }
    
    // Получаем уникальные категории из услуг
    const uniqueCategories = await client.query(`
      SELECT DISTINCT salon_id, category 
      FROM services 
      WHERE category IS NOT NULL AND category != ''
      ORDER BY salon_id, category
    `);
    
    if (uniqueCategories.rows.length > 0) {
      logger.info(`Найдено ${uniqueCategories.rows.length} уникальных категорий для миграции`);
      
      // Создаем записи категорий для каждого уникального значения
      for (const [index, categoryData] of uniqueCategories.rows.entries()) {
        const { salon_id, category } = categoryData;
        
        // Проверяем, существует ли уже такая категория
        const existingCategory = await client.query(`
          SELECT id FROM service_categories 
          WHERE salon_id = $1 AND name = $2
        `, [salon_id, category]);
        
        if (existingCategory.rows.length === 0) {
          // Создаем новую категорию с генерацией цвета на основе имени
          const colorIndex = Math.abs(category.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0)) % 10;
          const colors = [
            '#673ab7', '#3f51b5', '#2196f3', '#009688', '#4caf50',
            '#8bc34a', '#cddc39', '#ffc107', '#ff9800', '#ff5722'
          ];
          const color = colors[colorIndex];
          
          const newCategory = await client.query(`
            INSERT INTO service_categories (salon_id, name, description, color, sort_order)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id
          `, [salon_id, category, `Автоматически созданная категория из "${category}"`, color, index]);
          
          // Обновляем услуги с этой категорией
          await client.query(`
            UPDATE services 
            SET category_id = $1
            WHERE salon_id = $2 AND category = $3
          `, [newCategory.rows[0].id, salon_id, category]);
          
          logger.info(`Создана категория "${category}" для салона #${salon_id} и обновлены связанные услуги`);
        } else {
          // Используем существующую категорию
          const categoryId = existingCategory.rows[0].id;
          
          // Обновляем услуги с этой категорией
          await client.query(`
            UPDATE services 
            SET category_id = $1
            WHERE salon_id = $2 AND category = $3 AND (category_id IS NULL OR category_id != $1)
          `, [categoryId, salon_id, category]);
          
          logger.info(`Использована существующая категория "${category}" (ID: ${categoryId}) для услуг салона #${salon_id}`);
        }
      }
    } else {
      logger.info('Нет существующих категорий для миграции');
    }
    
    await client.query('COMMIT');
    logger.info('Миграция категорий услуг успешно завершена');
    
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Ошибка при создании таблицы категорий услуг:', error);
  } finally {
    client.release();
    process.exit(0);
  }
}

addServiceCategoriesTable(); 