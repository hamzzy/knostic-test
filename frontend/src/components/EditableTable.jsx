import React, { useState, useEffect } from 'react'
import { useValidation } from '../hooks/useValidation'

const EditableTable = ({ 
  data, 
  headers, 
  onChange, 
  editable = false, 
  classificationsData = [],
  showValidation = false 
}) => {
  const [localData, setLocalData] = useState(data)
  const [editingCell, setEditingCell] = useState(null)
  
  // Use validation hook when classifications data is available and validation is enabled
  const validation = useValidation(
    showValidation ? localData : [], 
    showValidation ? classificationsData : []
  )

  useEffect(() => {
    setLocalData(data)
  }, [data])

  const handleCellChange = (rowIndex, header, value) => {
    const newData = localData.map((row, index) => 
      index === rowIndex 
        ? { ...row, [header]: value }
        : row
    )
    setLocalData(newData)
    if (onChange) {
      onChange(newData)
    }
  }

  const handleAddRow = () => {
    const newRow = {}
    headers.forEach(header => {
      newRow[header] = ''
    })
    const newData = [...localData, newRow]
    setLocalData(newData)
    if (onChange) {
      onChange(newData)
    }
  }

  const handleDeleteRow = (rowIndex) => {
    const newData = localData.filter((_, index) => index !== rowIndex)
    setLocalData(newData)
    if (onChange) {
      onChange(newData)
    }
  }

  const startEditing = (rowIndex, header) => {
    if (editable) {
      setEditingCell(`${rowIndex}-${header}`)
    }
  }

  const stopEditing = () => {
    setEditingCell(null)
  }

  const handleKeyPress = (e, rowIndex, header) => {
    if (e.key === 'Enter') {
      stopEditing()
    } else if (e.key === 'Escape') {
      // Reset to original value
      setLocalData(data)
      stopEditing()
    }
  }

  if (!data || data.length === 0) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
        No data to display
      </div>
    )
  }

  // Get validation status for display
  const getRowClassName = (rowIndex) => {
    if (!showValidation) return ''
    
    const rowStatus = validation.getRowValidationStatus(rowIndex)
    if (!rowStatus.isValid) {
      return 'validation-error-row'
    }
    return ''
  }

  const getCellClassName = (rowIndex, header) => {
    if (!showValidation) return ''
    
    const cellStatus = validation.getCellValidationStatus(rowIndex, header)
    if (!cellStatus.isValid) {
      return 'validation-error-cell'
    }
    return ''
  }

  return (
    <div>
      {/* Validation Status Display */}
      {showValidation && (
        <div style={{ 
          marginBottom: '16px', 
          padding: '12px', 
          borderRadius: '4px',
          backgroundColor: validation.isValid ? '#d4edda' : '#f8d7da',
          border: `1px solid ${validation.isValid ? '#c3e6cb' : '#f5c6cb'}`,
          color: validation.isValid ? '#155724' : '#721c24'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontWeight: 'bold' }}>
              {validation.isValidating ? '⏳ Validating...' : 
               validation.isValid ? '✅ Data is valid' : '❌ Validation errors found'}
            </span>
            {validation.validationResults.errors.length > 0 && (
              <span>({validation.validationResults.errors.join(', ')})</span>
            )}
          </div>
        </div>
      )}

      <div className="button-group" style={{ marginBottom: '16px' }}>
        {editable && (
          <button className="button button-primary" onClick={handleAddRow}>
            Add Row
          </button>
        )}
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table className="preview-table">
          <thead>
            <tr>
              {editable && <th style={{ width: '80px' }}>Actions</th>}
              {headers.map(header => (
                <th key={header}>{header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {localData.map((row, rowIndex) => {
              const rowStatus = showValidation ? validation.getRowValidationStatus(rowIndex) : { isValid: true, error: null }
              
              return (
                <tr key={rowIndex} className={getRowClassName(rowIndex)}>
                  {editable && (
                    <td>
                      <button
                        className="remove-button"
                        onClick={() => handleDeleteRow(rowIndex)}
                        style={{ fontSize: '12px', padding: '4px 8px' }}
                      >
                        Delete
                      </button>
                    </td>
                  )}
                  {headers.map(header => {
                    const cellKey = `${rowIndex}-${header}`
                    const isEditing = editingCell === cellKey
                    const value = row[header] || ''
                    const cellStatus = showValidation ? validation.getCellValidationStatus(rowIndex, header) : { isValid: true, error: null }

                    return (
                      <td key={header} className={getCellClassName(rowIndex, header)}>
                        {isEditing ? (
                          <input
                            type="text"
                            value={value}
                            onChange={(e) => handleCellChange(rowIndex, header, e.target.value)}
                            onBlur={stopEditing}
                            onKeyDown={(e) => handleKeyPress(e, rowIndex, header)}
                            autoFocus
                            style={{
                              width: '100%',
                              padding: '4px',
                              border: cellStatus.isValid ? '1px solid #ddd' : '2px solid #dc3545',
                              borderRadius: '4px',
                              backgroundColor: cellStatus.isValid ? 'white' : '#fff5f5'
                            }}
                          />
                        ) : (
                          <div
                            onClick={() => startEditing(rowIndex, header)}
                            style={{
                              cursor: editable ? 'pointer' : 'default',
                              minHeight: '20px',
                              padding: '4px',
                              whiteSpace: 'pre-wrap',
                              wordBreak: 'break-word',
                              backgroundColor: cellStatus.isValid ? 'transparent' : '#fff5f5',
                              border: cellStatus.isValid ? 'none' : '1px solid #f5c6cb',
                              borderRadius: '2px'
                            }}
                            title={editable ? 'Click to edit' : ''}
                          >
                            {value}
                          </div>
                        )}
                        {/* Error tooltip for invalid cells */}
                        {showValidation && !cellStatus.isValid && !isEditing && (
                          <div
                            style={{
                              position: 'absolute',
                              backgroundColor: '#dc3545',
                              color: 'white',
                              padding: '4px 8px',
                              borderRadius: '4px',
                              fontSize: '12px',
                              zIndex: 1000,
                              maxWidth: '300px',
                              wordWrap: 'break-word',
                              display: 'none' // Will be shown on hover
                            }}
                            className="validation-tooltip"
                          >
                            {cellStatus.error}
                          </div>
                        )}
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {editable && (
        <div style={{ marginTop: '16px', fontSize: '14px', color: '#666' }}>
          <p>💡 Click on any cell to edit. Press Enter to save, Escape to cancel.</p>
        </div>
      )}
    </div>
  )
}

export default EditableTable
