const { parseCSV, normalizeHeader, validateHeaders } = require('../csvParser');

describe('CSV Parser', () => {
  describe('normalizeHeader', () => {
    test('should normalize common header variants', () => {
      expect(normalizeHeader('SubTopic')).toBe('SubTopic');
      expect(normalizeHeader('subtopic')).toBe('SubTopic');
      expect(normalizeHeader('sub_topic')).toBe('SubTopic');
      expect(normalizeHeader('sub topic')).toBe('SubTopic');
      expect(normalizeHeader('sub-topic')).toBe('SubTopic');
      expect(normalizeHeader('Topic')).toBe('Topic');
      expect(normalizeHeader('topic')).toBe('Topic');
      expect(normalizeHeader('Industry')).toBe('Industry');
      expect(normalizeHeader('industry')).toBe('Industry');
      expect(normalizeHeader('Classification')).toBe('Classification');
      expect(normalizeHeader('classification')).toBe('Classification');
    });

    test('should preserve semantic names', () => {
      expect(normalizeHeader('Prompt')).toBe('Prompt');
      expect(normalizeHeader('prompt')).toBe('Prompt');
      expect(normalizeHeader('Risks')).toBe('Risks');
      expect(normalizeHeader('risks')).toBe('Risks');
      expect(normalizeHeader('Keywords')).toBe('Keywords');
      expect(normalizeHeader('keywords')).toBe('Keywords');
    });

    test('should handle edge cases', () => {
      expect(normalizeHeader('')).toBe('');
      expect(normalizeHeader(null)).toBe('');
      expect(normalizeHeader(undefined)).toBe('');
      expect(normalizeHeader('  ')).toBe('');
      expect(normalizeHeader('Unknown Header')).toBe('Unknown Header');
    });

    test('should trim whitespace', () => {
      expect(normalizeHeader('  Topic  ')).toBe('Topic');
      expect(normalizeHeader('\tSubTopic\n')).toBe('SubTopic');
    });
  });

  describe('validateHeaders', () => {
    test('should validate required headers are present', () => {
      const headers = ['Topic', 'SubTopic', 'Industry'];
      const required = ['Topic', 'SubTopic'];
      
      const result = validateHeaders(headers, required);
      expect(result.isValid).toBe(true);
      expect(result.missingHeaders).toEqual([]);
    });

    test('should identify missing headers', () => {
      const headers = ['Topic', 'Industry'];
      const required = ['Topic', 'SubTopic', 'Classification'];
      
      const result = validateHeaders(headers, required);
      expect(result.isValid).toBe(false);
      expect(result.missingHeaders).toEqual(['SubTopic', 'Classification']);
    });

    test('should handle empty headers array', () => {
      const headers = [];
      const required = ['Topic'];
      
      const result = validateHeaders(headers, required);
      expect(result.isValid).toBe(false);
      expect(result.missingHeaders).toEqual(['Topic']);
    });

    test('should handle no required headers', () => {
      const headers = ['Topic', 'SubTopic'];
      const required = [];
      
      const result = validateHeaders(headers, required);
      expect(result.isValid).toBe(true);
      expect(result.missingHeaders).toEqual([]);
    });
  });

  describe('parseCSV', () => {
    test('should parse simple CSV with normalized headers', async () => {
      const csvContent = 'Topic,Sub Topic,Industry\nPayments,ACH,Fintech\nBanking,Loans,Finance';
      const buffer = Buffer.from(csvContent, 'utf8');
      
      const result = await parseCSV(buffer);
      
      expect(result.headers).toEqual(['Topic', 'SubTopic', 'Industry']);
      expect(result.rows).toHaveLength(2);
      expect(result.rows[0]).toEqual({
        Topic: 'Payments',
        SubTopic: 'ACH',
        Industry: 'Fintech'
      });
      expect(result.rows[1]).toEqual({
        Topic: 'Banking',
        SubTopic: 'Loans',
        Industry: 'Finance'
      });
    });

    test('should handle CSV with different header formats', async () => {
      const csvContent = 'topic,sub_topic,industry\nPayments,ACH,Fintech';
      const buffer = Buffer.from(csvContent, 'utf8');
      
      const result = await parseCSV(buffer);
      
      expect(result.headers).toEqual(['Topic', 'SubTopic', 'Industry']);
      expect(result.rows).toHaveLength(1);
      expect(result.rows[0]).toEqual({
        Topic: 'Payments',
        SubTopic: 'ACH',
        Industry: 'Fintech'
      });
    });

    test('should handle CSV with extra columns', async () => {
      const csvContent = 'Topic,SubTopic,Industry,ExtraColumn\nPayments,ACH,Fintech,ExtraValue';
      const buffer = Buffer.from(csvContent, 'utf8');
      
      const result = await parseCSV(buffer);
      
      expect(result.headers).toEqual(['Topic', 'SubTopic', 'Industry', 'ExtraColumn']);
      expect(result.rows).toHaveLength(1);
      expect(result.rows[0]).toEqual({
        Topic: 'Payments',
        SubTopic: 'ACH',
        Industry: 'Fintech',
        ExtraColumn: 'ExtraValue'
      });
    });

    test('should handle empty CSV', async () => {
      const csvContent = 'Topic,SubTopic,Industry\n';
      const buffer = Buffer.from(csvContent, 'utf8');
      
      const result = await parseCSV(buffer);
      
      expect(result.headers).toEqual(['Topic', 'SubTopic', 'Industry']);
      expect(result.rows).toHaveLength(0);
    });

    test('should handle CSV with only headers', async () => {
      const csvContent = 'Topic,SubTopic,Industry';
      const buffer = Buffer.from(csvContent, 'utf8');
      
      const result = await parseCSV(buffer);
      
      expect(result.headers).toEqual(['Topic', 'SubTopic', 'Industry']);
      expect(result.rows).toHaveLength(0);
    });

    test('should skip empty lines', async () => {
      const csvContent = 'Topic,SubTopic,Industry\nPayments,ACH,Fintech\n\nBanking,Loans,Finance\n';
      const buffer = Buffer.from(csvContent, 'utf8');
      
      const result = await parseCSV(buffer);
      
      expect(result.headers).toEqual(['Topic', 'SubTopic', 'Industry']);
      expect(result.rows).toHaveLength(2);
    });

    test('should handle CSV with quoted values', async () => {
      const csvContent = 'Topic,SubTopic,Industry\n"Payments, Inc","ACH Transfer","Fintech"';
      const buffer = Buffer.from(csvContent, 'utf8');
      
      const result = await parseCSV(buffer);
      
      expect(result.headers).toEqual(['Topic', 'SubTopic', 'Industry']);
      expect(result.rows).toHaveLength(1);
      expect(result.rows[0]).toEqual({
        Topic: 'Payments, Inc',
        SubTopic: 'ACH Transfer',
        Industry: 'Fintech'
      });
    });

    test('should handle malformed CSV gracefully', async () => {
      const csvContent = 'Topic,SubTopic,Industry\nPayments,ACH\nBanking,Loans,Finance,Extra';
      const buffer = Buffer.from(csvContent, 'utf8');
      
      const result = await parseCSV(buffer);
      
      expect(result.headers).toEqual(['Topic', 'SubTopic', 'Industry']);
      expect(result.rows).toHaveLength(2);
      // First row should have empty Industry
      expect(result.rows[0]).toEqual({
        Topic: 'Payments',
        SubTopic: 'ACH'
      });
      // Second row should have extra column
      expect(result.rows[1]).toEqual({
        Topic: 'Banking',
        SubTopic: 'Loans',
        Industry: 'Finance',
        column_3: 'Extra'
      });
    });

    test('should handle single line content', async () => {
      const invalidContent = 'Not a valid CSV content';
      const buffer = Buffer.from(invalidContent, 'utf8');
      
      const result = await parseCSV(buffer);
      expect(result.headers).toEqual(['Not a valid CSV content']);
      expect(result.rows).toHaveLength(0);
    });
  });
});
