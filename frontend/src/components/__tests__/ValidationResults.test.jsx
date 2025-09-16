import React from 'react'
import { render, screen } from '@testing-library/react'
import ValidationResults from '../ValidationResults'

describe('ValidationResults', () => {
  test('renders success message when validation passes', () => {
    const results = {
      valid: true,
      totalRows: 10,
      invalidCount: 0
    }
    
    render(<ValidationResults results={results} />)
    
    expect(screen.getByText('✅ Validation Passed!')).toBeInTheDocument()
    expect(screen.getByText('All 10 rows are valid and have corresponding classifications.')).toBeInTheDocument()
  })

  test('renders error message when validation fails', () => {
    const results = {
      valid: false,
      totalRows: 10,
      invalidCount: 2,
      invalidRows: [
        {
          rowIndex: 0,
          reason: 'No classification for Topic=Unknown, SubTopic=Test, Industry=Missing',
          row: { Topic: 'Unknown', SubTopic: 'Test', Industry: 'Missing' }
        },
        {
          rowIndex: 5,
          reason: 'Missing required fields: SubTopic',
          row: { Topic: 'Payments', Industry: 'Fintech' }
        }
      ]
    }
    
    render(<ValidationResults results={results} />)
    
    expect(screen.getByText('❌ Validation Failed')).toBeInTheDocument()
    expect(screen.getByText('Found 2 invalid rows out of 10 total rows.')).toBeInTheDocument()
    expect(screen.getByText('Row 1:')).toBeInTheDocument()
    expect(screen.getByText('Row 6:')).toBeInTheDocument()
  })

  test('renders error message when there is an error', () => {
    const results = {
      error: 'Network error occurred'
    }
    
    render(<ValidationResults results={results} />)
    
    expect(screen.getByText('Validation Error:')).toBeInTheDocument()
    expect(screen.getByText('Network error occurred')).toBeInTheDocument()
  })

  test('renders invalid rows details', () => {
    const results = {
      valid: false,
      totalRows: 2,
      invalidCount: 1,
      invalidRows: [
        {
          rowIndex: 0,
          reason: 'No classification found',
          row: { Topic: 'Test', SubTopic: 'Test', Industry: 'Test' }
        }
      ]
    }
    
    render(<ValidationResults results={results} />)
    
    expect(screen.getByText('Invalid Rows:')).toBeInTheDocument()
    expect(screen.getByText('No classification found')).toBeInTheDocument()
    expect(screen.getByText('{"Topic":"Test","SubTopic":"Test","Industry":"Test"}')).toBeInTheDocument()
  })
})
