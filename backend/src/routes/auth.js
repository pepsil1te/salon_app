const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const db = require('../config/database');
const logger = require('../config/logger');
const { verifyToken } = require('../middleware/auth');

// Verify Telegram Web App data
const verifyTelegramData = (data) => {
  const { hash, ...rest } = data;
  const dataCheckString = Object.keys(rest)
    .sort()
    .map(key => `${key}=${rest[key]}`)
    .join('\n');
  
  const secret = crypto.createHmac('sha256', 'WebAppData')
    .update(process.env.TELEGRAM_BOT_TOKEN)
    .digest();
  
  const calculatedHash = crypto.createHmac('sha256', secret)
    .update(dataCheckString)
    .digest('hex');
  
  return calculatedHash === hash;
};

// Initialize Telegram Web App
router.post('/init', async (req, res) => {
  try {
    const initData = req.body;
    
    if (!verifyTelegramData(initData)) {
      return res.status(401).json({ message: 'Invalid Telegram data' });
    }

    const user = JSON.parse(initData.user);
    const { rows } = await db.query(
      'SELECT * FROM clients WHERE contact_info->>\'telegram_id\' = $1',
      [user.id.toString()]
    );

    let userId;
    if (rows.length === 0) {
      // Create new client
      const { rows: [newUser] } = await db.query(
        'INSERT INTO clients (first_name, last_name, contact_info) VALUES ($1, $2, $3) RETURNING id',
        [
          user.first_name, 
          user.last_name || '', 
          {
            telegram_id: user.id.toString(),
            username: user.username || ''
          }
        ]
      );
      userId = newUser.id;
    } else {
      userId = rows[0].id;
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId, role: 'client' },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.json({ token });
  } catch (error) {
    logger.error('Telegram init error:', error);
    res.status(500).json({ message: 'Error initializing Telegram Web App' });
  }
});

