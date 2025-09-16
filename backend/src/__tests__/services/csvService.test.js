const csvService = require('../../services/csvService');

describe('CSV Service', () => {
  describe('normalizeHeader', () => {
    test('should normalize common header variants', () => {
      expect(csvService.normalizeHeader('SubTopic')).toBe('SubTopic');
      expect(csvService.normalizeHeader('subtopic')).toBe('SubTopic');
      expect(csvService.normalizeHeader('sub_topic')).toBe('SubTopic');
      expect(csvService.normalizeHeader('sub topic')).toBe('SubTopic');
      expect(csvService.normalizeHeader('sub-topic')).toBe('SubTopic');
      expect(csvService.normalizeHeader('Topic')).toBe('Topic');
      expect(csvService.normalizeHeader('topic')).toBe('Topic');
      expect(csvService.normalizeHeader('Industry')).toBe('Industry');
      expect(csvService.normalizeHeader('industry')).toBe('Industry');
    });

    test('should handle edge cases', () => {
      expect(csvService.normalizeHeader('')).toBe('');
      expect(csvService.normalizeHeader(null)).toBe('');
      expect(csvService.normalizeHeader(undefined)).toBe('');
      expect(csvService.normalizeHeader('  ')).toBe('');
    });
  });

  describe('parseCSV', () => {
    test('should parse simple CSV with normalized headers', async () => {
      const csvContent = 'Topic,Sub Topic,Industry\nPayments,ACH,Fintech\nBanking,Loans,Finance';
      const buffer = Buffer.from(csvContent, 'utf8');
      
      const result = await csvService.parseCSV(buffer);
      
      expect(result.headers).toEqual(['Topic', 'SubTopic', 'Industry']);
      expect(result.rows).toHaveLength(2);
      expect(result.rows[0]).toEqual({
        Topic: 'Payments',
        SubTopic: 'ACH',
        Industry: 'Fintech'
      });
    });

    test('should handle empty CSV', async () => {
      const csvContent = 'Topic,SubTopic,Industry\n';
      const buffer = Buffer.from(csvContent, 'utf8');
      
      const result = await csvService.parseCSV(buffer);
      
      expect(result.headers).toEqual(['Topic', 'SubTopic', 'Industry']);
      expect(result.rows).toHaveLength(0);
    });
  });

  describe('exportToCSVBuffer', () => {
    test('should export simple data to CSV buffer', async () => {
      const rows = [
        { Topic: 'Payments', SubTopic: 'ACH', Industry: 'Fintech' },
        { Topic: 'Banking', SubTopic: 'Loans', Industry: 'Finance' }
      ];
      const headers = ['Topic', 'SubTopic', 'Industry'];
      
      const buffer = await csvService.exportToCSVBuffer(rows, headers);
      const csvContent = buffer.toString('utf8');
      
      expect(csvContent).toContain('Topic,SubTopic,Industry');
      expect(csvContent).toContain('Payments,ACH,Fintech');
      expect(csvContent).toContain('Banking,Loans,Finance');
    });
  });
});
