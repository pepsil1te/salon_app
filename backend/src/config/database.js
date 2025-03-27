const { Pool } = require('pg');
const logger = require('./logger');

// Проверка и логирование строки подключения (без пароля)
const connectionString = process.env.DATABASE_URL || '';
const maskedConnectionString = connectionString
  .replace(/\/\/[^:]+:[^@]+@/, '//[USERNAME:PASSWORD]@')
  .replace(/\/\/(.+?):.+?@/, '//****:****@');

logger.info(`PostgreSQL connection config: ${maskedConnectionString}`);

// Опции подключения для Neon/PostgreSQL
const poolConfig = {
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false, // Важно для Neon и других облачных баз данных
    // Дополнительные настройки SSL
    // Если нужны, раскомментируйте и заполните:
    // ca: fs.readFileSync('/path/to/ca.crt').toString(),
  },
  // Увеличенные таймауты и лимиты повторных попыток
  connectionTimeoutMillis: 30000, // 30 секунд
  query_timeout: 60000, // 60 секунд
  statement_timeout: 60000, // 60 секунд
  idle_in_transaction_session_timeout: 60000, // 60 секунд
  max: 10, // максимум соединений в пуле (уменьшено для снижения нагрузки)
  idleTimeoutMillis: 30000, // закрыть после 30 секунд бездействия
};

// Создаем пул подключений
const pool = new Pool(poolConfig);

// Обработчик для выполнения запросов с повторными попытками
const executeQuery = async (text, params, retries = 5) => {
  let lastError;
  let delayFactor = 1; // начальный множитель задержки
  
  for (let i = 0; i < retries; i++) {
    try {
      // Для каждого запроса получаем клиент из пула
      const client = await pool.connect();
      let result;
      
      try {
        // Проверяем соединение простым запросом
        if (i > 0) { // только при повторных попытках
          await client.query('SELECT 1');
          logger.info(`Соединение успешно восстановлено (попытка ${i+1}/${retries})`);
        }
        
        // Выполняем основной запрос
        result = await client.query(text, params);
      } finally {
        // Всегда возвращаем клиент в пул
        client.release();
      }
      
      return result;
    } catch (error) {
      lastError = error;
      logger.error(`Database query error (attempt ${i+1}/${retries}):`, error);
      
      // Расширенный список ошибок для повторной попытки
      const retriableErrors = [
        'ECONNREFUSED', 'ETIMEDOUT', 'ECONNRESET', 'EPIPE', // сетевые ошибки
        '57P01', '57P02', '57P03', // ошибки соединения PostgreSQL
        '08000', '08003', '08006', '08001', '08004', // ошибки соединения по SQLSTATE
        'CONNECTION EXCEPTION', 'CONNECTION DOES NOT EXIST', 'CONNECTION FAILURE' // текстовые ошибки
      ];
      
      const shouldRetry = retriableErrors.some(code => 
        error.code === code || 
        (error.message && error.message.includes(code))
      );
      
      if (!shouldRetry) {
        throw error;
      }
      
      // Увеличиваем задержку с каждой попыткой (экспоненциальный backoff)
      // При этом добавляем случайный фактор (jitter) для предотвращения эффекта thundering herd
      const jitter = Math.random() * 0.3 + 0.85; // случайный множитель от 0.85 до 1.15
      const delay = 1000 * Math.pow(2, i) * delayFactor * jitter;
      delayFactor *= 1.5; // увеличиваем множитель с каждой попыткой
      
      logger.info(`Retrying in ${Math.round(delay)}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  logger.error(`Failed after ${retries} attempts`);
  throw lastError;
};

// Функция для тестирования подключения
async function testConnection() {
  try {
    logger.info('Attempting to connect to database...');
    
    const client = await pool.connect();
    try {
      // Проверяем, что можем выполнить простой запрос
      const res = await client.query('SELECT 1 as connected');
      logger.info(`Connection successful: ${res.rows[0].connected === 1 ? 'YES' : 'NO'}`);
      
      // Получаем информацию о базе данных
      const dbInfo = await client.query('SELECT current_database() as db_name, current_user as user_name');
      logger.info(`Connected to ${dbInfo.rows[0].db_name} as ${dbInfo.rows[0].user_name}`);
      
      return true;
    } finally {
      client.release();
    }
  } catch (err) {
    logger.error('Error connecting to the database:', err);
    return false;
  }
}

// Логирование событий пула соединений
pool.on('connect', () => {
  logger.debug('New client connected to the pool');
});

pool.on('remove', () => {
  logger.debug('Client removed from pool');
});

// Обработка ошибок пула
pool.on('error', (err) => {
  logger.error('Unexpected error on idle client:', err);
  // Не завершаем процесс для повышения устойчивости
});

// Метод для получения клиента из пула для транзакций
const getClient = async function() {
  return await pool.connect();
};

const db = {
  query: executeQuery,
  getClient,
  pool,
  testConnection
};

module.exports = db; 