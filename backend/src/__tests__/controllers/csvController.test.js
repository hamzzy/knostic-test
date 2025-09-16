const request = require('supertest');
const app = require('../../app');
const csvController = require('../../controllers/csvController');

// Mock the services
jest.mock('../../services/csvService');
jest.mock('../../services/validationService');

const csvService = require('../../services/csvService');
const validationService = require('../../services/validationService');

describe('CSV Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/csv/upload', () => {
    test('should upload and validate CSV files with header validation', async () => {
      const mockParsedData = {
        originalHeaders: ['Topic', 'SubTopic', 'Industry', 'Classification'],
        headers: ['Topic', 'SubTopic', 'Industry', 'Classification'],
        rows: [
          { Topic: 'Payments', SubTopic: 'ACH', Industry: 'Fintech', Classification: 'Standard' }
        ],
        headerMapping: {
          'topic': 'Topic',
          'subtopic': 'SubTopic',
          'industry': 'Industry',
          'classification': 'Classification'
        },
        roleDetection: {
          detectedRole: 'classifications',
          isStringsCandidate: false,
          isClassificationsCandidate: true,
          ambiguous: false,
          stringsValidation: { valid: false, missingRequiredHeaders: ['Tier', 'Prefix', 'Fuzzing-Idx', 'Prompt', 'Risks', 'Keywords'], extraHeaders: [] },
          classificationsValidation: { valid: true, missingRequiredHeaders: [], extraHeaders: [] }
        }
      };

      csvService.parseCSV.mockResolvedValue(mockParsedData);

      const response = await request(app)
        .post('/api/csv/upload')
        .attach('files', Buffer.from('Topic,SubTopic,Industry,Classification\nPayments,ACH,Fintech,Standard'), 'test.csv');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.files).toBeDefined();
      expect(response.body.files['test.csv']).toBeDefined();
      
      const fileResult = response.body.files['test.csv'];
      expect(fileResult.originalName).toBe('test.csv');
      expect(fileResult.headers).toEqual(['Topic', 'SubTopic', 'Industry', 'Classification']);
      expect(fileResult.rows).toHaveLength(1);
      expect(fileResult.isStringsCandidate).toBe(false);
      expect(fileResult.isClassificationsCandidate).toBe(true);
      expect(fileResult.detectedRole).toBe('classifications');
      expect(fileResult.headerValid).toBe(true);
      expect(fileResult.missingRequiredHeaders).toEqual([]);
    });

    test('should handle files with invalid headers', async () => {
      const mockParsedData = {
        originalHeaders: ['Topic', 'Industry'],
        headers: ['Topic', 'Industry'],
        rows: [
          { Topic: 'Payments', Industry: 'Fintech' }
        ],
        headerMapping: {
          'topic': 'Topic',
          'industry': 'Industry'
        },
        roleDetection: {
          detectedRole: 'unknown',
          isStringsCandidate: false,
          isClassificationsCandidate: false,
          ambiguous: false,
          stringsValidation: { valid: false, missingRequiredHeaders: ['Tier', 'SubTopic', 'Prefix', 'Fuzzing-Idx', 'Prompt', 'Risks', 'Keywords'], extraHeaders: [] },
          classificationsValidation: { valid: false, missingRequiredHeaders: ['SubTopic', 'Classification'], extraHeaders: [] }
        }
      };

      csvService.parseCSV.mockResolvedValue(mockParsedData);

      const response = await request(app)
        .post('/api/csv/upload')
        .attach('files', Buffer.from('Topic,Industry\nPayments,Fintech'), 'test.csv');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      
      const fileResult = response.body.files['test.csv'];
      expect(fileResult.headerValid).toBe(false);
      expect(fileResult.missingRequiredHeaders).toEqual(['Unable to determine required headers']);
    });

    test('should handle parsing errors', async () => {
      csvService.parseCSV.mockRejectedValue(new Error('Invalid CSV format'));

      const response = await request(app)
        .post('/api/csv/upload')
        .attach('files', Buffer.from('invalid,csv,content'), 'test.csv');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      
      const fileResult = response.body.files['test.csv'];
      expect(fileResult.error).toBe('Invalid CSV format');
      expect(fileResult.parseError).toBe(true);
    });
  });

  describe('POST /api/csv/validate', () => {
    test('should validate strings against classifications successfully', async () => {
      const stringsData = {
        headers: ['Tier', 'Industry', 'Topic', 'SubTopic', 'Prefix', 'Fuzzing-Idx', 'Prompt', 'Risks', 'Keywords'],
        rows: [
          { Tier: '1', Industry: 'Fintech', Topic: 'Payments', SubTopic: 'ACH', Prefix: 'prefix1', 'Fuzzing-Idx': '1', Prompt: 'Test prompt', Risks: 'Low risk', Keywords: 'keyword1' }
        ]
      };
      const classificationsData = {
        headers: ['Topic', 'SubTopic', 'Industry', 'Classification'],
        rows: [
          { Topic: 'Payments', SubTopic: 'ACH', Industry: 'Fintech', Classification: 'Standard' }
        ]
      };

      validationService.validateStringsAgainstClassifications.mockReturnValue({
        valid: true,
        invalidRows: []
      });

      const response = await request(app)
        .post('/api/csv/validate')
        .send({
          strings: stringsData,
          classifications: classificationsData
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.valid).toBe(true);
    });

    test('should return validation errors for invalid data', async () => {
      const stringsData = {
        headers: ['Tier', 'Industry', 'Topic', 'SubTopic', 'Prefix', 'Fuzzing-Idx', 'Prompt', 'Risks', 'Keywords'],
        rows: [
          { Tier: '1', Industry: 'Fintech', Topic: 'Payments', SubTopic: 'ACH', Prefix: 'prefix1', 'Fuzzing-Idx': '1', Prompt: 'Test prompt', Risks: 'Low risk', Keywords: 'keyword1' },
          { Tier: '2', Industry: 'Banking', Topic: 'Loans', SubTopic: 'Student', Prefix: 'prefix2', 'Fuzzing-Idx': '2', Prompt: 'Test prompt 2', Risks: 'High risk', Keywords: 'keyword2' }
        ]
      };
      const classificationsData = {
        headers: ['Topic', 'SubTopic', 'Industry', 'Classification'],
        rows: [
          { Topic: 'Payments', SubTopic: 'ACH', Industry: 'Fintech', Classification: 'Standard' }
        ]
      };

      validationService.validateStringsAgainstClassifications.mockReturnValue({
        valid: false,
        invalidRows: [
          {
            rowIndex: 1,
            row: { Tier: '2', Industry: 'Banking', Topic: 'Loans', SubTopic: 'Student', Prefix: 'prefix2', 'Fuzzing-Idx': '2', Prompt: 'Test prompt 2', Risks: 'High risk', Keywords: 'keyword2' },
            reason: 'No classification found for Topic="Loans", SubTopic="Student", Industry="Banking"'
          }
        ]
      });

      const response = await request(app)
        .post('/api/csv/validate')
        .send({
          strings: stringsData,
          classifications: classificationsData
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.valid).toBe(false);
      expect(response.body.invalidRows).toHaveLength(1);
      expect(response.body.invalidRows[0].rowIndex).toBe(1);
      expect(response.body.invalidRows[0].reason).toContain('No classification found');
    });

    test('should return header validation errors for missing required headers', async () => {
      const stringsData = {
        headers: ['Topic', 'Industry'], // Missing required headers
        rows: [
          { Topic: 'Payments', Industry: 'Fintech' }
        ]
      };
      const classificationsData = {
        headers: ['Topic', 'SubTopic', 'Industry', 'Classification'],
        rows: [
          { Topic: 'Payments', SubTopic: 'ACH', Industry: 'Fintech', Classification: 'Standard' }
        ]
      };

      const response = await request(app)
        .post('/api/csv/validate')
        .send({
          strings: stringsData,
          classifications: classificationsData
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.valid).toBe(false);
      expect(response.body.headerErrors).toHaveLength(1);
      expect(response.body.headerErrors[0].type).toBe('strings');
      expect(response.body.headerErrors[0].missingRequiredHeaders).toContain('Tier');
    });
  });

  describe('POST /api/csv/export', () => {
    test('should export data when validation has passed', async () => {
      const exportData = {
        rows: [
          { Topic: 'Payments', SubTopic: 'ACH', Industry: 'Fintech' }
        ],
        headers: ['Topic', 'SubTopic', 'Industry'],
        filename: 'export.csv',
        validationPassed: true
      };

      // Mock the validation service to return valid
      validationService.validateExportData.mockReturnValue({ valid: true });

      // Mock the CSV service to return a readable stream that ends immediately
      const mockStream = {
        pipe: jest.fn().mockImplementation((dest) => {
          // Simulate immediate completion
          setImmediate(() => {
            dest.end();
          });
          return dest;
        }),
        on: jest.fn().mockReturnThis()
      };
      csvService.exportToCSV.mockReturnValue(mockStream);

      const response = await request(app)
        .post('/api/csv/export')
        .send(exportData)
        .expect(200);

      expect(response.headers['content-type']).toContain('text/csv');
      expect(response.headers['content-disposition']).toContain('attachment; filename="export.csv"');
    }, 10000); // Increase timeout to 10 seconds

    test('should reject export when validation has not passed', async () => {
      const exportData = {
        rows: [
          { Topic: 'Payments', SubTopic: 'ACH', Industry: 'Fintech' }
        ],
        headers: ['Topic', 'SubTopic', 'Industry'],
        filename: 'export.csv',
        validationPassed: false
      };

      const response = await request(app)
        .post('/api/csv/export')
        .send(exportData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Export not allowed - data must be validated first');
      expect(response.body.code).toBe('VALIDATION_REQUIRED');
    });
  });
});