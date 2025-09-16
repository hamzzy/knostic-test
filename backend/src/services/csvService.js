const { parse } = require('csv-parse');
const { Readable, PassThrough } = require('stream');
const csv = require('fast-csv');
const logger = require('../config/logger');
const { CsvParseError } = require('../utils/errors');

class CsvService {
  /**
   * Normalizes CSV headers to canonical format
   * @param {string} header - The original header string
   * @returns {string} - Normalized header
   */
  normalizeHeader(header) {
    if (!header || typeof header !== 'string') {
      return '';
    }
    
    // Trim and convert to lowercase, then remove spaces, hyphens, underscores
    const normalized = header.trim().toLowerCase().replace(/[\s\-_]/g, '');
    
    // Map variants to canonical keys
    const headerMap = {
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
  async parseCSV(buffer) {
    return new Promise((resolve, reject) => {
      const rows = [];
      let headers = [];
      let isFirstRow = true;
      
      const parser = parse({
        columns: false,
        skip_empty_lines: true,
        trim: true,
        relax_column_count: true,
        skip_records_with_error: true
      });
      
      parser.on('readable', function() {
        let record;
        while ((record = parser.read()) !== null) {
          if (isFirstRow) {
            headers = record.map(header => this.normalizeHeader(header));
            isFirstRow = false;
          } else {
            const rowObj = {};
            record.forEach((value, index) => {
              const header = headers[index] || `column_${index}`;
              rowObj[header] = value;
            });
            rows.push(rowObj);
          }
        }
      }.bind(this));
      
      parser.on('error', function(err) {
        logger.error('CSV parsing error:', err);
        reject(new CsvParseError(`CSV parsing error: ${err.message}`, err));
      });
      
      parser.on('end', function() {
        logger.info(`Successfully parsed CSV with ${headers.length} headers and ${rows.length} rows`);
        resolve({ headers, rows });
      });
      
      parser.write(buffer);
      parser.end();
    });
  }

  /**
   * Exports data to CSV format with streaming
   * @param {Array} rows - Array of data objects to export
   * @param {Array} headers - Array of header names
   * @param {Object} options - Export options
   * @returns {ReadableStream} - Stream of CSV data
   */
  exportToCSV(rows, headers = null, options = {}) {
    const {
      delimiter = ',',
      quote = '"',
      escape = '"',
      writeHeaders = true
    } = options;

    if (!headers && rows.length > 0) {
      headers = Object.keys(rows[0]);
    }

    if (!headers || headers.length === 0) {
      const emptyStream = new Readable();
      emptyStream.push(null);
      return emptyStream;
    }

    // Handle empty rows but with headers - still generate header row
    if (rows.length === 0) {
      const passThrough = new PassThrough();
      const csvStream = csv.format({
        headers: writeHeaders ? headers : false,
        delimiter,
        quote,
        escape
      });
      
      csvStream.pipe(passThrough);
      
      // Write headers and end the stream
      if (writeHeaders && headers.length > 0) {
        csvStream.write({});
      }
      csvStream.end();
      
      return passThrough;
    }

    const passThrough = new PassThrough();
    const csvStream = csv.format({
      headers: writeHeaders ? headers : false,
      delimiter,
      quote,
      escape
    });

    csvStream.pipe(passThrough);

    setImmediate(() => {
      rows.forEach(row => {
        const normalizedRow = {};
        headers.forEach(header => {
          normalizedRow[header] = row[header] || '';
        });
        csvStream.write(normalizedRow);
      });
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
  async exportToCSVBuffer(rows, headers = null, options = {}) {
    return new Promise((resolve, reject) => {
      const chunks = [];
      const stream = this.exportToCSV(rows, headers, options);
      
      stream.on('data', chunk => {
        chunks.push(chunk);
      });
      
      stream.on('end', () => {
        resolve(Buffer.concat(chunks));
      });
      
      stream.on('error', reject);

      if (!rows || rows.length === 0) {
        setTimeout(() => {
          if (chunks.length === 0) {
            resolve(Buffer.from(''));
          }
        }, 100);
      }
    });
  }
}

module.exports = new CsvService();
