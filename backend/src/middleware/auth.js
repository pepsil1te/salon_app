const jwt = require('jsonwebtoken');
const logger = require('../config/logger');
const db = require('../config/database');

const verifyToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    // Проверяем, является ли это специальный токен администратора
    // Специальная обработка админского токена (с номером +79999999999)
    try {
      // Разделяем токен на части (header.payload.signature)
      const parts = token.split('.');
      if (parts.length === 3) {
        const payload = parts[1];
        // Декодируем payload
        const decodedPayload = JSON.parse(
          Buffer.from(payload, 'base64').toString('utf8')
        );
        
        // Проверяем, является ли это токен админа
        if (decodedPayload && decodedPayload.userId === 999 && decodedPayload.role === 'admin') {
          logger.info('Обнаружен специальный токен администратора');
          req.user = {
            userId: 999,
            role: 'admin',
            name: 'Администратор'
          };
          return next();
        }
      }
    } catch (decodeError) {
      logger.error('Ошибка при декодировании токена:', decodeError);
      // Если не удалось декодировать, продолжаем стандартную проверку
    }

    // Стандартная проверка JWT токена
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    // Если это мок админа, используем его напрямую
    if (decoded.userId === 999 && decoded.role === 'admin') {
      req.user = {
        userId: 999,
        role: 'admin',
        name: 'Администратор'
      };
      return next();
    }
    
    // Проверяем в таблице employees
    const { rows } = await db.query(
      'SELECT * FROM employees WHERE id = $1',
      [decoded.userId]
    );

    if (rows.length === 0) {
      return res.status(401).json({ message: 'Employee not found' });
    }

    // Сохраняем данные пользователя и ID из токена
    req.user = {
      ...rows[0],
      userId: decoded.userId
    };
    next();
  } catch (error) {
    logger.error('Authentication error:', error);
    return res.status(401).json({ message: 'Invalid token' });
  }
};

const checkRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    next();
  };
};

const checkSalonAccess = async (req, res, next) => {
  try {
    const salonId = req.params.salonId || req.body.salon_id;
    
    if (!salonId) {
      return res.status(400).json({ message: 'Salon ID is required' });
    }

    // Admin has access to all salons
    if (req.user.role === 'admin') {
      return next();
    }

    // Check if employee has access to the specified salon
    const { rows } = await db.query(
      'SELECT * FROM employees WHERE id = $1 AND salon_id = $2',
      [req.user.userId, salonId]
    );

    if (rows.length === 0) {
      return res.status(403).json({ message: 'Access to this salon denied' });
    }

    next();
  } catch (error) {
    logger.error('Salon access check error:', error);
    return res.status(500).json({ message: 'Error checking salon access' });
  }
};

module.exports = {
  verifyToken,
  checkRole,
  checkSalonAccess
}; 