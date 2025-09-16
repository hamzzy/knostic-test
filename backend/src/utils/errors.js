class AppError extends Error {
  constructor(message, statusCode, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';

    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends AppError {
  constructor(message, details = null) {
    super(message, 400);
    this.details = details;
  }
}

class FileUploadError extends AppError {
  constructor(message, code = null) {
    super(message, 400);
    this.code = code;
  }
}

class CsvParseError extends AppError {
  constructor(message, originalError = null) {
    super(message, 422);
    this.originalError = originalError;
  }
}

const handleError = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error
  const logger = require('../config/logger');
  logger.error(err);

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = 'Resource not found';
    error = new AppError(message, 404);
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const message = 'Duplicate field value entered';
    error = new AppError(message, 400);
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message).join(', ');
    error = new ValidationError(message);
  }

  // Multer errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    error = new FileUploadError('File too large', 'LIMIT_FILE_SIZE');
  }
  if (err.code === 'LIMIT_FILE_COUNT') {
    error = new FileUploadError('Too many files', 'LIMIT_FILE_COUNT');
  }
  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    error = new FileUploadError('Unexpected field', 'LIMIT_UNEXPECTED_FILE');
  }

  res.status(error.statusCode || 500).json({
    success: false,
    error: error.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

module.exports = {
  AppError,
  ValidationError,
  FileUploadError,
  CsvParseError,
  handleError
};
