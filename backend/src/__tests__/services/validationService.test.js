const validationService = require('../../services/validationService');

describe('Validation Service', () => {
  describe('normalize', () => {
    test('should normalize values correctly', () => {
      expect(validationService.normalize('  Test  ')).toBe('test');
      expect(validationService.normalize('TEST')).toBe('test');
      expect(validationService.normalize('')).toBe('');
      expect(validationService.normalize(null)).toBe('');
      expect(validationService.normalize(undefined)).toBe('');
    });
  });

  describe('validateStringsAgainstClassifications', () => {
    const classificationsData = [
      { Topic: 'Payments', SubTopic: 'ACH', Industry: 'Fintech' },
      { Topic: 'Banking', SubTopic: 'Loans', Industry: 'Finance' }
    ];

    test('should validate valid strings data', () => {
      const stringsData = [
        { Topic: 'Payments', SubTopic: 'ACH', Industry: 'Fintech' },
        { Topic: 'Banking', SubTopic: 'Loans', Industry: 'Finance' }
      ];

      const result = validationService.validateStringsAgainstClassifications(
        stringsData, 
        classificationsData
      );

      expect(result.valid).toBe(true);
      expect(result.invalidRows).toHaveLength(0);
    });

    test('should identify invalid strings data', () => {
      const stringsData = [
        { Topic: 'Payments', SubTopic: 'ACH', Industry: 'Fintech' },
        { Topic: 'Invalid', SubTopic: 'Topic', Industry: 'Combo' }
      ];

      const result = validationService.validateStringsAgainstClassifications(
        stringsData, 
        classificationsData
      );

      expect(result.valid).toBe(false);
      expect(result.invalidRows).toHaveLength(1);
      expect(result.invalidRows[0].reason).toContain('No classification');
    });

    test('should handle missing required fields', () => {
      const stringsData = [
        { Topic: 'Payments', SubTopic: 'ACH', Industry: 'Fintech' },
        { Topic: 'Missing', SubTopic: '', Industry: 'Fields' }
      ];

      const result = validationService.validateStringsAgainstClassifications(
        stringsData, 
        classificationsData
      );

      expect(result.valid).toBe(false);
      expect(result.invalidRows).toHaveLength(1);
      expect(result.invalidRows[0].reason).toContain('Missing required fields');
    });
  });

  describe('validateRequiredHeaders', () => {
    test('should validate when all required headers are present', () => {
      const rows = [
        { Topic: 'Test', SubTopic: 'Test', Industry: 'Test' }
      ];
      const requiredHeaders = ['Topic', 'SubTopic', 'Industry'];

      const result = validationService.validateRequiredHeaders(rows, requiredHeaders);

      expect(result.valid).toBe(true);
      expect(result.missingHeaders).toHaveLength(0);
    });

    test('should identify missing headers', () => {
      const rows = [
        { Topic: 'Test', SubTopic: 'Test' }
      ];
      const requiredHeaders = ['Topic', 'SubTopic', 'Industry'];

      const result = validationService.validateRequiredHeaders(rows, requiredHeaders);

      expect(result.valid).toBe(false);
      expect(result.missingHeaders).toContain('Industry');
    });

    test('should handle empty data', () => {
      const rows = [];
      const requiredHeaders = ['Topic', 'SubTopic', 'Industry'];

      const result = validationService.validateRequiredHeaders(rows, requiredHeaders);

      expect(result.valid).toBe(false);
      expect(result.reason).toContain('No data rows found');
    });
  });
});
