/**
 * Утилиты для маршрутов API
 */

const logger = require('../config/logger');

/**
 * Оборачивает обработчик маршрута в try-catch блок для стандартной обработки ошибок
 * 
 * @param {Function} handler - Функция-обработчик маршрута
 * @returns {Function} Express-middleware с обработкой ошибок
 */
function asyncHandler(handler) {
  return async (req, res, next) => {
    try {
      await handler(req, res, next);
    } catch (error) {
      logger.error(`API Error: ${error.message}`, {
        route: req.originalUrl,
        method: req.method,
        error: error.stack
      });
      
      res.status(500).json({
        status: 'error',
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  };
}

/**
 * Стандартизированная обработка ошибок SQL
 * 
 * @param {Error} error - Объект ошибки
 * @param {string} operation - Описание операции
 * @param {Object} res - Express объект ответа
 */
function handleSqlError(error, operation, res) {
  logger.error(`SQL Error during ${operation}:`, error);
  
  // Определяем тип ошибки
  if (error.code === '23505') {
    // Нарушение уникальности
    return res.status(409).json({
      status: 'error',
      message: 'Duplicate entry: This record already exists',
      detail: process.env.NODE_ENV === 'development' ? error.detail : undefined
    });
  } else if (error.code === '23503') {
    // Нарушение внешнего ключа
    return res.status(400).json({
      status: 'error',
      message: 'Foreign key violation: Referenced record does not exist',
      detail: process.env.NODE_ENV === 'development' ? error.detail : undefined
    });
  } else if (error.code === '42P01') {
    // Несуществующая таблица
    return res.status(500).json({
      status: 'error',
      message: 'Database schema error: Table does not exist',
      detail: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
  
  // Общая ошибка
  return res.status(500).json({
    status: 'error',
    message: `Error during ${operation}`,
    error: process.env.NODE_ENV === 'development' ? error.message : undefined
  });
}

module.exports = {
  asyncHandler,
  handleSqlError
}; 