const { parseCSV } = require('../../utils/csvParser');

describe('CSV Parser with Header Validation', () => {
  test('should parse CSV with strings headers correctly', async () => {
    const csvContent = 'Tier,Industry,Topic,SubTopic,Prefix,Fuzzing-Idx,Prompt,Risks,Keywords\n1,Fintech,Payments,ACH,prefix1,1,Test prompt,Low risk,keyword1';
    const buffer = Buffer.from(csvContent, 'utf8');
    
    const result = await parseCSV(buffer);
    
    expect(result.originalHeaders).toEqual(['Tier', 'Industry', 'Topic', 'SubTopic', 'Prefix', 'Fuzzing-Idx', 'Prompt', 'Risks', 'Keywords']);
    expect(result.headers).toEqual(['Tier', 'Industry', 'Topic', 'SubTopic', 'Prefix', 'Fuzzing-Idx', 'Prompt', 'Risks', 'Keywords']);
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0]).toEqual({
      'Tier': '1',
      'Industry': 'Fintech',
      'Topic': 'Payments',
      'SubTopic': 'ACH',
      'Prefix': 'prefix1',
      'Fuzzing-Idx': '1',
      'Prompt': 'Test prompt',
      'Risks': 'Low risk',
      'Keywords': 'keyword1'
    });
    expect(result.roleDetection.detectedRole).toBe('strings');
    expect(result.roleDetection.isStringsCandidate).toBe(true);
    expect(result.roleDetection.isClassificationsCandidate).toBe(false);
    expect(result.roleDetection.ambiguous).toBe(false);
  });

  test('should parse CSV with classifications headers correctly', async () => {
    const csvContent = 'Topic,SubTopic,Industry,Classification\nPayments,ACH,Fintech,Standard';
    const buffer = Buffer.from(csvContent, 'utf8');
    
    const result = await parseCSV(buffer);
    
    expect(result.originalHeaders).toEqual(['Topic', 'SubTopic', 'Industry', 'Classification']);
    expect(result.headers).toEqual(['Topic', 'SubTopic', 'Industry', 'Classification']);
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0]).toEqual({
      'Topic': 'Payments',
      'SubTopic': 'ACH',
      'Industry': 'Fintech',
      'Classification': 'Standard'
    });
    expect(result.roleDetection.detectedRole).toBe('classifications');
    expect(result.roleDetection.isStringsCandidate).toBe(false);
    expect(result.roleDetection.isClassificationsCandidate).toBe(true);
    expect(result.roleDetection.ambiguous).toBe(false);
  });

  test('should handle variant header names', async () => {
    const csvContent = 'Topic,Sub-Topic,Industry,Classification\nPayments,ACH,Fintech,Standard';
    const buffer = Buffer.from(csvContent, 'utf8');
    
    const result = await parseCSV(buffer);
    
    expect(result.originalHeaders).toEqual(['Topic', 'Sub-Topic', 'Industry', 'Classification']);
    expect(result.headers).toEqual(['Topic', 'SubTopic', 'Industry', 'Classification']);
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0]).toEqual({
      'Topic': 'Payments',
      'SubTopic': 'ACH',
      'Industry': 'Fintech',
      'Classification': 'Standard'
    });
    expect(result.roleDetection.detectedRole).toBe('classifications');
  });

  test('should detect ambiguous role when both types match', async () => {
    const csvContent = 'Tier,Industry,Topic,SubTopic,Prefix,Fuzzing-Idx,Prompt,Risks,Keywords,Classification\n1,Fintech,Payments,ACH,prefix1,1,Test prompt,Low risk,keyword1,Standard';
    const buffer = Buffer.from(csvContent, 'utf8');
    
    const result = await parseCSV(buffer);
    
    expect(result.roleDetection.detectedRole).toBe('ambiguous');
    expect(result.roleDetection.isStringsCandidate).toBe(true);
    expect(result.roleDetection.isClassificationsCandidate).toBe(true);
    expect(result.roleDetection.ambiguous).toBe(true);
  });

  test('should detect unknown role when no match', async () => {
    const csvContent = 'Column1,Column2,Column3\nValue1,Value2,Value3';
    const buffer = Buffer.from(csvContent, 'utf8');
    
    const result = await parseCSV(buffer);
    
    expect(result.roleDetection.detectedRole).toBe('unknown');
    expect(result.roleDetection.isStringsCandidate).toBe(false);
    expect(result.roleDetection.isClassificationsCandidate).toBe(false);
    expect(result.roleDetection.ambiguous).toBe(false);
  });

  test('should handle empty CSV gracefully', async () => {
    const csvContent = 'Tier,Industry,Topic,SubTopic,Prefix,Fuzzing-Idx,Prompt,Risks,Keywords\n';
    const buffer = Buffer.from(csvContent, 'utf8');
    
    const result = await parseCSV(buffer);
    
    expect(result.originalHeaders).toEqual(['Tier', 'Industry', 'Topic', 'SubTopic', 'Prefix', 'Fuzzing-Idx', 'Prompt', 'Risks', 'Keywords']);
    expect(result.rows).toHaveLength(0);
    expect(result.roleDetection.detectedRole).toBe('strings');
  });

  test('should handle malformed CSV gracefully', async () => {
    const csvContent = 'Tier,Industry,Topic,SubTopic,Prefix,Fuzzing-Idx,Prompt,Risks,Keywords\n1,Fintech,Payments,ACH,prefix1,1,Test prompt,Low risk,keyword1\n2,Invalid,Row,Missing,Columns';
    const buffer = Buffer.from(csvContent, 'utf8');
    
    const result = await parseCSV(buffer);
    
    expect(result.rows).toHaveLength(2); // Parser is now more lenient and includes both rows
    expect(result.rows[0]).toEqual({
      'Tier': '1',
      'Industry': 'Fintech',
      'Topic': 'Payments',
      'SubTopic': 'ACH',
      'Prefix': 'prefix1',
      'Fuzzing-Idx': '1',
      'Prompt': 'Test prompt',
      'Risks': 'Low risk',
      'Keywords': 'keyword1'
    });
  });

  test('should create correct header mapping', async () => {
    const csvContent = 'Topic,Sub-Topic,Industry,Classification\nPayments,ACH,Fintech,Standard';
    const buffer = Buffer.from(csvContent, 'utf8');
    
    const result = await parseCSV(buffer);
    
    expect(result.headerMapping).toEqual({
      'Topic': 'Topic',
      'Sub-Topic': 'SubTopic',
      'Industry': 'Industry',
      'Classification': 'Classification'
    });
  });
});
