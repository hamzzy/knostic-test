const {
  normalizeHeader,
  normalizeValue,
  createHeaderMapping,
  validateHeaders,
  detectRole,
  mapRowToCanonical,
  mapRowsToCanonical,
  REQUIRED_HEADERS
} = require('../../utils/headerValidator');

describe('Header Validator', () => {
  describe('normalizeHeader', () => {
    test('should normalize header names correctly', () => {
      expect(normalizeHeader('Sub-Topic')).toBe('subtopic');
      expect(normalizeHeader('sub_topic')).toBe('subtopic');
      expect(normalizeHeader('Sub Topic')).toBe('subtopic');
      expect(normalizeHeader('Fuzzing-Idx')).toBe('fuzzingidx');
      expect(normalizeHeader('fuzzing_idx')).toBe('fuzzingidx');
      expect(normalizeHeader('classification')).toBe('classification');
      expect(normalizeHeader('  Topic  ')).toBe('topic');
      expect(normalizeHeader('')).toBe('');
      expect(normalizeHeader(null)).toBe('');
      expect(normalizeHeader(undefined)).toBe('');
    });
  });

  describe('normalizeValue', () => {
    test('should normalize cell values correctly', () => {
      expect(normalizeValue('  Fintech  ')).toBe('fintech');
      expect(normalizeValue('Payments')).toBe('payments');
      expect(normalizeValue('')).toBe('');
      expect(normalizeValue(null)).toBe('');
      expect(normalizeValue(undefined)).toBe('');
    });
  });

  describe('createHeaderMapping', () => {
    test('should create correct header mapping', () => {
      const headers = ['Topic', 'Sub-Topic', 'Industry', 'Classification'];
      const mapping = createHeaderMapping(headers);
      
      expect(mapping).toEqual({
        'Topic': 'Topic',
        'Sub-Topic': 'SubTopic',
        'Industry': 'Industry',
        'Classification': 'Classification'
      });
    });

    test('should handle unknown headers', () => {
      const headers = ['Topic', 'Unknown-Header', 'Industry'];
      const mapping = createHeaderMapping(headers);
      
      expect(mapping).toEqual({
        'Topic': 'Topic',
        'Unknown-Header': 'Unknown-Header',
        'Industry': 'Industry'
      });
    });
  });

  describe('validateHeaders', () => {
    test('should validate strings headers correctly', () => {
      const validHeaders = ['Tier', 'Industry', 'Topic', 'SubTopic', 'Prefix', 'Fuzzing-Idx', 'Prompt', 'Risks', 'Keywords'];
      const result = validateHeaders(validHeaders, 'strings');
      
      expect(result.valid).toBe(true);
      expect(result.missingRequiredHeaders).toEqual([]);
    });

    test('should detect missing strings headers', () => {
      const invalidHeaders = ['Topic', 'Industry', 'SubTopic'];
      const result = validateHeaders(invalidHeaders, 'strings');
      
      expect(result.valid).toBe(false);
      expect(result.missingRequiredHeaders).toContain('Tier');
      expect(result.missingRequiredHeaders).toContain('Prefix');
      expect(result.missingRequiredHeaders).toContain('Fuzzing-Idx');
    });

    test('should validate classifications headers correctly', () => {
      const validHeaders = ['Topic', 'SubTopic', 'Industry', 'Classification'];
      const result = validateHeaders(validHeaders, 'classifications');
      
      expect(result.valid).toBe(true);
      expect(result.missingRequiredHeaders).toEqual([]);
    });

    test('should detect missing classifications headers', () => {
      const invalidHeaders = ['Topic', 'Industry'];
      const result = validateHeaders(invalidHeaders, 'classifications');
      
      expect(result.valid).toBe(false);
      expect(result.missingRequiredHeaders).toContain('SubTopic');
      expect(result.missingRequiredHeaders).toContain('Classification');
    });

    test('should handle variant header names', () => {
      const variantHeaders = ['Topic', 'Sub-Topic', 'Industry', 'Classification'];
      const result = validateHeaders(variantHeaders, 'classifications');
      
      expect(result.valid).toBe(true);
      expect(result.missingRequiredHeaders).toEqual([]);
    });

    test('should return error for invalid role', () => {
      const result = validateHeaders(['Topic'], 'invalid-role');
      
      expect(result.valid).toBe(false);
      expect(result.reason).toBe('Invalid role: invalid-role');
    });
  });

  describe('detectRole', () => {
    test('should detect strings role correctly', () => {
      const stringsHeaders = ['Tier', 'Industry', 'Topic', 'SubTopic', 'Prefix', 'Fuzzing-Idx', 'Prompt', 'Risks', 'Keywords'];
      const result = detectRole(stringsHeaders);
      
      expect(result.detectedRole).toBe('strings');
      expect(result.isStringsCandidate).toBe(true);
      expect(result.isClassificationsCandidate).toBe(false);
      expect(result.ambiguous).toBe(false);
    });

    test('should detect classifications role correctly', () => {
      const classificationsHeaders = ['Topic', 'SubTopic', 'Industry', 'Classification'];
      const result = detectRole(classificationsHeaders);
      
      expect(result.detectedRole).toBe('classifications');
      expect(result.isStringsCandidate).toBe(false);
      expect(result.isClassificationsCandidate).toBe(true);
      expect(result.ambiguous).toBe(false);
    });

    test('should detect ambiguous role when both match', () => {
      // This would be a rare case where a file has all headers for both roles
      const ambiguousHeaders = ['Tier', 'Industry', 'Topic', 'SubTopic', 'Prefix', 'Fuzzing-Idx', 'Prompt', 'Risks', 'Keywords', 'Classification'];
      const result = detectRole(ambiguousHeaders);
      
      expect(result.detectedRole).toBe('ambiguous');
      expect(result.isStringsCandidate).toBe(true);
      expect(result.isClassificationsCandidate).toBe(true);
      expect(result.ambiguous).toBe(true);
    });

    test('should detect unknown role when no match', () => {
      const unknownHeaders = ['Column1', 'Column2', 'Column3'];
      const result = detectRole(unknownHeaders);
      
      expect(result.detectedRole).toBe('unknown');
      expect(result.isStringsCandidate).toBe(false);
      expect(result.isClassificationsCandidate).toBe(false);
      expect(result.ambiguous).toBe(false);
    });
  });

  describe('mapRowToCanonical', () => {
    test('should map row to canonical field names', () => {
      const row = {
        'Topic': 'Payments',
        'Sub-Topic': 'ACH',
        'Industry': 'Fintech'
      };
      const headerMapping = {
        'Topic': 'Topic',
        'Sub-Topic': 'SubTopic',
        'Industry': 'Industry'
      };
      
      const result = mapRowToCanonical(row, headerMapping);
      
      expect(result).toEqual({
        'Topic': 'Payments',
        'SubTopic': 'ACH',
        'Industry': 'Fintech'
      });
    });
  });

  describe('mapRowsToCanonical', () => {
    test('should map array of rows to canonical field names', () => {
      const rows = [
        { 'Topic': 'Payments', 'Sub-Topic': 'ACH', 'Industry': 'Fintech' },
        { 'Topic': 'Loans', 'Sub-Topic': 'Student', 'Industry': 'Banking' }
      ];
      const headerMapping = {
        'Topic': 'Topic',
        'Sub-Topic': 'SubTopic',
        'Industry': 'Industry'
      };
      
      const result = mapRowsToCanonical(rows, headerMapping);
      
      expect(result).toEqual([
        { 'Topic': 'Payments', 'SubTopic': 'ACH', 'Industry': 'Fintech' },
        { 'Topic': 'Loans', 'SubTopic': 'Student', 'Industry': 'Banking' }
      ]);
    });
  });

  describe('REQUIRED_HEADERS', () => {
    test('should have correct required headers for strings', () => {
      expect(REQUIRED_HEADERS.strings).toEqual([
        'Tier', 'Industry', 'Topic', 'SubTopic', 'Prefix', 'Fuzzing-Idx', 'Prompt', 'Risks', 'Keywords'
      ]);
    });

    test('should have correct required headers for classifications', () => {
      expect(REQUIRED_HEADERS.classifications).toEqual([
        'Topic', 'SubTopic', 'Industry', 'Classification'
      ]);
    });
  });
});
