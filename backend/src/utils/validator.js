/**
 * Validation module for strings vs classifications
 * Validates that each strings row has a corresponding classification
 */

const { normalizeValue } = require('./headerValidator');

/**
 * Normalizes a value for comparison (trim, lowercase)
 * @param {any} value - The value to normalize
 * @returns {string} - Normalized string
 */
function normalize(value) {
  return normalizeValue(value);
}

/**
 * Creates a classification key from Topic, SubTopic, and Industry
 * @param {Object} row - Row object with Topic, SubTopic, Industry
 * @returns {string} - Normalized classification key
 */
function createClassificationKey(row) {
  const topic = normalize(row.Topic);
  const subtopic = normalize(row.SubTopic);
  const industry = normalize(row.Industry);
  
  return `${topic}||${subtopic}||${industry}`;
}

/**
 * Validates strings data against classifications data
 * @param {Array} stringsRows - Array of strings data rows
 * @param {Array} classificationsRows - Array of classifications data rows
 * @returns {Object} - Validation result with valid flag and invalidRows array
 */
function validateStringsAgainstClassifications(stringsRows, classificationsRows) {
  // Build classification keys set for fast lookup
  const classificationKeys = new Set();
  
  classificationsRows.forEach(row => {
    const key = createClassificationKey(row);
    if (key !== '||||') { // Skip empty keys
      classificationKeys.add(key);
    }
  });
  
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
    const classificationKey = createClassificationKey(row);
    
    if (!classificationKeys.has(classificationKey)) {
      invalidRows.push({
        rowIndex: index,
        row: row,
        reason: `No classification for Topic='${row.Topic}', SubTopic='${row.SubTopic}', Industry='${row.Industry}'`
      });
    }
  });
  
  return {
    valid: invalidRows.length === 0,
    invalidRows: invalidRows
  };
}

/**
 * Validates that required headers are present in the data
 * @param {Array} rows - Array of data rows
 * @param {Array} requiredHeaders - Array of required header names
 * @returns {Object} - Validation result
 */
function validateRequiredHeaders(rows, requiredHeaders) {
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

module.exports = {
  validateStringsAgainstClassifications,
  validateRequiredHeaders,
  normalize,
  createClassificationKey
};
