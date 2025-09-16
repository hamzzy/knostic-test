import React, { useState, useEffect } from 'react'

const EditableTable = ({ data, headers, onChange, editable = false }) => {
  const [localData, setLocalData] = useState(data)
  const [editingCell, setEditingCell] = useState(null)

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

  return (
    <div>
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
            {localData.map((row, rowIndex) => (
              <tr key={rowIndex}>
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

                  return (
                    <td key={header}>
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
                            border: '1px solid #ddd',
                            borderRadius: '4px'
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
                            wordBreak: 'break-word'
                          }}
                          title={editable ? 'Click to edit' : ''}
                        >
                          {value}
                        </div>
                      )}
                    </td>
                  )
                })}
              </tr>
            ))}
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
