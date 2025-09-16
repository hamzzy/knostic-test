const logger = require('../config/logger');
const { ValidationError } = require('../utils/errors');

class ValidationService {
  /**
   * Normalizes a value for comparison (trim, lowercase)
   * @param {any} value - The value to normalize
   * @returns {string} - Normalized string
   */
  normalize(value) {
    return String(value || '').trim().toLowerCase();
  }

  /**
   * Creates a classification key from Topic, SubTopic, and Industry
   * @param {Object} row - Row object with Topic, SubTopic, Industry
   * @returns {string} - Normalized classification key
   */
  createClassificationKey(row) {
    const topic = this.normalize(row.Topic);
    const subtopic = this.normalize(row.SubTopic);
    const industry = this.normalize(row.Industry);
    
    return `${topic}||${subtopic}||${industry}`;
  }

  /**
   * Validates strings data against classifications data
   * @param {Array} stringsRows - Array of strings data rows
   * @param {Array} classificationsRows - Array of classifications data rows
   * @returns {Object} - Validation result with valid flag and invalidRows array
   */
  validateStringsAgainstClassifications(stringsRows, classificationsRows) {
    logger.info(`Starting validation of ${stringsRows.length} strings against ${classificationsRows.length} classifications`);
    
    // Build classification keys set for fast lookup
    const classificationKeys = new Set();
    
    classificationsRows.forEach(row => {
      const key = this.createClassificationKey(row);
      if (key !== '||||') { // Skip empty keys
        classificationKeys.add(key);
      }
    });
    
    logger.info(`Built classification keys set with ${classificationKeys.size} unique keys`);
    
    const invalidRows = [];
    
    stringsRows.forEach((row, index) => {
      // Check for missing required fields
      if (!row.Topic || !row.SubTopic || !row.Industry) {
        const missingFields = [];
        if (!row.Topic) missingFields.push('Topic');
        if (!row.SubTopic) missingFields.push('SubTopic');
        if (!row.Industry) missingFields.push('Industry');
        
        invalidRows.push({
          rowIndex: index,
          row: row,
          reason: `Missing required fields: ${missingFields.join(', ')}`
        });
        return;
      }
      
      // Check if classification exists
      const classificationKey = this.createClassificationKey(row);
      
      if (!classificationKeys.has(classificationKey)) {
        invalidRows.push({
          rowIndex: index,
          row: row,
          reason: `No classification for Topic='${row.Topic}', SubTopic='${row.SubTopic}', Industry='${row.Industry}'`
        });
      }
    });
    
    const isValid = invalidRows.length === 0;
    logger.info(`Validation completed: ${isValid ? 'PASSED' : 'FAILED'} - ${invalidRows.length} invalid rows found`);
    
    return {
      valid: isValid,
      invalidRows: invalidRows
    };
  }

  /**
   * Validates that required headers are present in the data
   * @param {Array} rows - Array of data rows
   * @param {Array} requiredHeaders - Array of required header names
   * @returns {Object} - Validation result
   */
  validateRequiredHeaders(rows, requiredHeaders) {
    if (rows.length === 0) {
      return {
        valid: false,
        missingHeaders: requiredHeaders,
        reason: 'No data rows found'
      };
    }
    
    const availableHeaders = Object.keys(rows[0]);
    const missingHeaders = requiredHeaders.filter(header => 
      !availableHeaders.includes(header)
    );
    
    return {
      valid: missingHeaders.length === 0,
      missingHeaders: missingHeaders,
      reason: missingHeaders.length > 0 ? 
        `Missing required headers: ${missingHeaders.join(', ')}` : 
        'All required headers present'
    };
  }

  /**
   * Validates export data structure
   * @param {Array} rows - Data rows to validate
   * @param {Array} headers - Headers to validate
   * @returns {Object} - Validation result
   */
  validateExportData(rows, headers) {
    if (!Array.isArray(rows)) {
      throw new ValidationError('Rows must be an array');
    }

    if (!Array.isArray(headers)) {
      throw new ValidationError('Headers must be an array');
    }

    if (headers.length === 0) {
      throw new ValidationError('Headers cannot be empty');
    }

    if (rows.length === 0) {
      return {
        valid: true,
        warning: 'No data rows to export'
      };
    }

    // Check if all rows have the same structure
    const firstRowKeys = Object.keys(rows[0]);
    const hasConsistentStructure = rows.every(row => {
      const rowKeys = Object.keys(row);
      return rowKeys.length === firstRowKeys.length && 
             rowKeys.every(key => firstRowKeys.includes(key));
    });

    if (!hasConsistentStructure) {
      throw new ValidationError('All rows must have consistent structure');
    }

    return {
      valid: true
    };
  }
}

module.exports = new ValidationService();
