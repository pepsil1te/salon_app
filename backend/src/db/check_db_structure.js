require('dotenv').config();
const db = require('../config/database');
const logger = require('../config/logger');

async function checkDatabaseStructure() {
  try {
    logger.info('Проверка структуры базы данных...');
    
    // Проверяем соединение с базой данных
    const connected = await db.testConnection();
    if (!connected) {
      throw new Error('Не удалось подключиться к базе данных');
    }
    
    // Получаем список всех таблиц
    const { rows: tables } = await db.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);
    
    logger.info(`Найдено ${tables.length} таблиц в базе данных:`);
    tables.forEach((table, index) => {
      logger.info(`${index + 1}. ${table.table_name}`);
    });
    
    // Получаем список всех типов
    const { rows: types } = await db.query(`
      SELECT typname 
      FROM pg_type 
      WHERE typtype = 'e'
      ORDER BY typname;
    `);
    
    logger.info(`Найдено ${types.length} пользовательских типов в базе данных:`);
    types.forEach((type, index) => {
      logger.info(`${index + 1}. ${type.typname}`);
    });

    // Проверяем наличие ключевых таблиц
    const requiredTables = [
      'appointments', 'services', 'employees', 'salons',
      'appointment_statistics', 'financial_statistics', 
      'service_statistics', 'employee_statistics'
    ];
    
    const missingTables = requiredTables.filter(
      table => !tables.some(t => t.table_name === table)
    );
    
    if (missingTables.length > 0) {
      logger.warn(`Отсутствуют следующие таблицы: ${missingTables.join(', ')}`);
    } else {
      logger.info('Все необходимые таблицы присутствуют в базе данных');
    }
    
    return {
      tables: tables.map(t => t.table_name),
      types: types.map(t => t.typname),
      missingTables
    };
  } catch (error) {
    logger.error('Ошибка при проверке структуры базы данных:', error);
    return {
      error: error.message,
      tables: [],
      types: [],
      missingTables: []
    };
  }
}

// Если скрипт запущен напрямую, выполняем проверку
if (require.main === module) {
  checkDatabaseStructure()
    .then(result => {
      if (result.missingTables.length > 0) {
        logger.warn(`Необходимо создать отсутствующие таблицы: ${result.missingTables.join(', ')}`);
      }
      process.exit(0);
    })
    .catch(err => {
      logger.error('Непредвиденная ошибка при проверке структуры базы данных:', err);
      process.exit(1);
    });
}

module.exports = { checkDatabaseStructure }; 