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
  body('stringsData')
    .isArray()
    .withMessage('stringsData is required and must be an array')
    .notEmpty()
    .withMessage('stringsData cannot be empty'),
  body('classificationsData')
    .isArray()
    .withMessage('classificationsData is required and must be an array')
    .notEmpty()
    .withMessage('classificationsData cannot be empty'),
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
  validateRequest
];

module.exports = {
  validateCsvUpload,
  validateCsvValidation,
  validateCsvExport,
  validateRequest
};
