const { parse } = require('csv-parse');
const { normalizeHeader, createHeaderMapping, detectRole, mapRowsToCanonical } = require('./headerValidator');

/**
 * Normalizes CSV headers to canonical format (legacy function for backward compatibility)
 * @param {string} header - The original header string
 * @returns {string} - Normalized header
 */
function normalizeHeaderLegacy(header) {
  return normalizeHeader(header);
}

/**
 * Parses CSV buffer and returns comprehensive validation data
 * @param {Buffer} buffer - CSV file buffer
 * @returns {Promise<Object>} - Parsed data with validation information
 */
async function parseCSV(buffer) {
  return new Promise((resolve, reject) => {
    const rows = [];
    let originalHeaders = [];
    let isFirstRow = true;
    
    const parser = parse({
      columns: false, // We'll handle headers manually
      skip_empty_lines: true,
      trim: true,
      relax_column_count: true, // Allow variable column counts
      skip_records_with_error: true // Skip malformed records instead of failing
    });
    
    parser.on('readable', function() {
      let record;
      while ((record = parser.read()) !== null) {
        if (isFirstRow) {
          // First row contains headers
          originalHeaders = record;
          isFirstRow = false;
        } else {
          // Convert row to object with original headers as keys
          const rowObj = {};
          record.forEach((value, index) => {
            const header = originalHeaders[index] || `column_${index}`;
            rowObj[header] = value;
          });
          rows.push(rowObj);
        }
      }
    });
    
    parser.on('error', function(err) {
      reject(new Error(`CSV parsing error: ${err.message}`));
    });
    
    parser.on('end', function() {
      // Create header mapping and detect role
      const headerMapping = createHeaderMapping(originalHeaders);
      const roleDetection = detectRole(originalHeaders);
      
      // Map rows to canonical field names
      const canonicalRows = mapRowsToCanonical(rows, headerMapping);
      
      resolve({
        originalHeaders,
        headers: Object.values(headerMapping), // Canonical headers
        rows: canonicalRows,
        headerMapping,
        roleDetection,
        // Legacy format for backward compatibility
        normalizedHeaders: Object.values(headerMapping)
      });
    });
    
    // Write buffer to parser
    parser.write(buffer);
    parser.end();
  });
}

/**
 * Validates that required headers are present
 * @param {string[]} headers - Array of normalized headers
 * @param {string[]} requiredHeaders - Array of required header names
 * @returns {Object} - Validation result with isValid and missingHeaders
 */
function validateHeaders(headers, requiredHeaders = []) {
  const missingHeaders = requiredHeaders.filter(header => 
    !headers.includes(header)
  );
  
  return {
    isValid: missingHeaders.length === 0,
    missingHeaders
  };
}

module.exports = {
  parseCSV,
  normalizeHeader: normalizeHeaderLegacy, // Legacy compatibility
  validateHeaders
};
