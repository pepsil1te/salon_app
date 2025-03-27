/**
 * A simple in-memory cache utility for API responses
 */

const logger = require('../config/logger');

// Cache storage
const cache = new Map();

// Default TTL (time to live) in milliseconds (5 minutes)
const DEFAULT_TTL = 5 * 60 * 1000;

/**
 * Get a value from the cache
 * @param {string} key - The cache key
 * @returns {any|null} The cached value or null if not found or expired
 */
function get(key) {
  if (!cache.has(key)) {
    return null;
  }

  const cachedItem = cache.get(key);
  const now = Date.now();

  // Check if the item has expired
  if (now > cachedItem.expiry) {
    cache.delete(key);
    return null;
  }

  logger.debug(`Cache hit for key: ${key}`);
  return cachedItem.value;
}

/**
 * Set a value in the cache
 * @param {string} key - The cache key
 * @param {any} value - The value to cache
 * @param {number} [ttl=DEFAULT_TTL] - Time to live in milliseconds
 */
function set(key, value, ttl = DEFAULT_TTL) {
  const expiry = Date.now() + ttl;
  cache.set(key, { value, expiry });
  logger.debug(`Cached item with key: ${key}, TTL: ${ttl}ms`);
}

/**
 * Remove a value from the cache
 * @param {string} key - The cache key
 */
function remove(key) {
  cache.delete(key);
  logger.debug(`Removed cache item with key: ${key}`);
}

/**
 * Clear all items from the cache
 */
function clear() {
  cache.clear();
  logger.debug('Cache cleared');
}

/**
 * Remove all expired items from the cache
 */
function cleanup() {
  const now = Date.now();
  let count = 0;
  
  for (const [key, item] of cache.entries()) {
    if (now > item.expiry) {
      cache.delete(key);
      count++;
    }
  }
  
  if (count > 0) {
    logger.debug(`Cleaned up ${count} expired cache items`);
  }
}

/**
 * Get statistics about the current cache
 * @returns {Object} Cache statistics
 */
function getStats() {
  const now = Date.now();
  let expired = 0;
  
  for (const item of cache.values()) {
    if (now > item.expiry) {
      expired++;
    }
  }
  
  return {
    total: cache.size,
    expired,
    active: cache.size - expired
  };
}

/**
 * Get all keys in the cache
 * @returns {Array} Array of cache keys
 */
function getKeys() {
  return Array.from(cache.keys());
}

// Run cache cleanup every 10 minutes
setInterval(cleanup, 10 * 60 * 1000);

module.exports = {
  get,
  set,
  remove,
  clear,
  cleanup,
  getStats,
  getKeys,
  DEFAULT_TTL
}; 