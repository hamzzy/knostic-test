const csvService = require('../services/csvService');
const validationService = require('../services/validationService');
const logger = require('../config/logger');
const { FileUploadError, ValidationError } = require('../utils/errors');

class CsvController {
  /**
   * Upload and parse CSV files with comprehensive header validation
   */
  async uploadFiles(req, res, next) {
    try {
      const files = req.files;
      
      if (!files || files.length === 0) {
        throw new FileUploadError('No files uploaded');
      }

      logger.info(`Processing ${files.length} uploaded files`);

      const results = {};
      
      for (const file of files) {
        try {
          logger.info(`Parsing file: ${file.originalname} (${file.size} bytes)`);
          const parsedData = await csvService.parseCSV(file.buffer);
          
          const {
            originalHeaders,
            headers,
            rows,
            headerMapping,
            roleDetection
          } = parsedData;
          
          // Determine if headers are valid for the detected role
          let headerValid = false;
          let missingRequiredHeaders = [];
          let extraHeaders = [];
          
          if (roleDetection.detectedRole === 'strings') {
            headerValid = roleDetection.stringsValidation.valid;
            missingRequiredHeaders = roleDetection.stringsValidation.missingRequiredHeaders;
            extraHeaders = roleDetection.stringsValidation.extraHeaders;
          } else if (roleDetection.detectedRole === 'classifications') {
            headerValid = roleDetection.classificationsValidation.valid;
            missingRequiredHeaders = roleDetection.classificationsValidation.missingRequiredHeaders;
            extraHeaders = roleDetection.classificationsValidation.extraHeaders;
          } else if (roleDetection.ambiguous) {
            // For ambiguous files, we need user input to determine role
            headerValid = false;
            missingRequiredHeaders = [];
            extraHeaders = [];
          } else {
            // Unknown role - no valid headers detected
            headerValid = false;
            missingRequiredHeaders = ['Unable to determine required headers'];
            extraHeaders = [];
          }
          
          results[file.originalname] = {
            originalName: file.originalname,
            headers: Object.values(headerMapping), // Canonical headers
            normalizedHeaderMap: headerMapping,
            rows: rows,
            rowCount: rows.length,
            isStringsCandidate: roleDetection.isStringsCandidate,
            isClassificationsCandidate: roleDetection.isClassificationsCandidate,
            detectedRole: roleDetection.detectedRole,
            ambiguous: roleDetection.ambiguous,
            headerValid: headerValid,
            missingRequiredHeaders: missingRequiredHeaders,
            extraHeaders: extraHeaders
          };
          
          logger.info(`Successfully parsed ${file.originalname}: ${rows.length} rows, role: ${roleDetection.detectedRole}, valid: ${headerValid}`);
        } catch (parseError) {
          logger.error(`Failed to parse ${file.originalname}:`, parseError);
          results[file.originalname] = {
            originalName: file.originalname,
            error: parseError.message,
            parseError: true
          };
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
   * Authoritative validation endpoint for strings vs classifications
   */
  async validateData(req, res, next) {
    try {
      const { strings, classifications } = req.body;
      
      if (!strings || !classifications) {
        throw new ValidationError('Both strings and classifications data are required');
      }
      
      const { headers: stringsHeaders, rows: stringsRows } = strings;
      const { headers: classificationsHeaders, rows: classificationsRows } = classifications;
      
      logger.info(`Validating ${stringsRows.length} strings against ${classificationsRows.length} classifications`);

      // Re-validate headers using the new validation system
      const { validateHeaders } = require('../utils/headerValidator');
      
      const stringsHeaderValidation = validateHeaders(stringsHeaders, 'strings');
      if (!stringsHeaderValidation.valid) {
        return res.status(400).json({
          success: false,
          valid: false,
          headerErrors: [{
            type: 'strings',
            missingRequiredHeaders: stringsHeaderValidation.missingRequiredHeaders,
            reason: stringsHeaderValidation.reason
          }],
          invalidRows: []
        });
      }
      
      const classificationsHeaderValidation = validateHeaders(classificationsHeaders, 'classifications');
      if (!classificationsHeaderValidation.valid) {
        return res.status(400).json({
          success: false,
          valid: false,
          headerErrors: [{
            type: 'classifications',
            missingRequiredHeaders: classificationsHeaderValidation.missingRequiredHeaders,
            reason: classificationsHeaderValidation.reason
          }],
          invalidRows: []
        });
      }
      
      // Perform data integrity validation
      const validationResult = validationService.validateStringsAgainstClassifications(
        stringsRows, 
        classificationsRows
      );
      
      if (validationResult.valid) {
        logger.info('Validation completed: PASSED');
        return res.json({
          success: true,
          valid: true
        });
      } else {
        logger.warn(`Validation completed: FAILED - ${validationResult.invalidRows.length} invalid rows`);
        return res.status(400).json({
          success: false,
          valid: false,
          headerErrors: [],
          invalidRows: validationResult.invalidRows
        });
      }
      
    } catch (error) {
      logger.error('Validation error:', error);
      next(error);
    }
  }

  /**
   * Export data as CSV (only when validation passes)
   */
  async exportData(req, res, next) {
    try {
      const { rows, headers, filename = 'export.csv', validationPassed = false } = req.body;
      
      // Only allow export if validation has passed
      if (!validationPassed) {
        return res.status(400).json({
          success: false,
          error: 'Export not allowed - data must be validated first',
          code: 'VALIDATION_REQUIRED'
        });
      }
      
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
