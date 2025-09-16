/**
 * Header validation and normalization utilities
 * Implements the comprehensive header validation system as specified
 */

// Canonical required headers for each role
const REQUIRED_HEADERS = {
  strings: ['Tier', 'Industry', 'Topic', 'SubTopic', 'Prefix', 'Fuzzing-Idx', 'Prompt', 'Risks', 'Keywords'],
  classifications: ['Topic', 'SubTopic', 'Industry', 'Classification']
};

// Canonical mapping from normalized header names to canonical field names
const CANONICAL_MAP = {
  // Strings headers
  'tier': 'Tier',
  'industry': 'Industry', 
  'topic': 'Topic',
  'subtopic': 'SubTopic',
  'prefix': 'Prefix',
  'fuzzingidx': 'Fuzzing-Idx',
  'prompt': 'Prompt',
  'risks': 'Risks',
  'keywords': 'Keywords',
  // Classifications headers
  'classification': 'Classification'
};

/**
 * Normalizes a header string according to the specification
 * @param {string} header - The header string to normalize
 * @returns {string} - Normalized header string
 */
function normalizeHeader(header) {
  return String(header || '')
    .trim()
    .toLowerCase()
    .replace(/[-_\s]+/g, ''); // remove dashes, underscores, and spaces
}

/**
 * Normalizes a cell value for comparison
 * @param {any} value - The value to normalize
 * @returns {string} - Normalized string
 */
function normalizeValue(value) {
  return String(value || '').trim().toLowerCase();
}

/**
 * Maps normalized headers to canonical field names
 * @param {string[]} headers - Array of original headers
 * @returns {Object} - Mapping object with normalized -> canonical
 */
function createHeaderMapping(headers) {
  const mapping = {};
  
  headers.forEach((originalHeader, index) => {
    const normalized = normalizeHeader(originalHeader);
    const canonical = CANONICAL_MAP[normalized];
    if (canonical) {
      mapping[originalHeader] = canonical;
    } else {
      // Keep original header if no canonical mapping exists
      mapping[originalHeader] = originalHeader;
    }
  });
  
  return mapping;
}

/**
 * Validates headers against required headers for a specific role
 * @param {string[]} headers - Array of header names
 * @param {string} role - Role type ('strings' or 'classifications')
 * @returns {Object} - Validation result
 */
function validateHeaders(headers, role) {
  const required = REQUIRED_HEADERS[role];
  if (!required) {
    return {
      valid: false,
      missingRequiredHeaders: [],
      extraHeaders: [],
      reason: `Invalid role: ${role}`
    };
  }

  const normalizedHeaders = headers.map(normalizeHeader);
  const normalizedRequired = required.map(normalizeHeader);
  
  const missing = normalizedRequired.filter(req => !normalizedHeaders.includes(req));
  const extra = normalizedHeaders.filter(h => !normalizedRequired.includes(h));
  
  return {
    valid: missing.length === 0,
    missingRequiredHeaders: missing.map(norm => {
      // Find the canonical name for the missing header
      const canonical = CANONICAL_MAP[norm];
      return canonical || norm;
    }),
    extraHeaders: extra,
    reason: missing.length > 0 ? 
      `Missing required headers: ${missing.join(', ')}` : 
      'All required headers present'
  };
}

/**
 * Determines the role of a CSV file based on its headers
 * @param {string[]} headers - Array of header names
 * @returns {Object} - Role detection result
 */
function detectRole(headers) {
  const stringsValidation = validateHeaders(headers, 'strings');
  const classificationsValidation = validateHeaders(headers, 'classifications');
  
  const isStringsCandidate = stringsValidation.valid;
  const isClassificationsCandidate = classificationsValidation.valid;
  
  let detectedRole = 'unknown';
  let ambiguous = false;
  
  if (isStringsCandidate && isClassificationsCandidate) {
    ambiguous = true;
    detectedRole = 'ambiguous';
  } else if (isStringsCandidate) {
    detectedRole = 'strings';
  } else if (isClassificationsCandidate) {
    detectedRole = 'classifications';
  }
  
  return {
    detectedRole,
    ambiguous,
    isStringsCandidate,
    isClassificationsCandidate,
    stringsValidation,
    classificationsValidation
  };
}

/**
 * Maps row data to canonical field names
 * @param {Object} row - Row object with original headers as keys
 * @param {Object} headerMapping - Mapping from normalized to canonical names
 * @returns {Object} - Row with canonical field names
 */
function mapRowToCanonical(row, headerMapping) {
  const canonicalRow = {};
  
  Object.keys(row).forEach(originalHeader => {
    const canonical = headerMapping[originalHeader] || originalHeader;
    canonicalRow[canonical] = row[originalHeader];
  });
  
  return canonicalRow;
}

/**
 * Maps array of rows to canonical field names
 * @param {Object[]} rows - Array of row objects
 * @param {Object} headerMapping - Mapping from normalized to canonical names
 * @returns {Object[]} - Array of rows with canonical field names
 */
function mapRowsToCanonical(rows, headerMapping) {
  return rows.map(row => mapRowToCanonical(row, headerMapping));
}

module.exports = {
  normalizeHeader,
  normalizeValue,
  createHeaderMapping,
  validateHeaders,
  detectRole,
  mapRowToCanonical,
  mapRowsToCanonical,
  REQUIRED_HEADERS,
  CANONICAL_MAP
};
