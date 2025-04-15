const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { verifyToken, checkRole } = require('../middleware/auth');
const logger = require('../config/logger');

// Получение настроек
router.get('/', verifyToken, checkRole('admin'), async (req, res) => {
  try {
    logger.info('Получение настроек');
    
    // Проверяем существование таблицы настроек
    await checkSettingsTable();
    
    // Получаем все настройки из базы данных
    const { rows: settings } = await db.query('SELECT * FROM settings');
    
    // Преобразуем настройки в более удобный формат
    const formattedSettings = formatSettings(settings);
    
    res.status(200).json(formattedSettings);
  } catch (error) {
    logger.error(`Ошибка при получении настроек: ${error.message}`);
    res.status(500).json({ message: 'Ошибка при получении настроек', error: error.message });
  }
});

// Обновление настроек
router.put('/', verifyToken, checkRole('admin'), async (req, res) => {
  try {
    const { section, settings, method = 'replace' } = req.body;
    
    logger.info(`Обновление настроек раздела: ${section}, метод: ${method}`);
    
    if (!section || !settings) {
      return res.status(400).json({ message: 'Не указаны раздел или настройки' });
    }
    
    // Проверяем существование таблицы настроек
    await checkSettingsTable();
    
    // Преобразуем объект настроек в массив для сохранения
    const settingsArray = Object.entries(settings).map(([key, value]) => {
      return {
        section,
        key,
        value: typeof value === 'object' ? JSON.stringify(value) : String(value)
      };
    });
    
    // В зависимости от метода, обновляем настройки
    if (method === 'upsert') {
      // Используем upsert для каждой настройки
      for (const setting of settingsArray) {
        await db.query(`
          INSERT INTO settings (section, key, value)
          VALUES ($1, $2, $3)
          ON CONFLICT (section, key) 
          DO UPDATE SET value = $3, updated_at = CURRENT_TIMESTAMP
        `, [setting.section, setting.key, setting.value]);
      }
    } else {
      // Удаляем существующие настройки для данного раздела (метод по умолчанию)
      await db.query('DELETE FROM settings WHERE section = $1', [section]);
      
      // Вставляем новые настройки
      for (const setting of settingsArray) {
        await db.query(
          'INSERT INTO settings (section, key, value) VALUES ($1, $2, $3)',
          [setting.section, setting.key, setting.value]
        );
      }
    }
    
    // Получаем обновленные настройки
    const { rows: updatedSettings } = await db.query('SELECT * FROM settings WHERE section = $1', [section]);
    const formattedSettings = formatSettings(updatedSettings);
    
    res.status(200).json({
      message: `Настройки раздела "${section}" успешно обновлены`,
      settings: formattedSettings[section] || {}
    });
  } catch (error) {
    logger.error(`Ошибка при обновлении настроек: ${error.message}`);
    res.status(500).json({ message: 'Ошибка при обновлении настроек', error: error.message });
  }
});

// Получение списка пользователей (сотрудники и клиенты)
router.get('/users', verifyToken, checkRole('admin'), async (req, res) => {
  try {
    logger.info('Получение списка всех пользователей для настроек');
    
    // Проверяем и добавляем колонку is_active в таблицу clients, если её нет
    await db.query(`
      ALTER TABLE clients 
      ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true
    `);
    
    // Получаем сотрудников с их ролями и статусами
    const { rows: employees } = await db.query(`
      SELECT 
        id, 
        CONCAT(first_name, ' ', last_name) AS name, 
        contact_info->>'email' AS email, 
        role, 
        CASE WHEN is_active = true THEN 'active' ELSE 'inactive' END AS status,
        'employee' AS user_type,
        salon_id
      FROM employees 
      ORDER BY first_name, last_name
    `);
    
    // Получаем клиентов
    const { rows: clients } = await db.query(`
      SELECT 
        id, 
        CONCAT(first_name, ' ', last_name) AS name, 
        contact_info->>'email' AS email, 
        'client' AS role,
        CASE WHEN is_active IS NULL OR is_active = true THEN 'active' ELSE 'inactive' END AS status,
        'client' AS user_type,
        NULL AS salon_id
      FROM clients
      ORDER BY first_name, last_name
    `);
    
    // Объединяем результаты
    const allUsers = [...employees, ...clients];
    
    res.status(200).json(allUsers);
  } catch (error) {
    logger.error(`Ошибка при получении пользователей: ${error.message}`);
    res.status(500).json({ message: 'Ошибка при получении пользователей', error: error.message });
  }
});

