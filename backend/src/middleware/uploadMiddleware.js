const multer = require('multer');
const config = require('../config');
const { FileUploadError } = require('../utils/errors');
const logger = require('../config/logger');

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  logger.debug(`Processing file: ${file.originalname} (${file.mimetype})`);
  
  // Accept only CSV files
  if (config.upload.allowedMimeTypes.includes(file.mimetype) || 
      file.originalname.toLowerCase().endsWith('.csv')) {
    cb(null, true);
  } else {
    logger.warn(`Rejected file: ${file.originalname} - Invalid file type: ${file.mimetype}`);
    cb(new FileUploadError('Only CSV files are allowed'), false);
  }
};

const upload = multer({
  storage,
  limits: {
    fileSize: config.upload.maxFileSize,
    files: config.upload.maxFiles
  },
  fileFilter
});

const handleUploadError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    logger.error('Multer error:', error);
    
    if (error.code === 'LIMIT_FILE_SIZE') {
      return next(new FileUploadError('File too large. Maximum size is 10MB.', 'LIMIT_FILE_SIZE'));
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return next(new FileUploadError('Too many files. Maximum is 5 files.', 'LIMIT_FILE_COUNT'));
    }
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return next(new FileUploadError('Unexpected field', 'LIMIT_UNEXPECTED_FILE'));
    }
  }
  
  if (error.message === 'Only CSV files are allowed') {
    return next(new FileUploadError('Only CSV files are allowed'));
  }
  
  next(error);
};

module.exports = {
  upload,
  handleUploadError
};
