const request = require('supertest');
const app = require('../../app');

describe('CSV Controller', () => {
  describe('POST /api/csv/upload', () => {
    test('should upload and parse CSV file successfully', async () => {
      const csvContent = 'Topic,SubTopic,Industry\nPayments,ACH,Fintech';
      const response = await request(app)
        .post('/api/csv/upload')
        .attach('files', Buffer.from(csvContent), 'test.csv');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.files).toHaveLength(1);
      expect(response.body.files[0].filename).toBe('test.csv');
      expect(response.body.files[0].headers).toEqual(['Topic', 'SubTopic', 'Industry']);
      expect(response.body.files[0].rows).toHaveLength(1);
    });

    test('should handle multiple files', async () => {
      const csv1 = 'Topic,SubTopic,Industry\nPayments,ACH,Fintech';
      const csv2 = 'Topic,SubTopic,Industry,Classification\nPayments,ACH,Fintech,Standard';
      
      const response = await request(app)
        .post('/api/csv/upload')
        .attach('files', Buffer.from(csv1), 'strings.csv')
        .attach('files', Buffer.from(csv2), 'classifications.csv');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.files).toHaveLength(2);
    });

    test('should reject non-CSV files', async () => {
      const response = await request(app)
        .post('/api/csv/upload')
        .attach('files', Buffer.from('not csv content'), 'test.txt');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Only CSV files are allowed');
    });

    test('should handle file size limit', async () => {
      // Create a large CSV content (over 10MB)
      const largeContent = 'Topic,SubTopic,Industry\n' + 
        'Payments,ACH,Fintech\n'.repeat(1000000); // This should be over 10MB
      
      const response = await request(app)
        .post('/api/csv/upload')
        .attach('files', Buffer.from(largeContent), 'large.csv');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('File too large');
    });
  });

  describe('POST /api/csv/validate', () => {
    test('should validate data successfully', async () => {
      const stringsData = [
        { Topic: 'Payments', SubTopic: 'ACH', Industry: 'Fintech' }
      ];
      const classificationsData = [
        { Topic: 'Payments', SubTopic: 'ACH', Industry: 'Fintech', Classification: 'Standard' }
      ];

      const response = await request(app)
        .post('/api/csv/validate')
        .send({ stringsData, classificationsData });

      expect(response.status).toBe(200);
      expect(response.body.valid).toBe(true);
      expect(response.body.invalidRows).toHaveLength(0);
    });

    test('should identify invalid data', async () => {
      const stringsData = [
        { Topic: 'Invalid', SubTopic: 'Topic', Industry: 'Combo' }
      ];
      const classificationsData = [
        { Topic: 'Payments', SubTopic: 'ACH', Industry: 'Fintech', Classification: 'Standard' }
      ];

      const response = await request(app)
        .post('/api/csv/validate')
        .send({ stringsData, classificationsData });

      expect(response.status).toBe(200);
      expect(response.body.valid).toBe(false);
      expect(response.body.invalidRows).toHaveLength(1);
    });

    test('should require both stringsData and classificationsData', async () => {
      const response = await request(app)
        .post('/api/csv/validate')
        .send({ stringsData: [] });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/csv/export', () => {
    test('should export data as CSV', async () => {
      const rows = [
        { Topic: 'Payments', SubTopic: 'ACH', Industry: 'Fintech' }
      ];
      const headers = ['Topic', 'SubTopic', 'Industry'];

      const response = await request(app)
        .post('/api/csv/export')
        .send({ rows, headers, filename: 'test.csv' });

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toContain('text/csv');
      expect(response.headers['content-disposition']).toContain('attachment');
    });

    test('should require rows and headers', async () => {
      const response = await request(app)
        .post('/api/csv/export')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/health', () => {
    test('should return health status', async () => {
      const response = await request(app)
        .get('/api/health');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('OK');
      expect(response.body.timestamp).toBeDefined();
      expect(response.body.service).toBe('knostic-csv-manager');
    });
  });
});
