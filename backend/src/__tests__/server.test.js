const request = require('supertest');
const app = require('../app');

describe('CSV Upload API', () => {
  describe('POST /api/csv/upload', () => {
    test('should upload and parse single CSV file', async () => {
      const csvContent = 'Topic,SubTopic,Industry\nPayments,ACH,Fintech\nBanking,Loans,Finance';
      
      const response = await request(app)
        .post('/api/csv/upload')
        .attach('files', Buffer.from(csvContent, 'utf8'), 'test.csv')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.files).toBeDefined();
      expect(response.body.files['test.csv']).toBeDefined();
      
      const file = response.body.files['test.csv'];
      expect(file.originalName).toBe('test.csv');
      expect(file.headers).toEqual(['Topic', 'SubTopic', 'Industry']);
      expect(file.rows).toHaveLength(2);
      expect(file.rowCount).toBe(2);
      expect(file.detectedRole).toBe('unknown');
      expect(file.headerValid).toBe(false);
    });

    test('should upload and parse multiple CSV files', async () => {
      const csv1 = 'Topic,SubTopic,Industry\nPayments,ACH,Fintech';
      const csv2 = 'Classification,Description\nACH,Automated Clearing House';
      
      const response = await request(app)
        .post('/api/csv/upload')
        .attach('files', Buffer.from(csv1, 'utf8'), 'strings.csv')
        .attach('files', Buffer.from(csv2, 'utf8'), 'classifications.csv')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.files).toBeDefined();
      expect(response.body.files['strings.csv']).toBeDefined();
      expect(response.body.files['classifications.csv']).toBeDefined();
      
      const stringsFile = response.body.files['strings.csv'];
      const classificationsFile = response.body.files['classifications.csv'];
      
      expect(stringsFile.headers).toEqual(['Topic', 'SubTopic', 'Industry']);
      expect(classificationsFile.headers).toEqual(['Classification', 'Description']);
    });

    test('should normalize headers correctly', async () => {
      const csvContent = 'topic,sub_topic,industry\nPayments,ACH,Fintech';
      
      const response = await request(app)
        .post('/api/csv/upload')
        .attach('files', Buffer.from(csvContent, 'utf8'), 'test.csv')
        .expect(200);

      const file = response.body.files['test.csv'];
      expect(file.headers).toEqual(['Topic', 'SubTopic', 'Industry']);
      expect(file.rows[0]).toEqual({
        Topic: 'Payments',
        SubTopic: 'ACH',
        Industry: 'Fintech'
      });
    });

    test('should reject non-CSV files', async () => {
      const response = await request(app)
        .post('/api/csv/upload')
        .attach('files', Buffer.from('not a csv', 'utf8'), 'test.txt')
        .expect(400); // File filter error returns 400

      expect(response.body.error).toBe('Only CSV files are allowed');
    });

    test('should reject when no files uploaded', async () => {
      const response = await request(app)
        .post('/api/csv/upload')
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
    });

    test('should handle malformed CSV gracefully', async () => {
      const malformedCsv = 'Topic,SubTopic,Industry\nPayments,ACH\nIncomplete,Row';
      
      const response = await request(app)
        .post('/api/csv/upload')
        .attach('files', Buffer.from(malformedCsv, 'utf8'), 'malformed.csv')
        .expect(200);

      expect(response.body.success).toBe(true);
      const file = response.body.files['malformed.csv'];
      expect(file.originalName).toBe('malformed.csv');
      expect(file.rows).toBeDefined();
      expect(file.rows.length).toBeGreaterThan(0);
    });

    test('should enforce file size limit', async () => {
      // Create a large CSV content (over 10MB)
      const largeContent = 'Topic,SubTopic,Industry\n' + 
        'Payments,ACH,Fintech\n'.repeat(500000); // This should exceed 10MB
      
      const response = await request(app)
        .post('/api/csv/upload')
        .attach('files', Buffer.from(largeContent, 'utf8'), 'large.csv')
        .expect(400);

      expect(response.body.error).toBe('File too large');
    });

    test('should enforce file count limit', async () => {
      const csvContent = 'Topic,SubTopic,Industry\nPayments,ACH,Fintech';
      
      const response = await request(app)
        .post('/api/csv/upload')
        .attach('files', Buffer.from(csvContent, 'utf8'), 'file1.csv')
        .attach('files', Buffer.from(csvContent, 'utf8'), 'file2.csv')
        .attach('files', Buffer.from(csvContent, 'utf8'), 'file3.csv')
        .attach('files', Buffer.from(csvContent, 'utf8'), 'file4.csv')
        .attach('files', Buffer.from(csvContent, 'utf8'), 'file5.csv')
        .attach('files', Buffer.from(csvContent, 'utf8'), 'file6.csv')
        .expect(400); // Multer error handling returns 400

      expect(response.body.error).toBe('Too many files');
    });
  });

  describe('GET /api/health', () => {
    test('should return health status', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      expect(response.body.status).toBe('OK');
      expect(response.body.timestamp).toBeDefined();
    });
  });

  describe('POST /api/csv/validate', () => {
    test('should validate strings against classifications successfully', async () => {
      const strings = {
        headers: ['Tier', 'Industry', 'Topic', 'SubTopic', 'Prefix', 'Fuzzing-Idx', 'Prompt', 'Risks', 'Keywords'],
        rows: [
          { Tier: '1', Industry: 'Fintech', Topic: 'Payments', SubTopic: 'ACH', Prefix: 'ACH', 'Fuzzing-Idx': '1', Prompt: 'Test prompt', Risks: 'Low', Keywords: 'payment,ach' },
          { Tier: '2', Industry: 'Finance', Topic: 'Banking', SubTopic: 'Loans', Prefix: 'LOAN', 'Fuzzing-Idx': '2', Prompt: 'Test prompt 2', Risks: 'Medium', Keywords: 'banking,loan' }
        ]
      };
      
      const classifications = {
        headers: ['Topic', 'SubTopic', 'Industry', 'Classification'],
        rows: [
          { Topic: 'Payments', SubTopic: 'ACH', Industry: 'Fintech', Classification: 'Standard' },
          { Topic: 'Banking', SubTopic: 'Loans', Industry: 'Finance', Classification: 'Standard' },
          { Topic: 'Payments', SubTopic: 'Credit Cards', Industry: 'Fintech', Classification: 'Standard' }
        ]
      };
      
      const response = await request(app)
        .post('/api/csv/validate')
        .send({ strings, classifications });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.valid).toBe(true);
    });

    test('should identify invalid strings', async () => {
      const strings = {
        headers: ['Tier', 'Industry', 'Topic', 'SubTopic', 'Prefix', 'Fuzzing-Idx', 'Prompt', 'Risks', 'Keywords'],
        rows: [
          { Tier: '1', Industry: 'Fintech', Topic: 'Payments', SubTopic: 'ACH', Prefix: 'ACH', 'Fuzzing-Idx': '1', Prompt: 'Test prompt', Risks: 'Low', Keywords: 'payment,ach' },
          { Tier: '2', Industry: 'Missing', Topic: 'Unknown', SubTopic: 'Topic', Prefix: 'UNK', 'Fuzzing-Idx': '2', Prompt: 'Test prompt 2', Risks: 'High', Keywords: 'unknown' }
        ]
      };
      
      const classifications = {
        headers: ['Topic', 'SubTopic', 'Industry', 'Classification'],
        rows: [
          { Topic: 'Payments', SubTopic: 'ACH', Industry: 'Fintech', Classification: 'Standard' }
        ]
      };
      
      const response = await request(app)
        .post('/api/csv/validate')
        .send({ strings, classifications })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.valid).toBe(false);
      expect(response.body.invalidRows).toHaveLength(1);
      expect(response.body.invalidRows[0].rowIndex).toBe(1);
      expect(response.body.invalidRows[0].reason).toContain('No classification');
    });

    test('should handle missing required fields', async () => {
      const strings = {
        headers: ['Tier', 'Industry', 'Topic', 'SubTopic', 'Prefix', 'Fuzzing-Idx', 'Prompt', 'Risks', 'Keywords'],
        rows: [
          { Tier: '1', Industry: 'Fintech', Topic: 'Payments', SubTopic: 'ACH', Prefix: 'ACH', 'Fuzzing-Idx': '1', Prompt: 'Test prompt', Risks: 'Low', Keywords: 'payment,ach' },
          { Tier: '2', Industry: 'Fintech', Topic: 'Payments', SubTopic: '', Prefix: 'ACH', 'Fuzzing-Idx': '2', Prompt: 'Test prompt 2', Risks: 'Low', Keywords: 'payment' }
        ]
      };
      
      const classifications = {
        headers: ['Topic', 'SubTopic', 'Industry', 'Classification'],
        rows: [
          { Topic: 'Payments', SubTopic: 'ACH', Industry: 'Fintech', Classification: 'Standard' }
        ]
      };
      
      const response = await request(app)
        .post('/api/csv/validate')
        .send({ strings, classifications })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.valid).toBe(false);
      expect(response.body.invalidRows).toHaveLength(1);
      expect(response.body.invalidRows[0].reason).toContain('Missing required fields');
    });

    test('should handle case-insensitive matching', async () => {
      const strings = {
        headers: ['Tier', 'Industry', 'Topic', 'SubTopic', 'Prefix', 'Fuzzing-Idx', 'Prompt', 'Risks', 'Keywords'],
        rows: [
          { Tier: '1', Industry: 'fintech', Topic: 'payments', SubTopic: 'ach', Prefix: 'ACH', 'Fuzzing-Idx': '1', Prompt: 'Test prompt', Risks: 'Low', Keywords: 'payment,ach' }
        ]
      };
      
      const classifications = {
        headers: ['Topic', 'SubTopic', 'Industry', 'Classification'],
        rows: [
          { Topic: 'Payments', SubTopic: 'ACH', Industry: 'Fintech', Classification: 'Standard' }
        ]
      };
      
      const response = await request(app)
        .post('/api/csv/validate')
        .send({ strings, classifications })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.valid).toBe(true);
    });

    test('should reject missing stringsData', async () => {
      const response = await request(app)
        .post('/api/csv/validate')
        .send({ classificationsData: [] })
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
    });

    test('should reject missing classificationsData', async () => {
      const response = await request(app)
        .post('/api/csv/validate')
        .send({ stringsData: [] })
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
    });

    test('should reject invalid stringsData type', async () => {
      const response = await request(app)
        .post('/api/csv/validate')
        .send({ stringsData: 'not an array', classificationsData: [] })
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
    });

    test('should reject strings data with missing required headers', async () => {
      const stringsData = [
        { Topic: 'Payments', SubTopic: 'ACH' } // Missing Industry
      ];
      
      const classificationsData = [
        { Topic: 'Payments', SubTopic: 'ACH', Industry: 'Fintech' }
      ];
      
      const response = await request(app)
        .post('/api/csv/validate')
        .send({ stringsData, classificationsData })
        .expect(400);

      expect(response.body.error).toContain('Validation failed');
    });

    test('should reject classifications data with missing required headers', async () => {
      const stringsData = [
        { Topic: 'Payments', SubTopic: 'ACH', Industry: 'Fintech' }
      ];
      
      const classificationsData = [
        { Topic: 'Payments', SubTopic: 'ACH' } // Missing Industry
      ];
      
      const response = await request(app)
        .post('/api/csv/validate')
        .send({ stringsData, classificationsData })
        .expect(400);

      expect(response.body.error).toContain('Validation failed');
    });
  });

  describe('POST /api/csv/export', () => {
    test('should export data as CSV', async () => {
      const rows = [
        { Topic: 'Payments', SubTopic: 'ACH', Industry: 'Fintech' },
        { Topic: 'Banking', SubTopic: 'Loans', Industry: 'Finance' }
      ];
      const headers = ['Topic', 'SubTopic', 'Industry'];
      
      const response = await request(app)
        .post('/api/csv/export')
        .send({ rows, headers, filename: 'test.csv', validationPassed: true })
        .expect(200);

      expect(response.headers['content-type']).toContain('text/csv');
      expect(response.headers['content-disposition']).toContain('attachment; filename="test.csv"');
      expect(response.text).toContain('Topic,SubTopic,Industry');
      expect(response.text).toContain('Payments,ACH,Fintech');
      expect(response.text).toContain('Banking,Loans,Finance');
    });

    test('should export with custom filename', async () => {
      const rows = [{ Topic: 'Payments', SubTopic: 'ACH', Industry: 'Fintech' }];
      const headers = ['Topic', 'SubTopic', 'Industry'];
      
      const response = await request(app)
        .post('/api/csv/export')
        .send({ rows, headers, filename: 'custom-export.csv', validationPassed: true })
        .expect(200);

      expect(response.headers['content-disposition']).toContain('attachment; filename="custom-export.csv"');
    });

    test('should use default filename when not provided', async () => {
      const rows = [{ Topic: 'Payments', SubTopic: 'ACH', Industry: 'Fintech' }];
      const headers = ['Topic', 'SubTopic', 'Industry'];
      
      const response = await request(app)
        .post('/api/csv/export')
        .send({ rows, headers, validationPassed: true })
        .expect(200);

      expect(response.headers['content-disposition']).toContain('attachment; filename="export.csv"');
    });

    test('should handle empty rows', async () => {
      const rows = [];
      const headers = ['Topic', 'SubTopic', 'Industry'];
      
      const response = await request(app)
        .post('/api/csv/export')
        .send({ rows, headers, validationPassed: true })
        .expect(200);

      // Empty rows should still generate headers
      expect(response.text).toContain('Topic,SubTopic,Industry');
    });

    test('should reject export when validation has not passed', async () => {
      const rows = [{ Topic: 'Payments', SubTopic: 'ACH', Industry: 'Fintech' }];
      const headers = ['Topic', 'SubTopic', 'Industry'];
      
      const response = await request(app)
        .post('/api/csv/export')
        .send({ rows, headers, validationPassed: false })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Export not allowed - data must be validated first');
      expect(response.body.code).toBe('VALIDATION_REQUIRED');
    });

    test('should reject missing rows', async () => {
      const response = await request(app)
        .post('/api/csv/export')
        .send({ headers: ['Topic'], validationPassed: true })
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
    });

    test('should reject missing headers', async () => {
      const response = await request(app)
        .post('/api/csv/export')
        .send({ rows: [{ Topic: 'Test' }], validationPassed: true })
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
    });

    test('should reject invalid rows type', async () => {
      const response = await request(app)
        .post('/api/csv/export')
        .send({ rows: 'not an array', headers: ['Topic'], validationPassed: true })
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
    });

    test('should reject invalid headers type', async () => {
      const response = await request(app)
        .post('/api/csv/export')
        .send({ rows: [{ Topic: 'Test' }], headers: 'not an array', validationPassed: true })
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
    });

    test('should reject empty headers', async () => {
      const response = await request(app)
        .post('/api/csv/export')
        .send({ rows: [{ Topic: 'Test' }], headers: [], validationPassed: true })
        .expect(400);

      expect(response.body.error).toBe('Headers cannot be empty');
    });

    test('should reject inconsistent row structure', async () => {
      const rows = [
        { Topic: 'Payments', SubTopic: 'ACH' },
        { Topic: 'Banking', SubTopic: 'Loans', Industry: 'Finance' }
      ];
      const headers = ['Topic', 'SubTopic', 'Industry'];
      
      const response = await request(app)
        .post('/api/csv/export')
        .send({ rows, headers, validationPassed: true })
        .expect(400);

      expect(response.body.error).toBe('All rows must have consistent structure');
    });

    test('should handle special characters in data', async () => {
      const rows = [
        { Topic: 'Payments, Inc', SubTopic: 'ACH "Transfer"', Industry: 'Fintech\nNewline' }
      ];
      const headers = ['Topic', 'SubTopic', 'Industry'];
      
      const response = await request(app)
        .post('/api/csv/export')
        .send({ rows, headers, validationPassed: true })
        .expect(200);

      expect(response.text).toContain('"Payments, Inc"');
      expect(response.text).toContain('"ACH ""Transfer"""');
      expect(response.text).toContain('"Fintech\nNewline"');
    });
  });
});
