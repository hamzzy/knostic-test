const csvService = require('../services/csvService');
const validationService = require('../services/validationService');
const logger = require('../config/logger');
const { FileUploadError, ValidationError } = require('../utils/errors');

class CsvController {
  /**
   * Upload and parse CSV files
   */
  async uploadFiles(req, res, next) {
    try {
      const files = req.files;
      
      if (!files || files.length === 0) {
        throw new FileUploadError('No files uploaded');
      }

      logger.info(`Processing ${files.length} uploaded files`);

      const results = [];
      
      for (const file of files) {
        try {
          logger.info(`Parsing file: ${file.originalname} (${file.size} bytes)`);
          const { headers, rows } = await csvService.parseCSV(file.buffer);
          
          results.push({
            filename: file.originalname,
            headers,
            rows,
            rowCount: rows.length
          });
          
          logger.info(`Successfully parsed ${file.originalname}: ${rows.length} rows`);
        } catch (parseError) {
          logger.error(`Failed to parse ${file.originalname}:`, parseError);
          results.push({
            filename: file.originalname,
            error: parseError.message
          });
        }
      }

      res.json({
        success: true,
        files: results
      });
      
    } catch (error) {
      logger.error('Upload error:', error);
      next(error);
    }
  }

  /**
   * Validate strings against classifications
   */
  async validateData(req, res, next) {
    try {
      const { stringsData, classificationsData } = req.body;
      
      logger.info(`Validating ${stringsData.length} strings against ${classificationsData.length} classifications`);

      // Validate required headers for strings data
      const stringsHeaderValidation = validationService.validateRequiredHeaders(
        stringsData, 
        ['Topic', 'SubTopic', 'Industry']
      );
      if (!stringsHeaderValidation.valid) {
        throw new ValidationError(`Strings data validation failed: ${stringsHeaderValidation.reason}`);
      }
      
      // Validate required headers for classifications data
      const classificationsHeaderValidation = validationService.validateRequiredHeaders(
        classificationsData, 
        ['Topic', 'SubTopic', 'Industry']
      );
      if (!classificationsHeaderValidation.valid) {
        throw new ValidationError(`Classifications data validation failed: ${classificationsHeaderValidation.reason}`);
      }
      
      // Perform validation
      const validationResult = validationService.validateStringsAgainstClassifications(
        stringsData, 
        classificationsData
      );
      
      logger.info(`Validation completed: ${validationResult.valid ? 'PASSED' : 'FAILED'}`);
      
      res.json({
        valid: validationResult.valid,
        invalidRows: validationResult.invalidRows,
        totalRows: stringsData.length,
        invalidCount: validationResult.invalidRows.length
      });
      
    } catch (error) {
      logger.error('Validation error:', error);
      next(error);
    }
  }

  /**
   * Export data as CSV
   */
  async exportData(req, res, next) {
    try {
      const { rows, headers, filename = 'export.csv' } = req.body;
      
      logger.info(`Exporting ${rows.length} rows with ${headers.length} headers as ${filename}`);

      // Validate export data
      validationService.validateExportData(rows, headers);
      
      // Set response headers for CSV download
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Cache-Control', 'no-cache');
      
      // Create CSV stream and pipe to response
      const csvStream = csvService.exportToCSV(rows, headers);
      
      csvStream.on('error', (error) => {
        logger.error('CSV export error:', error);
        if (!res.headersSent) {
          next(new Error('Failed to generate CSV'));
        }
      });
      
      csvStream.pipe(res);
      
      logger.info(`Successfully exported ${filename}`);
      
    } catch (error) {
      logger.error('Export error:', error);
      next(error);
    }
  }

  /**
   * Health check endpoint
   */
  async healthCheck(req, res, next) {
    try {
      res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        service: 'knostic-csv-manager',
        version: process.env.npm_package_version || '1.0.0'
      });
    } catch (error) {
      logger.error('Health check error:', error);
      next(error);
    }
  }
}

module.exports = new CsvController();