// Обновление статуса пользователя
router.put('/users/:id/status', verifyToken, checkRole('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { status, userType } = req.body;
    
    if (!status || !['active', 'inactive'].includes(status)) {
      return res.status(400).json({ message: 'Некорректный статус' });
    }
    
    if (!userType || !['employee', 'client'].includes(userType)) {
      return res.status(400).json({ message: 'Некорректный тип пользователя' });
    }
    
    const isActive = status === 'active';
    
    // Обновляем статус в зависимости от типа пользователя
    if (userType === 'employee') {
      await db.query('UPDATE employees SET is_active = $1 WHERE id = $2', [isActive, id]);
    } else {
      // Для клиентов можно добавить поле is_active, если его нет
      await db.query(`
        ALTER TABLE clients 
        ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true
      `);
      
      await db.query('UPDATE clients SET is_active = $1 WHERE id = $2', [isActive, id]);
    }
    
    res.status(200).json({ message: 'Статус пользователя успешно обновлен' });
  } catch (error) {
    logger.error(`Ошибка при обновлении статуса пользователя: ${error.message}`);
    res.status(500).json({ message: 'Ошибка при обновлении статуса пользователя', error: error.message });
  }
});

// Обновление роли пользователя (только для сотрудников)
router.put('/users/:id/role', verifyToken, checkRole('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { role, userType } = req.body;
    
    if (!userType || userType !== 'employee') {
      return res.status(400).json({ message: 'Роль можно изменить только у сотрудников' });
    }
    
    if (!role || !['admin', 'manager', 'employee'].includes(role)) {
      return res.status(400).json({ message: 'Некорректная роль' });
    }
    
    await db.query('UPDATE employees SET role = $1 WHERE id = $2', [role, id]);
    
    res.status(200).json({ message: 'Роль пользователя успешно обновлена' });
  } catch (error) {
    logger.error(`Ошибка при обновлении роли пользователя: ${error.message}`);
    res.status(500).json({ message: 'Ошибка при обновлении роли пользователя', error: error.message });
  }
});

// Удаление пользователя из базы данных
router.delete('/users/:id', verifyToken, checkRole('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { userType } = req.query;
    
    if (!userType || !['employee', 'client'].includes(userType)) {
      return res.status(400).json({ message: 'Необходимо указать корректный тип пользователя' });
    }
    
    logger.info(`Удаление пользователя из базы данных: ${userType} с ID ${id}`);
    
    // Убедимся, что колонка is_active существует в таблице clients
    if (userType === 'client') {
      await db.query(`
        ALTER TABLE clients 
        ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true
      `);
    }
    
    // Удаляем пользователя в зависимости от типа
    if (userType === 'employee') {
      // Проверка, является ли удаляемый сотрудник администратором
      const { rows } = await db.query('SELECT role FROM employees WHERE id = $1', [id]);
      
      if (rows.length === 0) {
        return res.status(404).json({ message: 'Сотрудник не найден' });
      }
      
      // Если это последний администратор, запрещаем удаление
      if (rows[0].role === 'admin') {
        const { rows: adminCount } = await db.query('SELECT COUNT(*) FROM employees WHERE role = $1', ['admin']);
        if (parseInt(adminCount[0].count) <= 1) {
          return res.status(403).json({ message: 'Невозможно удалить последнего администратора' });
        }
      }
      
      // Удаляем сотрудника
      await db.query('DELETE FROM employees WHERE id = $1', [id]);
    } else {
      // Удаляем клиента
      // Сначала проверим существование
      const { rows } = await db.query('SELECT id FROM clients WHERE id = $1', [id]);
      
      if (rows.length === 0) {
        return res.status(404).json({ message: 'Клиент не найден' });
      }
      
      // Удаляем связанные записи
      await db.query('DELETE FROM appointments WHERE client_id = $1', [id]);
      await db.query('DELETE FROM clients WHERE id = $1', [id]);
    }
    
    res.status(200).json({ message: 'Пользователь успешно удален' });
  } catch (error) {
    logger.error(`Ошибка при удалении пользователя: ${error.message}`);
    res.status(500).json({ message: 'Ошибка при удалении пользователя', error: error.message });
  }
});

