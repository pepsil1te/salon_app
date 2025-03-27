/**
 * Сервис для работы с файлами - загрузка, обработка и хранение
 */

const fs = require('fs');
const path = require('path');
const logger = require('../config/logger');
const multer = require('multer');
const sharp = require('sharp');

// Базовая директория для хранения файлов
const UPLOAD_DIR = path.join(process.cwd(), 'uploads');
const IMAGE_UPLOAD_DIR = path.join(UPLOAD_DIR, 'images');

// Создаем директории, если они не существуют
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  logger.info(`Created upload directory: ${UPLOAD_DIR}`);
}

if (!fs.existsSync(IMAGE_UPLOAD_DIR)) {
  fs.mkdirSync(IMAGE_UPLOAD_DIR, { recursive: true });
  logger.info(`Created image upload directory: ${IMAGE_UPLOAD_DIR}`);
}

// Настраиваем multer для загрузки файлов
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let destDir = UPLOAD_DIR;
    
    if (file.mimetype.startsWith('image/')) {
      destDir = IMAGE_UPLOAD_DIR;
    }
    
    cb(null, destDir);
  },
  filename: (req, file, cb) => {
    // Создаем уникальное имя файла с временной меткой
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const fileExt = path.extname(file.originalname);
    const fileName = file.fieldname + '-' + uniqueSuffix + fileExt;
    
    cb(null, fileName);
  }
});

// Функция фильтрации файлов
const fileFilter = (req, file, cb) => {
  // Допустимые типы изображений
  const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  
  if (file.mimetype.startsWith('image/') && !allowedImageTypes.includes(file.mimetype)) {
    // Отклоняем неподдерживаемые форматы изображений
    cb(new Error('Unsupported image format. Allowed formats: JPEG, PNG, GIF, WebP'), false);
  } else {
    cb(null, true);
  }
};

// Создаем middleware для загрузки файлов
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5 MB
  }
});

/**
 * Обрабатывает изображение для оптимизации хранения
 * 
 * @param {string} filePath - Путь к файлу изображения
 * @param {Object} options - Опции обработки
 * @param {number} options.width - Максимальная ширина
 * @param {number} options.height - Максимальная высота
 * @param {string} options.format - Формат выходного файла (jpeg, png, webp)
 * @param {number} options.quality - Качество изображения (1-100)
 * @returns {Promise<string>} Путь к обработанному файлу
 */
async function processImage(filePath, options = {}) {
  try {
    const {
      width = 1200,
      height = 1200,
      format = 'jpeg',
      quality = 80
    } = options;
    
    // Создаем имя выходного файла
    const parsedPath = path.parse(filePath);
    const outputPath = path.join(
      parsedPath.dir,
      `${parsedPath.name}_processed.${format}`
    );
    
    // Получаем информацию об оригинальном файле
    const metadata = await sharp(filePath).metadata();
    
    // Обрабатываем изображение
    await sharp(filePath)
      .resize({
        width: Math.min(width, metadata.width || width),
        height: Math.min(height, metadata.height || height),
        fit: 'inside',
        withoutEnlargement: true
      })
      .toFormat(format, { quality })
      .toFile(outputPath);
    
    logger.info(`Image processed: ${path.basename(filePath)} -> ${path.basename(outputPath)}`);
    
    // Удаляем оригинальный файл
    fs.unlinkSync(filePath);
    
    return outputPath;
  } catch (error) {
    logger.error('Error processing image:', error);
    return filePath; // Возвращаем оригинальный путь в случае ошибки
  }
}

/**
 * Получает публичный URL для файла
 * 
 * @param {string} filePath - Полный путь к файлу
 * @returns {string} Публичный URL файла
 */
function getFileUrl(filePath) {
  // Преобразуем абсолютный путь в относительный URL
  const relativePath = path.relative(UPLOAD_DIR, filePath);
  return `/uploads/${relativePath.replace(/\\/g, '/')}`;
}

/**
 * Удаляет файл с диска
 * 
 * @param {string} fileUrl - URL файла
 * @returns {Promise<boolean>} Успешность удаления
 */
async function deleteFile(fileUrl) {
  try {
    if (!fileUrl || typeof fileUrl !== 'string') {
      return false;
    }
    
    // Преобразуем URL в путь на диске
    let filePath = fileUrl;
    if (fileUrl.startsWith('/uploads/')) {
      filePath = path.join(UPLOAD_DIR, fileUrl.replace('/uploads/', ''));
    }
    
    // Проверяем, существует ли файл
    if (!fs.existsSync(filePath)) {
      logger.warn(`File not found for deletion: ${filePath}`);
      return false;
    }
    
    // Удаляем файл
    fs.unlinkSync(filePath);
    logger.info(`File deleted: ${filePath}`);
    
    return true;
  } catch (error) {
    logger.error('Error deleting file:', error);
    return false;
  }
}

module.exports = {
  upload,
  processImage,
  getFileUrl,
  deleteFile,
  UPLOAD_DIR,
  IMAGE_UPLOAD_DIR
}; 