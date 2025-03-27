/**
 * Middleware for working with caching.
 */

const logger = require('../config/logger');
const cacheUtil = require('../utils/cache');

/**
 * Middleware для кеширования ответов API.
 * 
 * @param {number} ttl - Время жизни кеша в секундах (по умолчанию 300 - 5 минут)
 * @param {Function} keyFn - Функция для генерации ключа кеша (по умолчанию использует URL и query params)
 * @returns {Function} Middleware-функция Express
 */
function cacheMiddleware(ttl = 300, keyFn = null) {
  // В текущей версии кеширование отключено
  return (req, res, next) => {
    // Добавляем метод для принудительной очистки кеша в объект запроса
    req.clearCache = (pattern) => {
      if (pattern) {
        // Очистка по шаблону (например, '/salons/*')
        try {
          // Проверяем, что pattern - это строка
          if (typeof pattern === 'string') {
            const regex = new RegExp(pattern.replace(/\*/g, '.*'));
            for (const key of cacheUtil.getKeys()) {
              if (regex.test(key)) {
                cacheUtil.remove(key);
              }
            }
          } else {
            logger.warn('Invalid cache pattern type:', typeof pattern);
          }
        } catch (err) {
          logger.error('Error clearing cache with pattern:', err);
        }
      } else {
        // Полная очистка кеша
        cacheUtil.clear();
      }
    };
    
    next();
  };
}

/**
 * Middleware для инвалидации кеша.
 * 
 * @param {string|Array|Function} patterns - Шаблоны для инвалидации кеша или функции, возвращающие шаблоны
 * @returns {Function} Middleware-функция Express
 */
function invalidateCache(patterns = null) {
  return async (req, res, next) => {
    const clearCache = async () => {
      if (!patterns) {
        // Полная очистка кеша если шаблоны не указаны
        cacheUtil.clear();
        logger.debug('Cache cleared completely');
        return;
      }
      
      try {
        // Преобразуем шаблоны в массив, если это не массив
        const patternArray = Array.isArray(patterns) ? patterns : [patterns];
        
        // Обрабатываем каждый паттерн
        for (const patternItem of patternArray) {
          let pattern;
          
          // Если паттерн - функция, вызываем ее
          if (typeof patternItem === 'function') {
            try {
              pattern = patternItem(req);
              
              // Если результат - Promise, ждем его выполнения
              if (pattern instanceof Promise) {
                pattern = await pattern;
              }
            } catch (functionError) {
              logger.error('Error executing pattern function:', functionError);
              continue; // Пропускаем этот паттерн и переходим к следующему
            }
          } else {
            pattern = patternItem;
          }
          
          // Пропускаем паттерн, если он null, undefined или не строка
          if (!pattern || typeof pattern !== 'string') {
            continue;
          }
          
          try {
            // Обрабатываем паттерн для очистки кеша
            const regex = new RegExp(pattern.replace(/\*/g, '.*'));
            let count = 0;
            
            // Use the cache keys from cacheUtil
            const keys = cacheUtil.getKeys();
            
            for (const key of keys) {
              if (regex.test(key)) {
                cacheUtil.remove(key);
                count++;
              }
            }
            
            logger.debug(`Cache invalidated: ${count} entries matching '${pattern}'`);
          } catch (regexError) {
            logger.error(`Error processing cache pattern '${pattern}':`, regexError);
          }
        }
      } catch (error) {
        logger.error('Error during cache invalidation:', error);
      }
    };
    
    // Добавляем метод для инвалидации кеша в объект ответа
    res.invalidateCache = clearCache;
    
    try {
      // Вызываем очистку кеша при обработке запроса
      await clearCache();
      next();
    } catch (error) {
      logger.error('Unhandled error in cache invalidation:', error);
      next(); // Продолжаем выполнение запроса даже при ошибке кеширования
    }
  };
}

module.exports = {
  cache: cacheMiddleware,
  invalidate: invalidateCache,
  // Use the cache utility directly
  store: cacheUtil
}; 