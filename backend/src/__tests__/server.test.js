const request = require('supertest');
const app = require('../server');

describe('CSV Upload API', () => {
  describe('POST /api/csv/upload', () => {
    test('should upload and parse single CSV file', async () => {
      const csvContent = 'Topic,SubTopic,Industry\nPayments,ACH,Fintech\nBanking,Loans,Finance';
      
      const response = await request(app)
        .post('/api/csv/upload')
        .attach('files', Buffer.from(csvContent, 'utf8'), 'test.csv')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.files).toHaveLength(1);
      
      const file = response.body.files[0];
      expect(file.filename).toBe('test.csv');
      expect(file.headers).toEqual(['Topic', 'SubTopic', 'Industry']);
      expect(file.rows).toHaveLength(2);
      expect(file.rowCount).toBe(2);
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
      expect(response.body.files).toHaveLength(2);
      
      const stringsFile = response.body.files.find(f => f.filename === 'strings.csv');
      const classificationsFile = response.body.files.find(f => f.filename === 'classifications.csv');
      
      expect(stringsFile.headers).toEqual(['Topic', 'SubTopic', 'Industry']);
      expect(classificationsFile.headers).toEqual(['Classification', 'Description']);
    });

    test('should normalize headers correctly', async () => {
      const csvContent = 'topic,sub_topic,industry\nPayments,ACH,Fintech';
      
      const response = await request(app)
        .post('/api/csv/upload')
        .attach('files', Buffer.from(csvContent, 'utf8'), 'test.csv')
        .expect(200);

      const file = response.body.files[0];
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

      expect(response.body.error).toBe('No files uploaded');
    });

    test('should handle malformed CSV gracefully', async () => {
      const malformedCsv = 'Topic,SubTopic,Industry\nPayments,ACH\nIncomplete,Row';
      
      const response = await request(app)
        .post('/api/csv/upload')
        .attach('files', Buffer.from(malformedCsv, 'utf8'), 'malformed.csv')
        .expect(200);

      expect(response.body.success).toBe(true);
      const file = response.body.files[0];
      expect(file.filename).toBe('malformed.csv');
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

      expect(response.body.error).toBe('File too large. Maximum size is 10MB.');
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

      expect(response.body.error).toBe('Too many files. Maximum is 5 files.');
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
    test('should return placeholder response', async () => {
      const response = await request(app)
        .post('/api/csv/validate')
        .send({ data: [] })
        .expect(200);

      expect(response.body.message).toBe('Validation endpoint - to be implemented in Stage 02');
      expect(response.body.valid).toBe(true);
      expect(response.body.invalidRows).toEqual([]);
    });
  });

  describe('POST /api/csv/export', () => {
    test('should return placeholder response', async () => {
      const response = await request(app)
        .post('/api/csv/export')
        .send({ data: [] })
        .expect(200);

      expect(response.body.message).toBe('Export endpoint - to be implemented in Stage 03');
    });
  });
});
