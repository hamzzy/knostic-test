const { exportToCSV, exportToCSVBuffer, validateExportData } = require('../csvExporter');

describe('CSV Exporter', () => {
  describe('validateExportData', () => {
    test('should validate valid data', () => {
      const rows = [
        { Topic: 'Payments', SubTopic: 'ACH', Industry: 'Fintech' },
        { Topic: 'Banking', SubTopic: 'Loans', Industry: 'Finance' }
      ];
      const headers = ['Topic', 'SubTopic', 'Industry'];
      
      const result = validateExportData(rows, headers);
      
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    test('should reject non-array rows', () => {
      const result = validateExportData('not an array', ['Topic']);
      
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Rows must be an array');
    });

    test('should reject non-array headers', () => {
      const result = validateExportData([], 'not an array');
      
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Headers must be an array');
    });

    test('should reject empty headers', () => {
      const result = validateExportData([{ Topic: 'Test' }], []);
      
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Headers cannot be empty');
    });

    test('should warn for empty rows', () => {
      const result = validateExportData([], ['Topic']);
      
      expect(result.valid).toBe(true);
      expect(result.warning).toBe('No data rows to export');
    });

    test('should reject inconsistent row structure', () => {
      const rows = [
        { Topic: 'Payments', SubTopic: 'ACH' },
        { Topic: 'Banking', SubTopic: 'Loans', Industry: 'Finance' }
      ];
      const headers = ['Topic', 'SubTopic', 'Industry'];
      
      const result = validateExportData(rows, headers);
      
      expect(result.valid).toBe(false);
      expect(result.error).toBe('All rows must have consistent structure');
    });
  });

  describe('exportToCSVBuffer', () => {
    test('should export simple data to CSV buffer', async () => {
      const rows = [
        { Topic: 'Payments', SubTopic: 'ACH', Industry: 'Fintech' },
        { Topic: 'Banking', SubTopic: 'Loans', Industry: 'Finance' }
      ];
      const headers = ['Topic', 'SubTopic', 'Industry'];
      
      const buffer = await exportToCSVBuffer(rows, headers);
      const csvContent = buffer.toString('utf8');
      
      expect(csvContent).toContain('Topic,SubTopic,Industry');
      expect(csvContent).toContain('Payments,ACH,Fintech');
      expect(csvContent).toContain('Banking,Loans,Finance');
    });

    test('should export data with custom headers order', async () => {
      const rows = [
        { Topic: 'Payments', SubTopic: 'ACH', Industry: 'Fintech' }
      ];
      const headers = ['Industry', 'Topic', 'SubTopic'];
      
      const buffer = await exportToCSVBuffer(rows, headers);
      const csvContent = buffer.toString('utf8');
      
      expect(csvContent).toContain('Industry,Topic,SubTopic');
      expect(csvContent).toContain('Fintech,Payments,ACH');
    });

    test('should handle empty rows', async () => {
      const rows = [];
      const headers = ['Topic', 'SubTopic', 'Industry'];
      
      const buffer = await exportToCSVBuffer(rows, headers);
      const csvContent = buffer.toString('utf8');
      
      // Should contain headers even with empty rows
      expect(csvContent).toMatch(/Topic.*SubTopic.*Industry/);
    });

    test('should handle missing values in rows', async () => {
      const rows = [
        { Topic: 'Payments', SubTopic: 'ACH' }, // Missing Industry
        { Topic: 'Banking', Industry: 'Finance' } // Missing SubTopic
      ];
      const headers = ['Topic', 'SubTopic', 'Industry'];
      
      const buffer = await exportToCSVBuffer(rows, headers);
      const csvContent = buffer.toString('utf8');
      
      expect(csvContent).toContain('Topic,SubTopic,Industry');
      expect(csvContent).toContain('Payments,ACH,');
      expect(csvContent).toContain('Banking,,Finance');
    });

    test('should handle special characters in data', async () => {
      const rows = [
        { Topic: 'Payments, Inc', SubTopic: 'ACH "Transfer"', Industry: 'Fintech\nNewline' }
      ];
      const headers = ['Topic', 'SubTopic', 'Industry'];
      
      const buffer = await exportToCSVBuffer(rows, headers);
      const csvContent = buffer.toString('utf8');
      
      expect(csvContent).toContain('"Payments, Inc"');
      expect(csvContent).toContain('"ACH ""Transfer"""');
      expect(csvContent).toContain('"Fintech\nNewline"');
    });

    test('should use custom options', async () => {
      const rows = [
        { Topic: 'Payments', SubTopic: 'ACH', Industry: 'Fintech' }
      ];
      const headers = ['Topic', 'SubTopic', 'Industry'];
      const options = {
        delimiter: ';',
        writeHeaders: false
      };
      
      const buffer = await exportToCSVBuffer(rows, headers, options);
      const csvContent = buffer.toString('utf8');
      
      expect(csvContent).toContain('Payments;ACH;Fintech');
    });
  });

  describe('exportToCSV', () => {
    test('should create readable stream', (done) => {
      const rows = [
        { Topic: 'Payments', SubTopic: 'ACH', Industry: 'Fintech' }
      ];
      const headers = ['Topic', 'SubTopic', 'Industry'];
      
      const stream = exportToCSV(rows, headers);
      let data = '';
      
      stream.on('data', chunk => {
        data += chunk.toString();
      });
      
      stream.on('end', () => {
        expect(data).toContain('Topic,SubTopic,Industry');
        expect(data).toContain('Payments,ACH,Fintech');
        done();
      });
      
      stream.on('error', done);
    });

    test('should handle null headers gracefully', (done) => {
      const rows = [];
      const headers = null; // This should return empty stream
      
      const stream = exportToCSV(rows, headers);
      let data = '';
      
      stream.on('data', chunk => {
        data += chunk.toString();
      });
      
      stream.on('end', () => {
        expect(data).toBe('');
        done();
      });
      
      stream.on('error', done);
    });
  });
});
