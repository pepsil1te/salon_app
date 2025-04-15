require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const logger = require('./config/logger');
const { requestLogger, errorLogger } = require('./middleware/logger');
const { initDB } = require('./db/init_complete_db');
const path = require('path');
const fs = require('fs');
const db = require('./config/database');

// Import routes
const authRoutes = require('./routes/auth');
const salonRoutes = require('./routes/salons');
const serviceRoutes = require('./routes/services');
const employeeRoutes = require('./routes/employees');
const appointmentRoutes = require('./routes/appointments');
const statisticsRoutes = require('./routes/statistics');
const settingsRoutes = require('./routes/settings');
const userRoutes = require('./routes/users');
const favoritesRoutes = require('./routes/favorites');

const app = express();

// Middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disable CSP for development
  crossOriginEmbedderPolicy: false
}));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger());

// Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/salons', salonRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/statistics', statisticsRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/users', userRoutes);
app.use('/api/favorites', favoritesRoutes);

// Middleware для логирования ошибок должен быть перед обработчиком ошибок
app.use(errorLogger());

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error(err.stack);
  res.status(500).json({
    status: 'error',
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// Проверяем, нужно ли инициализировать базу данных
const shouldInitDb = process.env.INIT_DATABASE === 'true';

// Запуск сервера
async function startServer() {
  try {
    // Подключение к базе данных и ее инициализация только если установлен флаг
    if (shouldInitDb) {
      logger.info('Инициализация базы данных...');
      await initDB();
      logger.info('Инициализация базы данных завершена');
    } else {
      logger.info('Пропуск инициализации базы данных. Установите INIT_DATABASE=true для инициализации.');
    }

    // Выполнение скрипта обновления схемы
    const updateSchemaSQL = fs.readFileSync(
      path.join(__dirname, 'db', 'complete_schema.sql'),
      'utf8'
    );
    
    logger.info('Выполнение скрипта обновления схемы базы данных...');
    await db.query(updateSchemaSQL);
    logger.info('Схема базы данных успешно обновлена.');

    // Run database migrations
    await runMigrations();

    // Запуск сервера
    const PORT = process.env.PORT || 3001;
    const server = app.listen(PORT, () => {
      logger.info(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    logger.error('Ошибка при запуске сервера:', error);
    process.exit(1);
  }
}

// Run database migrations
async function runMigrations() {
  try {
    logger.info('Checking database connection before running migrations...');
    const isConnected = await db.testConnection();
    
    if (!isConnected) {
      logger.error('Database connection failed, skipping migrations');
      return;
    }
    
    logger.info('Running database migrations...');
    
    // Note: We've removed the employee_schedules migration as that table is not needed
    
  } catch (error) {
    logger.error('Error during migration process:', error);
  }
}

startServer(); 