// Функция проверки таблицы настроек
async function checkSettingsTable() {
  try {
    // Проверяем существование таблицы settings
    const { rows } = await db.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'settings'
      );
    `);
    
    // Если таблица не существует, создаем её
    if (!rows[0].exists) {
      await db.query(`
        CREATE TABLE settings (
          id SERIAL PRIMARY KEY,
          section VARCHAR(50) NOT NULL,
          key VARCHAR(100) NOT NULL,
          value TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          UNIQUE (section, key)
        );
      `);
      
      // Добавляем триггер для обновления updated_at
      await db.query(`
        CREATE OR REPLACE FUNCTION update_modified_column()
        RETURNS TRIGGER AS $$
        BEGIN
          NEW.updated_at = now();
          RETURN NEW;
        END;
        $$ language 'plpgsql';
        
        CREATE TRIGGER update_settings_modtime
        BEFORE UPDATE ON settings
        FOR EACH ROW
        EXECUTE PROCEDURE update_modified_column();
      `);
      
      // Вставляем начальные настройки
      await insertDefaultSettings();
    }
  } catch (error) {
    logger.error(`Ошибка при проверке таблицы настроек: ${error.message}`);
    throw error;
  }
}

// Функция вставки настроек по умолчанию
async function insertDefaultSettings() {
  const defaultSettings = {
    general: {
      companyName: 'Сеть салонов красоты',
      adminEmail: 'admin@example.com',
      defaultLanguage: 'ru',
      dateFormat: 'DD.MM.YYYY',
      timeFormat: '24h'
    },
    appearance: {
      theme: 'light',
      primaryColor: '#1976d2',
      secondaryColor: '#dc004e',
      enableDarkMode: false,
      showLogo: true
    },
    notification: {
      emailNotifications: true,
      smsNotifications: false,
      appointmentReminders: true,
      marketingEmails: false,
      reminderTime: 24
    },
    security: {
      twoFactorAuth: false,
      passwordExpiryDays: 90,
      sessionTimeout: 30,
      allowRegistration: true
    },
    backup: {
      autoBackup: true,
      backupFrequency: 'daily',
      retentionPeriod: 30,
      lastBackup: new Date().toISOString()
    }
  };
  
  for (const [section, settings] of Object.entries(defaultSettings)) {
    for (const [key, value] of Object.entries(settings)) {
      const stringValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
      await db.query(
        'INSERT INTO settings (section, key, value) VALUES ($1, $2, $3)',
        [section, key, stringValue]
      );
    }
  }
}

// Функция форматирования настроек из базы данных
function formatSettings(settings) {
  const result = {};
  
  for (const row of settings) {
    if (!result[row.section]) {
      result[row.section] = {};
    }
    
    // Преобразуем значения в соответствующие типы
    let value = row.value;
    
    // Пытаемся распарсить JSON
    try {
      const parsed = JSON.parse(value);
      value = parsed;
    } catch (e) {
      // Преобразуем строки в соответствующие типы
      if (value === 'true') {
        value = true;
      } else if (value === 'false') {
        value = false;
      } else if (!isNaN(value) && value !== '') {
        value = Number(value);
      }
    }
    
    result[row.section][row.key] = value;
  }
  
  return result;
}

// Функция проверки таблицы users
async function checkUsersTable() {
  try {
    // Проверяем существование таблицы users
    const { rows } = await db.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'users'
      );
    `);
    
    // Если таблица не существует, создаем её
    if (!rows[0].exists) {
      logger.info('Создание таблицы users...');
      
      await db.query(`
        CREATE TABLE users (
          id SERIAL PRIMARY KEY,
          name VARCHAR(100) NOT NULL,
          email VARCHAR(100) UNIQUE NOT NULL,
          password VARCHAR(200) NOT NULL,
          role VARCHAR(20) NOT NULL DEFAULT 'employee',
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `);
      
      // Добавляем триггер для обновления updated_at
      await db.query(`
        CREATE OR REPLACE FUNCTION update_modified_column()
        RETURNS TRIGGER AS $$
        BEGIN
          NEW.updated_at = now();
          RETURN NEW;
        END;
        $$ language 'plpgsql';
        
        DROP TRIGGER IF EXISTS update_users_modtime ON users;
        
        CREATE TRIGGER update_users_modtime
        BEFORE UPDATE ON users
        FOR EACH ROW
        EXECUTE PROCEDURE update_modified_column();
      `);
      
      // Создаем тестовых пользователей
      await insertDefaultUsers();
      
      logger.info('Таблица users успешно создана');
    }
  } catch (error) {
    logger.error(`Ошибка при проверке таблицы users: ${error.message}`);
    throw error;
  }
}

// Функция вставки пользователей по умолчанию
async function insertDefaultUsers() {
  try {
    // Создаем администратора
    await db.query(`
      INSERT INTO users (name, email, password, role, is_active)
      VALUES (
        'Администратор', 
        'admin@example.com', 
        '$2b$10$3euPcmQFCiblsZeEu5s7p.9Nth0Uqt.iy5TQtgT1Jvk2LZgw6.Fde', 
        'admin', 
        true
      );
    `); // пароль: admin123
    
    // Создаем менеджера
    await db.query(`
      INSERT INTO users (name, email, password, role, is_active)
      VALUES (
        'Менеджер', 
        'manager@example.com', 
        '$2b$10$7vESx/Hvl5.pMKfw1BCEVukHPIoOJGkMR4j5JR/jHulTYg5MsjrUe', 
        'manager', 
        true
      );
    `); // пароль: manager123
    
    // Создаем сотрудника
    await db.query(`
      INSERT INTO users (name, email, password, role, is_active)
      VALUES (
        'Сотрудник', 
        'employee@example.com', 
        '$2b$10$G7WZj6NUCCrjiB9fZB0Bb.7TlWICeTIYmPGZ80NbsXiiXwFqZQeci', 
        'employee', 
        true
      );
    `); // пароль: employee123
    
    logger.info('Тестовые пользователи успешно созданы');
  } catch (error) {
    logger.error(`Ошибка при создании тестовых пользователей: ${error.message}`);
    throw error;
  }
}

module.exports = router; 