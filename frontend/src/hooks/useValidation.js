import { useState, useEffect, useCallback } from 'react'

/**
 * Custom hook for real-time validation of strings data against classifications
 * @param {Array} stringsData - The strings data to validate
 * @param {Array} classificationsData - The classifications data to validate against
 * @returns {Object} - Validation state and functions
 */
export const useValidation = (stringsData, classificationsData) => {
  const [validationResults, setValidationResults] = useState({
    valid: true,
    invalidRows: [],
    errors: []
  })
  const [isValidating, setIsValidating] = useState(false)

  /**
   * Normalizes a value for comparison (trim, lowercase)
   */
  const normalize = useCallback((value) => {
    return String(value || '').trim().toLowerCase()
  }, [])

  /**
   * Creates a classification key from Topic, SubTopic, and Industry
   */
  const createClassificationKey = useCallback((row) => {
    const topic = normalize(row.Topic)
    const subtopic = normalize(row.SubTopic)
    const industry = normalize(row.Industry)
    return `${topic}||${subtopic}||${industry}`
  }, [normalize])

  /**
   * Validates strings data against classifications data
   */
  const validateData = useCallback(async () => {
    if (!stringsData || !classificationsData || 
        stringsData.length === 0 || classificationsData.length === 0) {
      setValidationResults({
        valid: true,
        invalidRows: [],
        errors: []
      })
      return
    }

    setIsValidating(true)

    try {
      // Build classification keys set for fast lookup
      const classificationKeys = new Set()
      
      classificationsData.forEach(row => {
        const key = createClassificationKey(row)
        if (key !== '||||') { // Skip empty keys
          classificationKeys.add(key)
        }
      })

      const invalidRows = []
      const errors = []

      stringsData.forEach((row, index) => {
        // Check for missing required fields
        if (!row.Topic || !row.SubTopic || !row.Industry) {
          const missingFields = []
          if (!row.Topic) missingFields.push('Topic')
          if (!row.SubTopic) missingFields.push('SubTopic')
          if (!row.Industry) missingFields.push('Industry')
          
          invalidRows.push({
            rowIndex: index,
            row: row,
            reason: `Missing required fields: ${missingFields.join(', ')}`,
            type: 'missing_fields'
          })
          return
        }
        
        // Check if classification exists
        const classificationKey = createClassificationKey(row)
        
        if (!classificationKeys.has(classificationKey)) {
          invalidRows.push({
            rowIndex: index,
            row: row,
            reason: `No classification found for Topic='${row.Topic}', SubTopic='${row.SubTopic}', Industry='${row.Industry}'`,
            type: 'missing_classification'
          })
        }
      })

      const isValid = invalidRows.length === 0
      
      if (!isValid) {
        errors.push(`${invalidRows.length} row(s) have validation errors`)
      }

      setValidationResults({
        valid: isValid,
        invalidRows: invalidRows,
        errors: errors
      })

    } catch (error) {
      console.error('Validation error:', error)
      setValidationResults({
        valid: false,
        invalidRows: [],
        errors: [`Validation failed: ${error.message}`]
      })
    } finally {
      setIsValidating(false)
    }
  }, [stringsData, classificationsData, createClassificationKey])

  // Run validation whenever data changes
  useEffect(() => {
    validateData()
  }, [validateData])

  /**
   * Get validation status for a specific row
   */
  const getRowValidationStatus = useCallback((rowIndex) => {
    const invalidRow = validationResults.invalidRows.find(
      invalidRow => invalidRow.rowIndex === rowIndex
    )
    
    if (!invalidRow) {
      return { isValid: true, error: null }
    }

    return {
      isValid: false,
      error: invalidRow.reason,
      type: invalidRow.type
    }
  }, [validationResults.invalidRows])

  /**
   * Get validation status for a specific cell
   */
  const getCellValidationStatus = useCallback((rowIndex, fieldName) => {
    const rowStatus = getRowValidationStatus(rowIndex)
    
    if (!rowStatus.isValid) {
      // Check if this field is part of the validation error
      if (rowStatus.type === 'missing_fields' && 
          (!fieldName || fieldName === 'Topic' || fieldName === 'SubTopic' || fieldName === 'Industry')) {
        return {
          isValid: false,
          error: rowStatus.error
        }
      }
      
      if (rowStatus.type === 'missing_classification' && 
          (fieldName === 'Topic' || fieldName === 'SubTopic' || fieldName === 'Industry')) {
        return {
          isValid: false,
          error: rowStatus.error
        }
      }
    }

    return { isValid: true, error: null }
  }, [getRowValidationStatus])

  return {
    validationResults,
    isValidating,
    validateData,
    getRowValidationStatus,
    getCellValidationStatus,
    isValid: validationResults.valid
  }
}
