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

async function applyMigrations() {
  let client;
  try {
    // Соединение с базой данных
    client = await pool.connect();
    logger.info('Успешное подключение к PostgreSQL для применения миграций');

    // Создаем таблицу для отслеживания миграций, если она еще не существует
    await client.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        applied_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Получаем список уже примененных миграций
    const { rows: appliedMigrations } = await client.query(
      'SELECT name FROM migrations ORDER BY applied_at'
    );
    const appliedMigrationNames = new Set(appliedMigrations.map(m => m.name));

    // Читаем все файлы миграций из директории
    const migrationsDir = path.join(__dirname, 'migrations');
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort();

    // Применяем каждую новую миграцию
    for (const file of migrationFiles) {
      if (!appliedMigrationNames.has(file)) {
        logger.info(`Применение миграции: ${file}`);
        
        // Читаем содержимое файла миграции
        const migrationSql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
        
        // Начинаем транзакцию
        await client.query('BEGIN');
        
        try {
          // Выполняем миграцию
          await client.query(migrationSql);
          
          // Записываем информацию о примененной миграции
          await client.query(
            'INSERT INTO migrations (name) VALUES ($1)',
            [file]
          );
          
          // Фиксируем транзакцию
          await client.query('COMMIT');
          logger.info(`Миграция ${file} успешно применена`);
        } catch (error) {
          // В случае ошибки откатываем транзакцию
          await client.query('ROLLBACK');
          throw error;
        }
      } else {
        logger.info(`Пропуск уже примененной миграции: ${file}`);
      }
    }

    logger.info('Все миграции успешно применены');
    return true;
  } catch (error) {
    logger.error('Ошибка при применении миграций:', error);
    return false;
  } finally {
    if (client) {
      client.release();
    }
  }
}

// Если скрипт запущен напрямую, а не импортирован как модуль
if (require.main === module) {
  applyMigrations()
    .then(success => {
      if (success) {
        logger.info('Скрипт применения миграций успешно выполнен');
        process.exit(0);
      } else {
        logger.error('Скрипт применения миграций завершился с ошибкой');
        process.exit(1);
      }
    })
    .catch(err => {
      logger.error('Необработанная ошибка в скрипте миграций:', err);
      process.exit(1);
    });
}

module.exports = { applyMigrations }; 