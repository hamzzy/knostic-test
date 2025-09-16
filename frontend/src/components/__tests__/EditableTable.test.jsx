import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import EditableTable from '../EditableTable'

const mockData = [
  { Topic: 'Payments', SubTopic: 'ACH', Industry: 'Fintech' },
  { Topic: 'Banking', SubTopic: 'Loans', Industry: 'Finance' }
]

const mockHeaders = ['Topic', 'SubTopic', 'Industry']

describe('EditableTable', () => {
  test('renders data correctly', () => {
    render(<EditableTable data={mockData} headers={mockHeaders} />)
    
    expect(screen.getByText('Payments')).toBeInTheDocument()
    expect(screen.getByText('ACH')).toBeInTheDocument()
    expect(screen.getByText('Fintech')).toBeInTheDocument()
    expect(screen.getByText('Banking')).toBeInTheDocument()
    expect(screen.getByText('Loans')).toBeInTheDocument()
    expect(screen.getByText('Finance')).toBeInTheDocument()
  })

  test('renders headers correctly', () => {
    render(<EditableTable data={mockData} headers={mockHeaders} />)
    
    expect(screen.getByText('Topic')).toBeInTheDocument()
    expect(screen.getByText('SubTopic')).toBeInTheDocument()
    expect(screen.getByText('Industry')).toBeInTheDocument()
  })

  test('shows add row button when editable', () => {
    render(<EditableTable data={mockData} headers={mockHeaders} editable={true} />)
    
    expect(screen.getByText('Add Row')).toBeInTheDocument()
  })

  test('does not show add row button when not editable', () => {
    render(<EditableTable data={mockData} headers={mockHeaders} editable={false} />)
    
    expect(screen.queryByText('Add Row')).not.toBeInTheDocument()
  })

  test('handles empty data', () => {
    render(<EditableTable data={[]} headers={mockHeaders} />)
    
    expect(screen.getByText('No data to display')).toBeInTheDocument()
  })

  test('calls onChange when data changes', async () => {
    const mockOnChange = jest.fn()
    render(<EditableTable data={mockData} headers={mockHeaders} onChange={mockOnChange} editable={true} />)
    
    // Click on a cell to edit
    const cell = screen.getByText('Payments')
    fireEvent.click(cell)
    
    // Change the value
    const input = screen.getByDisplayValue('Payments')
    fireEvent.change(input, { target: { value: 'Updated Payments' } })
    fireEvent.blur(input)
    
    await waitFor(() => {
      expect(mockOnChange).toHaveBeenCalled()
    })
  })

  test('adds new row when add button is clicked', () => {
    const mockOnChange = jest.fn()
    render(<EditableTable data={mockData} headers={mockHeaders} onChange={mockOnChange} editable={true} />)
    
    const addButton = screen.getByText('Add Row')
    fireEvent.click(addButton)
    
    expect(mockOnChange).toHaveBeenCalledWith([
      ...mockData,
      { Topic: '', SubTopic: '', Industry: '' }
    ])
  })

  test('deletes row when delete button is clicked', () => {
    const mockOnChange = jest.fn()
    render(<EditableTable data={mockData} headers={mockHeaders} onChange={mockOnChange} editable={true} />)
    
    const deleteButtons = screen.getAllByText('Delete')
    fireEvent.click(deleteButtons[0])
    
    expect(mockOnChange).toHaveBeenCalledWith([mockData[1]])
  })
})
