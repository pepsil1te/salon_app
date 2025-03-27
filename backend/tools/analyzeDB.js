require('dotenv').config();
const db = require('../src/config/database');
const logger = require('../src/config/logger');

/**
 * Утилита для анализа структуры базы данных 
 * Запуск: node backend/tools/analyzeDB.js [tableName]
 */
async function analyzeDatabase() {
  const client = await db.getClient();
  
  try {
    // Таблица для анализа (по умолчанию 'salons')
    const tableName = process.argv[2] || 'salons';
    logger.info(`Анализ структуры таблицы '${tableName}'...`);
    
    // Получаем схему таблицы
    const schemaResult = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = $1
      ORDER BY ordinal_position
    `, [tableName]);
    
    if (schemaResult.rows.length === 0) {
      logger.error(`Таблица '${tableName}' не найдена в базе данных`);
      return;
    }
    
    // Выводим информацию о колонках
    logger.info(`Структура таблицы '${tableName}':`);
    schemaResult.rows.forEach(column => {
      logger.info(`- ${column.column_name}: ${column.data_type}, ${column.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}${column.column_default ? `, DEFAULT: ${column.column_default}` : ''}`);
    });
    
    // Получаем индексы таблицы
    const indexesResult = await client.query(`
      SELECT
        i.relname as index_name,
        a.attname as column_name,
        ix.indisunique as is_unique,
        ix.indisprimary as is_primary
      FROM
        pg_class t,
        pg_class i,
        pg_index ix,
        pg_attribute a
      WHERE
        t.oid = ix.indrelid
        and i.oid = ix.indexrelid
        and a.attrelid = t.oid
        and a.attnum = ANY(ix.indkey)
        and t.relkind = 'r'
        and t.relname = $1
      ORDER BY
        i.relname
    `, [tableName]);
    
    if (indexesResult.rows.length > 0) {
      logger.info(`Индексы таблицы '${tableName}':`);
      const groupedIndexes = {};
      
      // Группируем колонки по индексам
      indexesResult.rows.forEach(row => {
        if (!groupedIndexes[row.index_name]) {
          groupedIndexes[row.index_name] = {
            columns: [],
            is_unique: row.is_unique,
            is_primary: row.is_primary
          };
        }
        groupedIndexes[row.index_name].columns.push(row.column_name);
      });
      
      // Выводим информацию об индексах
      Object.entries(groupedIndexes).forEach(([indexName, info]) => {
        const type = info.is_primary ? 'PRIMARY KEY' : (info.is_unique ? 'UNIQUE' : 'INDEX');
        logger.info(`- ${indexName}: ${type} (${info.columns.join(', ')})`);
      });
    } else {
      logger.info(`Нет индексов для таблицы '${tableName}'`);
    }
    
    // Получаем данные из таблицы
    const dataResult = await client.query(`SELECT * FROM ${tableName} LIMIT 1`);
    
    if (dataResult.rows.length > 0) {
      logger.info(`Пример данных из таблицы '${tableName}':`);
      const row = dataResult.rows[0];
      Object.entries(row).forEach(([key, value]) => {
        // Форматируем значение в зависимости от типа
        let displayValue;
        if (value === null) {
          displayValue = 'NULL';
        } else if (typeof value === 'object') {
          displayValue = JSON.stringify(value);
        } else {
          displayValue = value.toString();
        }
        logger.info(`- ${key}: ${displayValue}`);
      });
    } else {
      logger.info(`Таблица '${tableName}' пуста`);
    }
    
    // Подсчитываем количество записей
    const countResult = await client.query(`SELECT COUNT(*) FROM ${tableName}`);
    logger.info(`Всего записей в таблице '${tableName}': ${countResult.rows[0].count}`);
    
  } catch (error) {
    logger.error('Ошибка при анализе базы данных:', error);
  } finally {
    client.release();
    process.exit(0);
  }
}

analyzeDatabase(); 