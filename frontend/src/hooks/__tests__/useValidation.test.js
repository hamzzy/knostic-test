import { renderHook, act } from '@testing-library/react'
import { useValidation } from '../useValidation'

describe('useValidation', () => {
  const mockClassificationsData = [
    { Topic: 'Payments', SubTopic: 'ACH', Industry: 'Fintech' },
    { Topic: 'Security', SubTopic: 'Authentication', Industry: 'Banking' },
    { Topic: 'Data', SubTopic: 'Analytics', Industry: 'General' }
  ]

  const mockValidStringsData = [
    { Topic: 'Payments', SubTopic: 'ACH', Industry: 'Fintech' },
    { Topic: 'Security', SubTopic: 'Authentication', Industry: 'Banking' }
  ]

  const mockInvalidStringsData = [
    { Topic: 'Payments', SubTopic: 'ACH', Industry: 'Fintech' },
    { Topic: 'Invalid', SubTopic: 'Topic', Industry: 'Missing' },
    { Topic: 'Security', SubTopic: 'Authentication', Industry: 'Banking' }
  ]

  const mockIncompleteStringsData = [
    { Topic: 'Payments', SubTopic: 'ACH', Industry: 'Fintech' },
    { Topic: '', SubTopic: 'Authentication', Industry: 'Banking' },
    { Topic: 'Security', SubTopic: '', Industry: 'Banking' }
  ]

  it('should validate valid data correctly', async () => {
    const { result } = renderHook(() => 
      useValidation(mockValidStringsData, mockClassificationsData)
    )

    await act(async () => {
      // Wait for validation to complete
      await new Promise(resolve => setTimeout(resolve, 0))
    })

    expect(result.current.isValid).toBe(true)
    expect(result.current.validationResults.invalidRows).toHaveLength(0)
    expect(result.current.validationResults.errors).toHaveLength(0)
  })

  it('should detect invalid data correctly', async () => {
    const { result } = renderHook(() => 
      useValidation(mockInvalidStringsData, mockClassificationsData)
    )

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0))
    })

    expect(result.current.isValid).toBe(false)
    expect(result.current.validationResults.invalidRows).toHaveLength(1)
    expect(result.current.validationResults.invalidRows[0].reason).toContain('No classification found')
    expect(result.current.validationResults.errors).toContain('1 row(s) have validation errors')
  })

  it('should detect missing required fields', async () => {
    const { result } = renderHook(() => 
      useValidation(mockIncompleteStringsData, mockClassificationsData)
    )

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0))
    })

    expect(result.current.isValid).toBe(false)
    expect(result.current.validationResults.invalidRows).toHaveLength(2)
    expect(result.current.validationResults.invalidRows[0].reason).toContain('Missing required fields')
    expect(result.current.validationResults.invalidRows[1].reason).toContain('Missing required fields')
  })

  it('should return correct row validation status', async () => {
    const { result } = renderHook(() => 
      useValidation(mockInvalidStringsData, mockClassificationsData)
    )

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0))
    })

    // Valid row
    const validRowStatus = result.current.getRowValidationStatus(0)
    expect(validRowStatus.isValid).toBe(true)

    // Invalid row
    const invalidRowStatus = result.current.getRowValidationStatus(1)
    expect(invalidRowStatus.isValid).toBe(false)
    expect(invalidRowStatus.error).toContain('No classification found')
  })

  it('should return correct cell validation status', async () => {
    const { result } = renderHook(() => 
      useValidation(mockInvalidStringsData, mockClassificationsData)
    )

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0))
    })

    // Valid cell
    const validCellStatus = result.current.getCellValidationStatus(0, 'Topic')
    expect(validCellStatus.isValid).toBe(true)

    // Invalid cell
    const invalidCellStatus = result.current.getCellValidationStatus(1, 'Topic')
    expect(invalidCellStatus.isValid).toBe(false)
    expect(invalidCellStatus.error).toContain('No classification found')
  })

  it('should handle empty data gracefully', async () => {
    const { result } = renderHook(() => 
      useValidation([], mockClassificationsData)
    )

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0))
    })

    expect(result.current.isValid).toBe(true)
    expect(result.current.validationResults.invalidRows).toHaveLength(0)
  })

  it('should handle missing classifications data gracefully', async () => {
    const { result } = renderHook(() => 
      useValidation(mockValidStringsData, [])
    )

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0))
    })

    expect(result.current.isValid).toBe(true)
    expect(result.current.validationResults.invalidRows).toHaveLength(0)
  })
})
