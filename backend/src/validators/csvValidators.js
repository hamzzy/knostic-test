const { body, validationResult } = require('express-validator');
const { ValidationError } = require('../utils/errors');

const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => error.msg);
    throw new ValidationError('Validation failed', errorMessages);
  }
  next();
};

const validateCsvUpload = [
  body('files').custom((value, { req }) => {
    if (!req.files || req.files.length === 0) {
      throw new Error('No files uploaded');
    }
    return true;
  }),
  validateRequest
];

const validateCsvValidation = [
  body('strings')
    .isObject()
    .withMessage('strings is required and must be an object'),
  body('strings.headers')
    .isArray()
    .withMessage('strings.headers is required and must be an array')
    .notEmpty()
    .withMessage('strings.headers cannot be empty'),
  body('strings.rows')
    .isArray()
    .withMessage('strings.rows is required and must be an array'),
  body('classifications')
    .isObject()
    .withMessage('classifications is required and must be an object'),
  body('classifications.headers')
    .isArray()
    .withMessage('classifications.headers is required and must be an array')
    .notEmpty()
    .withMessage('classifications.headers cannot be empty'),
  body('classifications.rows')
    .isArray()
    .withMessage('classifications.rows is required and must be an array'),
  validateRequest
];

const validateCsvExport = [
  body('rows')
    .isArray()
    .withMessage('rows is required and must be an array'),
  body('headers')
    .isArray()
    .withMessage('headers is required and must be an array')
    .notEmpty()
    .withMessage('headers cannot be empty'),
  body('filename')
    .optional()
    .isString()
    .withMessage('filename must be a string'),
  body('validationPassed')
    .isBoolean()
    .withMessage('validationPassed is required and must be a boolean'),
  validateRequest
];

module.exports = {
  validateCsvUpload,
  validateCsvValidation,
  validateCsvExport,
  validateRequest
};
