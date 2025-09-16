const { 
  validateStringsAgainstClassifications, 
  validateRequiredHeaders, 
  normalize, 
  createClassificationKey 
} = require('../validator');

describe('Validator', () => {
  describe('normalize', () => {
    test('should normalize values correctly', () => {
      expect(normalize('  Payments  ')).toBe('payments');
      expect(normalize('ACH')).toBe('ach');
      expect(normalize('Fintech')).toBe('fintech');
      expect(normalize('')).toBe('');
      expect(normalize(null)).toBe('');
      expect(normalize(undefined)).toBe('');
      expect(normalize(123)).toBe('123');
    });
  });

  describe('createClassificationKey', () => {
    test('should create normalized classification keys', () => {
      const row = {
        Topic: 'Payments',
        SubTopic: 'ACH',
        Industry: 'Fintech'
      };
      
      expect(createClassificationKey(row)).toBe('payments||ach||fintech');
    });

    test('should handle empty values', () => {
      const row = {
        Topic: '',
        SubTopic: 'ACH',
        Industry: 'Fintech'
      };
      
      expect(createClassificationKey(row)).toBe('||ach||fintech');
    });

    test('should handle whitespace', () => {
      const row = {
        Topic: '  Payments  ',
        SubTopic: ' ACH ',
        Industry: 'Fintech '
      };
      
      expect(createClassificationKey(row)).toBe('payments||ach||fintech');
    });
  });

  describe('validateRequiredHeaders', () => {
    test('should validate when all required headers are present', () => {
      const rows = [
        { Topic: 'Payments', SubTopic: 'ACH', Industry: 'Fintech' }
      ];
      const requiredHeaders = ['Topic', 'SubTopic', 'Industry'];
      
      const result = validateRequiredHeaders(rows, requiredHeaders);
      
      expect(result.valid).toBe(true);
      expect(result.missingHeaders).toEqual([]);
      expect(result.reason).toBe('All required headers present');
    });

    test('should identify missing headers', () => {
      const rows = [
        { Topic: 'Payments', SubTopic: 'ACH' }
      ];
      const requiredHeaders = ['Topic', 'SubTopic', 'Industry'];
      
      const result = validateRequiredHeaders(rows, requiredHeaders);
      
      expect(result.valid).toBe(false);
      expect(result.missingHeaders).toEqual(['Industry']);
      expect(result.reason).toBe('Missing required headers: Industry');
    });

    test('should handle empty rows array', () => {
      const rows = [];
      const requiredHeaders = ['Topic', 'SubTopic', 'Industry'];
      
      const result = validateRequiredHeaders(rows, requiredHeaders);
      
      expect(result.valid).toBe(false);
      expect(result.missingHeaders).toEqual(['Topic', 'SubTopic', 'Industry']);
      expect(result.reason).toBe('No data rows found');
    });

    test('should handle no required headers', () => {
      const rows = [
        { Topic: 'Payments', SubTopic: 'ACH', Industry: 'Fintech' }
      ];
      const requiredHeaders = [];
      
      const result = validateRequiredHeaders(rows, requiredHeaders);
      
      expect(result.valid).toBe(true);
      expect(result.missingHeaders).toEqual([]);
    });
  });

  describe('validateStringsAgainstClassifications', () => {
    const validClassifications = [
      { Topic: 'Payments', SubTopic: 'ACH', Industry: 'Fintech' },
      { Topic: 'Banking', SubTopic: 'Loans', Industry: 'Finance' },
      { Topic: 'Payments', SubTopic: 'Credit Cards', Industry: 'Fintech' }
    ];

    test('should validate when all strings have matching classifications', () => {
      const stringsData = [
        { Topic: 'Payments', SubTopic: 'ACH', Industry: 'Fintech' },
        { Topic: 'Banking', SubTopic: 'Loans', Industry: 'Finance' }
      ];
      
      const result = validateStringsAgainstClassifications(stringsData, validClassifications);
      
      expect(result.valid).toBe(true);
      expect(result.invalidRows).toEqual([]);
    });

    test('should identify strings without matching classifications', () => {
      const stringsData = [
        { Topic: 'Payments', SubTopic: 'ACH', Industry: 'Fintech' },
        { Topic: 'Unknown', SubTopic: 'Topic', Industry: 'Missing' }
      ];
      
      const result = validateStringsAgainstClassifications(stringsData, validClassifications);
      
      expect(result.valid).toBe(false);
      expect(result.invalidRows).toHaveLength(1);
      expect(result.invalidRows[0].rowIndex).toBe(1);
      expect(result.invalidRows[0].reason).toBe("No classification for Topic='Unknown', SubTopic='Topic', Industry='Missing'");
    });

    test('should handle case-insensitive matching', () => {
      const stringsData = [
        { Topic: 'payments', SubTopic: 'ach', Industry: 'fintech' },
        { Topic: 'BANKING', SubTopic: 'loans', Industry: 'FINANCE' }
      ];
      
      const result = validateStringsAgainstClassifications(stringsData, validClassifications);
      
      expect(result.valid).toBe(true);
      expect(result.invalidRows).toEqual([]);
    });

    test('should handle whitespace in values', () => {
      const stringsData = [
        { Topic: '  Payments  ', SubTopic: ' ACH ', Industry: 'Fintech ' }
      ];
      
      const result = validateStringsAgainstClassifications(stringsData, validClassifications);
      
      expect(result.valid).toBe(true);
      expect(result.invalidRows).toEqual([]);
    });

    test('should identify missing required fields', () => {
      const stringsData = [
        { Topic: 'Payments', SubTopic: 'ACH', Industry: 'Fintech' },
        { Topic: 'Payments', SubTopic: '', Industry: 'Fintech' },
        { Topic: '', SubTopic: 'ACH', Industry: 'Fintech' },
        { Topic: 'Payments', SubTopic: 'ACH' }
      ];
      
      const result = validateStringsAgainstClassifications(stringsData, validClassifications);
      
      expect(result.valid).toBe(false);
      expect(result.invalidRows).toHaveLength(3);
      
      // Check missing SubTopic
      expect(result.invalidRows[0].rowIndex).toBe(1);
      expect(result.invalidRows[0].reason).toBe('Missing required fields: SubTopic');
      
      // Check missing Topic
      expect(result.invalidRows[1].rowIndex).toBe(2);
      expect(result.invalidRows[1].reason).toBe('Missing required fields: Topic');
      
      // Check missing Industry
      expect(result.invalidRows[2].rowIndex).toBe(3);
      expect(result.invalidRows[2].reason).toBe('Missing required fields: Industry');
    });

    test('should handle empty classifications array', () => {
      const stringsData = [
        { Topic: 'Payments', SubTopic: 'ACH', Industry: 'Fintech' }
      ];
      
      const result = validateStringsAgainstClassifications(stringsData, []);
      
      expect(result.valid).toBe(false);
      expect(result.invalidRows).toHaveLength(1);
      expect(result.invalidRows[0].reason).toBe("No classification for Topic='Payments', SubTopic='ACH', Industry='Fintech'");
    });

    test('should handle empty strings array', () => {
      const result = validateStringsAgainstClassifications([], validClassifications);
      
      expect(result.valid).toBe(true);
      expect(result.invalidRows).toEqual([]);
    });

    test('should handle null/undefined values in classifications', () => {
      const classificationsWithNulls = [
        { Topic: 'Payments', SubTopic: 'ACH', Industry: 'Fintech' },
        { Topic: null, SubTopic: undefined, Industry: '' }
      ];
      
      const stringsData = [
        { Topic: 'Payments', SubTopic: 'ACH', Industry: 'Fintech' }
      ];
      
      const result = validateStringsAgainstClassifications(stringsData, classificationsWithNulls);
      
      expect(result.valid).toBe(true);
      expect(result.invalidRows).toEqual([]);
    });

    test('should handle multiple invalid rows', () => {
      const stringsData = [
        { Topic: 'Payments', SubTopic: 'ACH', Industry: 'Fintech' }, // Valid
        { Topic: 'Invalid1', SubTopic: 'Topic1', Industry: 'Missing1' }, // Invalid
        { Topic: 'Invalid2', SubTopic: 'Topic2', Industry: 'Missing2' }, // Invalid
        { Topic: 'Banking', SubTopic: 'Loans', Industry: 'Finance' } // Valid
      ];
      
      const result = validateStringsAgainstClassifications(stringsData, validClassifications);
      
      expect(result.valid).toBe(false);
      expect(result.invalidRows).toHaveLength(2);
      expect(result.invalidRows[0].rowIndex).toBe(1);
      expect(result.invalidRows[1].rowIndex).toBe(2);
    });
  });
});
