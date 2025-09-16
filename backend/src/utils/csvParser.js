const { parse } = require('csv-parse');

/**
 * Normalizes CSV headers to canonical format
 * @param {string} header - The original header string
 * @returns {string} - Normalized header
 */
function normalizeHeader(header) {
  if (!header || typeof header !== 'string') {
    return '';
  }
  
  // Trim and convert to lowercase, then remove spaces, hyphens, underscores
  const normalized = header.trim().toLowerCase().replace(/[\s\-_]/g, '');
  
  // Map variants to canonical keys
  const headerMap = {
    'subtopic': 'SubTopic',
    'subtopic': 'SubTopic',
    'topic': 'Topic',
    'industry': 'Industry',
    'classification': 'Classification',
    'prompt': 'Prompt',
    'risks': 'Risks',
    'keywords': 'Keywords'
  };
  
  return headerMap[normalized] || header.trim();
}

/**
 * Parses CSV buffer and returns normalized data
 * @param {Buffer} buffer - CSV file buffer
 * @returns {Promise<{headers: string[], rows: Object[]}>} - Parsed data with normalized headers
 */
async function parseCSV(buffer) {
  return new Promise((resolve, reject) => {
    const rows = [];
    let headers = [];
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
          headers = record.map(normalizeHeader);
          isFirstRow = false;
        } else {
          // Convert row to object with normalized headers
          const rowObj = {};
          record.forEach((value, index) => {
            const header = headers[index] || `column_${index}`;
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
      resolve({
        headers,
        rows
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
  normalizeHeader,
  validateHeaders
};
