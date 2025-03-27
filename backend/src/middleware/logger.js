const logger = require('../config/logger');

/**
 * Middleware для логирования HTTP запросов
 */
const requestLogger = () => {
  return (req, res, next) => {
    // Логирование только в dev-режиме или если это не запрос статического ресурса
    if (process.env.NODE_ENV === 'development' || !req.path.startsWith('/static')) {
      logger.info(`${req.method} ${req.originalUrl}`, {
        ip: req.ip,
        headers: {
          'user-agent': req.headers['user-agent']
        }
      });
    }
    next();
  };
};

/**
 * Middleware для логирования ошибок
 */
const errorLogger = () => {
  return (err, req, res, next) => {
    logger.error(`Error processing ${req.method} ${req.originalUrl}`, {
      error: err.message,
      stack: err.stack,
      body: req.body
    });
    next(err);
  };
};

module.exports = {
  requestLogger,
  errorLogger
}; 