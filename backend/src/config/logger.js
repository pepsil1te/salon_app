const winston = require('winston');
const path = require('path');
const fs = require('fs');

// Создаем директорию для логов, если она не существует
const logDir = path.resolve(process.cwd(), 'logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Настраиваем форматы логирования
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ level, message, timestamp, ...meta }) => {
    let metaStr = '';
    if (Object.keys(meta).length > 0) {
      // Форматируем метаданные, исключая слишком длинные строки и круговые ссылки
      metaStr = ' ' + JSON.stringify(meta, (key, value) => {
        if (typeof value === 'string' && value.length > 500) {
          return value.substring(0, 500) + '... (truncated)';
        }
        return value;
      });
    }
    return `${timestamp} ${level}: ${message}${metaStr}`;
  })
);

const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.json()
);

// Создаем логгер
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: fileFormat,
  defaultMeta: { service: 'salon-api' },
  transports: [
    // Логи ошибок
    new winston.transports.File({ 
      filename: path.join(logDir, 'error.log'), 
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    // Все логи
    new winston.transports.File({ 
      filename: path.join(logDir, 'combined.log'),
      maxsize: 10485760, // 10MB
      maxFiles: 5,
    })
  ],
  // Обработка исключений и отказов от обещаний (promises)
  exceptionHandlers: [
    new winston.transports.File({ 
      filename: path.join(logDir, 'exceptions.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    })
  ],
  rejectionHandlers: [
    new winston.transports.File({ 
      filename: path.join(logDir, 'rejections.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    })
  ]
});

// Добавляем консольный транспорт для не-продакшн окружений
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: consoleFormat
  }));
} else {
  // В продакшн выводим только ошибки в консоль
  logger.add(new winston.transports.Console({
    format: consoleFormat,
    level: 'error'
  }));
}

// Добавляем утилиты для более удобного логирования
logger.logRequest = (req) => {
  const { method, originalUrl, ip, body } = req;
  const sanitizedBody = body ? { ...body } : {};
  
  // Очищаем конфиденциальные данные
  if (sanitizedBody.password) sanitizedBody.password = '[REDACTED]';
  if (sanitizedBody.token) sanitizedBody.token = '[REDACTED]';
  
  logger.info(`Request: ${method} ${originalUrl}`, {
    ip,
    method,
    url: originalUrl,
    body: Object.keys(sanitizedBody).length > 0 ? sanitizedBody : undefined
  });
};

logger.logResponse = (req, res, data) => {
  const { method, originalUrl } = req;
  const { statusCode } = res;
  
  logger.info(`Response: ${statusCode} ${method} ${originalUrl}`, {
    statusCode,
    responseTime: res.responseTime,
    dataLength: data ? JSON.stringify(data).length : 0
  });
};

module.exports = logger; 