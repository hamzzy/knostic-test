const csv = require('fast-csv');
const { Readable, PassThrough } = require('stream');

/**
 * Exports data to CSV format with streaming
 * @param {Array} rows - Array of data objects to export
 * @param {Array} headers - Array of header names (optional, will use object keys if not provided)
 * @param {Object} options - Export options
 * @returns {ReadableStream} - Stream of CSV data
 */
function exportToCSV(rows, headers = null, options = {}) {
  const {
    delimiter = ',',
    quote = '"',
    escape = '"',
    writeHeaders = true
  } = options;

  // If no headers provided, extract from first row
  if (!headers && rows.length > 0) {
    headers = Object.keys(rows[0]);
  }

  // If no headers and no rows, return empty stream
  if (!headers || headers.length === 0) {
    const emptyStream = new Readable();
    emptyStream.push(null);
    return emptyStream;
  }

  // Create a pass-through stream
  const passThrough = new PassThrough();

  // Create CSV formatter
  const csvStream = csv.format({
    headers: writeHeaders ? headers : false,
    delimiter,
    quote,
    escape
  });

  // Pipe CSV stream to pass-through
  csvStream.pipe(passThrough);

  // Write data to csv stream asynchronously
  setImmediate(() => {
    rows.forEach(row => {
      // Ensure row has all headers, fill missing with empty string
      const normalizedRow = {};
      headers.forEach(header => {
        normalizedRow[header] = row[header] || '';
      });
      csvStream.write(normalizedRow);
    });

    // End the csv stream
    csvStream.end();
  });

  return passThrough;
}

/**
 * Exports data to CSV and returns as Buffer
 * @param {Array} rows - Array of data objects to export
 * @param {Array} headers - Array of header names
 * @param {Object} options - Export options
 * @returns {Promise<Buffer>} - CSV data as buffer
 */
async function exportToCSVBuffer(rows, headers = null, options = {}) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    const stream = exportToCSV(rows, headers, options);
    
    stream.on('data', chunk => {
      chunks.push(chunk);
    });
    
    stream.on('end', () => {
      resolve(Buffer.concat(chunks));
    });
    
    stream.on('error', reject);

    // Handle timeout for empty data
    if (!rows || rows.length === 0) {
      setTimeout(() => {
        if (chunks.length === 0) {
          resolve(Buffer.from(''));
        }
      }, 100);
    }
  });
}

/**
 * Validates export data
 * @param {Array} rows - Data rows to validate
 * @param {Array} headers - Headers to validate
 * @returns {Object} - Validation result
 */
function validateExportData(rows, headers) {
  if (!Array.isArray(rows)) {
    return {
      valid: false,
      error: 'Rows must be an array'
    };
  }

  if (!Array.isArray(headers)) {
    return {
      valid: false,
      error: 'Headers must be an array'
    };
  }

  if (headers.length === 0) {
    return {
      valid: false,
      error: 'Headers cannot be empty'
    };
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
    return {
      valid: false,
      error: 'All rows must have consistent structure'
    };
  }

  return {
    valid: true
  };
}

module.exports = {
  exportToCSV,
  exportToCSVBuffer,
  validateExportData
};
