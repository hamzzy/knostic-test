const express = require('express');
const csvController = require('../controllers/csvController');
const { upload, handleUploadError } = require('../middleware/uploadMiddleware');
const { validateCsvUpload, validateCsvValidation, validateCsvExport } = require('../validators/csvValidators');

const router = express.Router();

/**
 * @route   POST /api/csv/upload
 * @desc    Upload and parse CSV files
 * @access  Public
 */
router.post('/upload', 
  upload.array('files', 5), 
  handleUploadError,
  validateCsvUpload,
  csvController.uploadFiles
);

/**
 * @route   POST /api/csv/validate
 * @desc    Validate strings against classifications
 * @access  Public
 */
router.post('/validate',
  validateCsvValidation,
  csvController.validateData
);

/**
 * @route   POST /api/csv/export
 * @desc    Export data as CSV
 * @access  Public
 */
router.post('/export',
  validateCsvExport,
  csvController.exportData
);

module.exports = router;
