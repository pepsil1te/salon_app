require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

// Простая реализация логгера
const logger = {
  info: (message, ...args) => {
    console.log(`[INFO] ${message}`, ...args);
  },
  error: (message, ...args) => {
    console.error(`[ERROR] ${message}`, ...args);
  },
  warn: (message, ...args) => {
    console.warn(`[WARN] ${message}`, ...args);
  }
};

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// SQL для очистки базы данных
const cleanDBSql = `
-- Удаление всех таблиц в правильном порядке (учитывая зависимости)
DROP TABLE IF EXISTS appointment_statistics CASCADE;
DROP TABLE IF EXISTS financial_statistics CASCADE;
DROP TABLE IF EXISTS service_statistics CASCADE;
DROP TABLE IF EXISTS employee_statistics CASCADE;
DROP TABLE IF EXISTS appointments CASCADE;
DROP TABLE IF EXISTS employee_services CASCADE;
DROP TABLE IF EXISTS clients CASCADE;
DROP TABLE IF EXISTS employees CASCADE;
DROP TABLE IF EXISTS services CASCADE;
DROP TABLE IF EXISTS salons CASCADE;

-- Удаление всех функций
DO $$ 
DECLARE 
  rec RECORD;
BEGIN
  FOR rec IN SELECT proname, pronargs, proargtypes FROM pg_proc 
  WHERE pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public') 
  LOOP
    EXECUTE 'DROP FUNCTION IF EXISTS ' || quote_ident(rec.proname) || ' CASCADE;';
  END LOOP;
END $$;

-- Удаление всех типов
DROP TYPE IF EXISTS appointment_status CASCADE;
DROP TYPE IF EXISTS user_role CASCADE;
`;

async function initDB() {
  let client;
  try {
    // Соединение с базой данных
    client = await pool.connect();
    logger.info('Успешное подключение к PostgreSQL для инициализации базы данных');

    // Чтение SQL скриптов
    const completeSchemaSql = fs.readFileSync(path.join(__dirname, 'complete_schema.sql'), 'utf8');
    const testDataSql = fs.readFileSync(path.join(__dirname, 'test_data.sql'), 'utf8');

    // Сначала очищаем базу данных
    logger.info('Очистка старых таблиц, функций и типов...');
    await client.query(cleanDBSql);
    logger.info('Очистка завершена');

    // Выполнение полного скрипта схемы базы данных
    logger.info('Создание схемы базы данных и триггеров...');
    await client.query(completeSchemaSql);
    logger.info('Схема базы данных успешно создана');

    // Выполнение скрипта вставки тестовых данных
    logger.info('Вставка тестовых данных...');
    await client.query(testDataSql);
    logger.info('Тестовые данные успешно вставлены');

    // Проверка созданных таблиц
    const tableResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    logger.info(`Созданные таблицы (${tableResult.rows.length}):`);
    tableResult.rows.forEach(row => {
      logger.info(`- ${row.table_name}`);
    });

    // Проверка созданных триггеров
    const triggerResult = await client.query(`
      SELECT trigger_name, event_manipulation, event_object_table
      FROM information_schema.triggers
      WHERE trigger_schema = 'public'
      ORDER BY event_object_table, trigger_name
    `);
    
    logger.info(`Созданные триггеры (${triggerResult.rows.length}):`);
    triggerResult.rows.forEach(row => {
      logger.info(`- ${row.trigger_name} (${row.event_manipulation} ON ${row.event_object_table})`);
    });

    // Проверка созданных пользовательских типов
    const typeResult = await client.query(`
      SELECT t.typname
      FROM pg_type t
      JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
      WHERE n.nspname = 'public'
      AND t.typtype = 'e'
      ORDER BY t.typname
    `);
    
    logger.info(`Созданные пользовательские типы (${typeResult.rows.length}):`);
    typeResult.rows.forEach(row => {
      logger.info(`- ${row.typname}`);
    });

    logger.info('Инициализация базы данных успешно завершена');
    return true;
  } catch (error) {
    logger.error('Ошибка при инициализации базы данных:', error);
    return false;
  } finally {
    if (client) {
      client.release();
    }
  }
}

// Если скрипт запущен напрямую, а не импортирован как модуль
if (require.main === module) {
  initDB()
    .then(success => {
      if (success) {
        logger.info('Скрипт инициализации базы данных успешно выполнен');
        process.exit(0);
      } else {
        logger.error('Скрипт инициализации базы данных завершился с ошибкой');
        process.exit(1);
      }
    })
    .catch(err => {
      logger.error('Необработанная ошибка в скрипте инициализации:', err);
      process.exit(1);
    });
}

module.exports = { initDB };