// Вход по номеру телефона
router.post('/phone-login', async (req, res) => {
  try {
    const { phoneNumber } = req.body;
    
    if (!phoneNumber) {
      return res.status(400).json({ error: 'Номер телефона не указан' });
    }
    
    logger.info(`Попытка входа по номеру телефона: ${phoneNumber}`);
    
    // Форматирование номера телефона (удаление пробелов, скобок и дефисов)
    const formattedPhone = phoneNumber.replace(/[\s\-\(\)]/g, '');
    
    // Специальная проверка для администратора
    if (formattedPhone === '+79999999999') {
      const token = jwt.sign(
        { userId: 999, role: 'admin' },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
      );
      
      return res.json({ 
        token,
        user: {
          id: 999,
          role: 'admin',
          name: 'Администратор'
        }
      });
    }
    
    // Отладочное логирование для проверки формата
    logger.info(`Отформатированный номер телефона: ${formattedPhone}`);
    
    // Подготовка разных вариантов номера телефона для поиска
    const phoneVariants = [];
    
    // Исходный номер телефона
    phoneVariants.push(formattedPhone);
    
    // Без кода страны +7 -> 9...
    if (formattedPhone.startsWith('+7')) {
      phoneVariants.push(formattedPhone.substring(2));
    }
    
    // С кодом страны, если его нет 9... -> +79...
    if (!formattedPhone.startsWith('+') && formattedPhone.length >= 10) {
      phoneVariants.push(`+7${formattedPhone}`);
    }
    
    // Другие типичные форматы
    if (formattedPhone.startsWith('8') && formattedPhone.length >= 11) {
      phoneVariants.push(`+7${formattedPhone.substring(1)}`);
    }
    
    // Добавляем варианты с пробелами для более широкого сравнения
    const phoneWithSpaces = formattedPhone.replace(/(\+7)(\d{3})(\d{3})(\d{2})(\d{2})/, '$1 $2 $3$4$5');
    phoneVariants.push(phoneWithSpaces);
    
    if (formattedPhone.startsWith('+7')) {
      // Варианты с разными форматами пробелов
      phoneVariants.push(formattedPhone.replace(/(\+7)(\d{3})(\d{3})(\d{2})(\d{2})/, '$1 $2 $3-$4-$5'));
      phoneVariants.push(formattedPhone.replace(/(\+7)(\d{3})(\d{3})(\d{2})(\d{2})/, '$1 ($2) $3-$4-$5'));
      phoneVariants.push(formattedPhone.replace(/(\+7)(\d{3})(\d{3})(\d{2})(\d{2})/, '$1$2$3$4$5'));
    }
    
    logger.info(`Варианты поиска номера: ${JSON.stringify(phoneVariants)}`);
    
    // Результаты поиска
    let user = null;
    let userType = '';
    
    // ОТЛАДКА: Проверяем содержимое таблицы employees
    try {
      const debugQuery = `SELECT id, name, contact_info FROM employees LIMIT 10`;
      const debugResult = await db.query(debugQuery);
      logger.info(`ОТЛАДКА: Найдено ${debugResult.rows.length} сотрудников: ${JSON.stringify(debugResult.rows)}`);
      
      // Дополнительный лог форматов телефонов для отладки
      debugResult.rows.forEach(emp => {
        logger.info(`Сотрудник ${emp.id}: ${emp.name}, телефон: ${emp.contact_info.phone}, тип: ${typeof emp.contact_info.phone}`);
      });
    } catch (error) {
      logger.error(`ОТЛАДКА: Ошибка при получении списка сотрудников: ${error.message}`);
    }
    
    // ШАГИ ПОИСКА:
    // 1. Сначала ищем в таблице employees прямым совпадением
    try {
      // Создаем условия для поиска
      const exactPhoneConditions = phoneVariants.map(phone => `contact_info->>'phone' = '${phone}'`).join(' OR ');
      const likePhoneConditions = phoneVariants.map(phone => `contact_info->>'phone' LIKE '%${phone}%'`).join(' OR ');
      
      // Запрос для поиска сотрудника с любым из вариантов телефона
      const employeeQuery = `
        SELECT id, name, first_name, last_name, role, salon_id, contact_info, position
        FROM employees 
        WHERE ${exactPhoneConditions} OR ${likePhoneConditions}
      `;
      
      logger.info(`Выполняем запрос поиска сотрудника: ${employeeQuery}`);
      
      const employeeResult = await db.query(employeeQuery);
      
      if (employeeResult.rows.length > 0) {
        user = employeeResult.rows[0];
        userType = user.role || 'employee';
        logger.info(`Найден сотрудник: ${user.id} (${user.name}), телефон: ${user.contact_info.phone}`);
      } else {
        logger.info(`Сотрудник с номером ${formattedPhone} не найден ни по одному из вариантов`);
      }
      
      // 2. Если не нашли сотрудника, ищем в таблице clients
      if (!user) {
        try {
          // Создаем запрос для поиска клиента с любым из вариантов телефона
          const clientQuery = `
            SELECT id, name, first_name, last_name, contact_info
            FROM clients 
            WHERE ${exactPhoneConditions} OR ${likePhoneConditions}
          `;
          
          logger.info(`Выполняем запрос поиска клиента: ${clientQuery}`);
          
          const clientResult = await db.query(clientQuery);
          
          if (clientResult.rows.length > 0) {
            user = clientResult.rows[0];
            userType = 'client';
            logger.info(`Найден клиент: ${user.id} (${user.name}), телефон: ${user.contact_info.phone}`);
          } else {
            logger.info(`Клиент с номером ${formattedPhone} не найден ни по одному из вариантов`);
          }
        } catch (error) {
          // Игнорируем ошибки, если таблица clients не существует
          if (error.code !== '42P01') {
            throw error;
          }
          logger.info('Таблица clients не существует, поиск только среди сотрудников');
        }
      }
    } catch (error) {
      logger.error(`Ошибка при поиске пользователя: ${error.message}`, error);
      throw error;
    }
    
    if (!user) {
      logger.info(`Пользователь с номером ${phoneNumber} не найден`);
      return res.status(404).json({ 
        exists: false, 
        message: 'Пользователь не найден' 
      });
    }
    
    // Создание токена
    const token = jwt.sign(
      { userId: user.id, role: userType },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
    
    logger.info(`Пользователь ${user.id} (${user.name}) успешно авторизован, роль: ${userType}`);
    
    res.json({ 
      token,
      user: {
        id: user.id,
        role: userType,
        name: user.name,
        salon_id: userType === 'client' ? null : user.salon_id
      }
    });
  } catch (error) {
    logger.error('Ошибка при входе по телефону:', error);
    // Возвращаем более подробную информацию об ошибке
    res.status(500).json({ 
      error: 'Ошибка при авторизации', 
      details: error.message,
      stack: process.env.NODE_ENV !== 'production' ? error.stack : undefined
    });
  }
});

// Регистрация нового пользователя
router.post('/register', async (req, res) => {
  try {
    const { phoneNumber, firstName, lastName, email, birthDate, role, salonId } = req.body;
    
    if (!phoneNumber || !firstName || !lastName || !email || !birthDate) {
      return res.status(400).json({ error: 'Не все обязательные поля указаны' });
    }
    
    // Определяем, регистрируем клиента или сотрудника
    const userRole = role || 'client';
    const isClient = userRole === 'client';
    
    logger.info(`Попытка регистрации ${isClient ? 'клиента' : 'сотрудника'}: ${firstName} ${lastName}, роль: ${userRole}`);
    
    // Форматирование номера телефона
    const formattedPhone = phoneNumber.replace(/[\s\-\(\)]/g, '');
    
    // Подготовка разных вариантов номера телефона для поиска
    const phoneVariants = [];
    
    // Исходный номер телефона
    phoneVariants.push(formattedPhone);
    
    // Без кода страны +7 -> 9...
    if (formattedPhone.startsWith('+7')) {
      phoneVariants.push(formattedPhone.substring(2));
    }
    
    // С кодом страны, если его нет 9... -> +79...
    if (!formattedPhone.startsWith('+') && formattedPhone.length >= 10) {
      phoneVariants.push(`+7${formattedPhone}`);
    }
    
    // Другие типичные форматы
    if (formattedPhone.startsWith('8') && formattedPhone.length >= 11) {
      phoneVariants.push(`+7${formattedPhone.substring(1)}`);
    }
    
    // Проверяем наличие дубликатов для обеих таблиц (clients и employees)
    let isDuplicate = false;
    
    // 1. Проверка в таблице clients
    try {
      // Формируем условия для точного и частичного совпадения
      const exactClientConditions = phoneVariants.map(phone => `contact_info->>'phone' = '${phone}'`).join(' OR ');
      const likeClientConditions = phoneVariants.map(phone => `contact_info->>'phone' LIKE '%${phone}%'`).join(' OR ');
      
      const clientCheckQuery = `
        SELECT id, name, contact_info->>'phone' as phone 
        FROM clients 
        WHERE ${exactClientConditions} OR ${likeClientConditions}
      `;
      
      logger.info(`Проверка на дубликаты в таблице clients: ${clientCheckQuery}`);
      
      const clientResult = await db.query(clientCheckQuery);
      
      if (clientResult.rows.length > 0) {
        logger.info(`Найден существующий клиент с телефоном: ${clientResult.rows[0].phone}`);
        isDuplicate = true;
        return res.status(409).json({ 
          error: `Клиент с таким номером телефона уже существует`,
          existingPhone: clientResult.rows[0].phone
        });
      }
    } catch (error) {
      // Игнорируем ошибку, если таблица не существует
      if (error.code !== '42P01') {
        throw error;
      }
      logger.info('Таблица clients не существует, пропускаем проверку');
    }
    
    // 2. Проверка в таблице employees
    try {
      const exactEmployeeConditions = phoneVariants.map(phone => `contact_info->>'phone' = '${phone}'`).join(' OR ');
      const likeEmployeeConditions = phoneVariants.map(phone => `contact_info->>'phone' LIKE '%${phone}%'`).join(' OR ');
      
      const employeeCheckQuery = `
        SELECT id, name, contact_info->>'phone' as phone 
        FROM employees 
        WHERE ${exactEmployeeConditions} OR ${likeEmployeeConditions}
      `;
      
      logger.info(`Проверка на дубликаты в таблице employees: ${employeeCheckQuery}`);
      
      const employeeResult = await db.query(employeeCheckQuery);
      
      if (employeeResult.rows.length > 0) {
        logger.info(`Найден существующий сотрудник с телефоном: ${employeeResult.rows[0].phone}`);
        isDuplicate = true;
        return res.status(409).json({ 
          error: `Сотрудник с таким номером телефона уже существует`,
          existingPhone: employeeResult.rows[0].phone
        });
      }
    } catch (error) {
      if (error.code !== '42P01') {
        throw error;
      }
      logger.info('Таблица employees не существует, пропускаем проверку');
    }
    
    // Если дубликат найден, прерываем выполнение функции
    if (isDuplicate) {
      return;
    }
    
    // Контактная информация
    const contactInfo = {
      phone: formattedPhone, // Используем отформатированный номер для единообразия
      email: email
    };
    
    const name = `${firstName} ${lastName}`;
    let userId;
    
    if (isClient) {
      // Регистрация нового клиента
      // Сначала проверим, существует ли таблица clients
      try {
        await db.query("SELECT 1 FROM clients LIMIT 1");
      } catch (error) {
        // Если таблица не существует, создаем её
        if (error.code === '42P01') { // 42P01 - код ошибки "relation does not exist"
          logger.info("Таблица clients не существует, создаем её");
          const createTableQuery = `
            CREATE TABLE IF NOT EXISTS clients (
              id SERIAL PRIMARY KEY,
              name VARCHAR(255) NOT NULL,
              first_name VARCHAR(100) NOT NULL,
              last_name VARCHAR(100) NOT NULL,
              contact_info JSONB NOT NULL,
              birth_date DATE,
              created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
              updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            )
          `;
          await db.query(createTableQuery);
        } else {
          throw error;
        }
      }
      
      // Вставляем нового клиента
      const insertQuery = `
        INSERT INTO clients (name, first_name, last_name, contact_info, birth_date)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id
      `;
      
      const result = await db.query(
        insertQuery, 
        [name, firstName, lastName, contactInfo, birthDate]
      );
      
      userId = result.rows[0].id;
      logger.info(`Клиент ${userId} успешно зарегистрирован`);
      
    } else {
      // Регистрация нового сотрудника (для администратора)
      // Добавим рабочие часы по умолчанию для сотрудника
      const defaultWorkingHours = {
        "1": { "start": "09:00", "end": "18:00" },
        "2": { "start": "09:00", "end": "18:00" },
        "3": { "start": "09:00", "end": "18:00" },
        "4": { "start": "09:00", "end": "18:00" },
        "5": { "start": "09:00", "end": "18:00" }
      };
      
      const insertQuery = `
        INSERT INTO employees (salon_id, name, first_name, last_name, role, position, contact_info, working_hours, is_active)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING id
      `;
      
      const result = await db.query(
        insertQuery, 
        [salonId, name, firstName, lastName, 'employee', 'Новый сотрудник', contactInfo, defaultWorkingHours, true]
      );
      
      userId = result.rows[0].id;
      logger.info(`Сотрудник ${userId} успешно зарегистрирован`);
    }
    
    // Создание токена
    const token = jwt.sign(
      { userId, role: userRole },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
    
    res.status(201).json({
      token,
      user: {
        id: userId,
        role: userRole,
        name,
        salon_id: isClient ? null : salonId
      }
    });
  } catch (error) {
    logger.error(`Ошибка при регистрации: ${error.message}`, error);
    res.status(500).json({ 
      error: 'Ошибка при регистрации',
      details: error.message,
      stack: process.env.NODE_ENV !== 'production' ? error.stack : undefined 
    });
  }
});

// Get user profile
router.get('/profile', verifyToken, async (req, res) => {
  try {
    const { userId, role } = req.user;
    
    let user;
    if (role === 'employee') {
      const { rows } = await db.query(
        'SELECT id, first_name, last_name, role, salon_id, contact_info, position FROM employees WHERE id = $1',
        [userId]
      );
      if (rows.length === 0) {
        return res.status(404).json({ message: 'Сотрудник не найден' });
      }
      user = rows[0];
      // Ensure the ID is returned as a number
      user.id = parseInt(user.id);
    } else if (role === 'client') {
      const { rows } = await db.query(
        'SELECT id, first_name, last_name, contact_info FROM clients WHERE id = $1',
        [userId]
      );
      if (rows.length === 0) {
        return res.status(404).json({ message: 'Клиент не найден' });
      }
      user = rows[0];
      // Ensure the ID is returned as a number
      user.id = parseInt(user.id);
    } else if (role === 'admin') {
      user = {
        id: 999,
        first_name: 'Администратор',
        last_name: '',
        role: 'admin'
      };
    }
    
    res.json(user);
  } catch (error) {
    logger.error('Profile error:', error);
    res.status(500).json({ message: 'Ошибка при получении профиля' });
  }
});

// Update user profile
router.put('/profile', verifyToken, async (req, res) => {
  try {
    const { first_name, last_name, contact_info } = req.body;
    
    const { rows } = await db.query(
      'UPDATE employees SET first_name = $1, last_name = $2, contact_info = $3 WHERE id = $4 RETURNING *',
      [first_name, last_name, contact_info, req.user.userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Сотрудник не найден' });
    }

    res.json(rows[0]);
  } catch (error) {
    logger.error('Ошибка при обновлении профиля:', error);
    res.status(500).json({ 
      message: 'Ошибка при обновлении данных профиля',
      details: error.message,
      stack: process.env.NODE_ENV !== 'production' ? error.stack : undefined 
    });
  }
});

module.exports = router; 