import React, { useState, useEffect } from 'react'

const EditableTable = ({ data, headers, onChange, editable = false, invalidRowIndices = [], rowsPerPage = 10, enablePagination = true }) => {
  const [localData, setLocalData] = useState(data)
  const [editingCell, setEditingCell] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    setLocalData(data)
    setCurrentPage(1) // Reset to first page when data changes
  }, [data])

  // Pagination logic
  const totalPages = enablePagination ? Math.ceil(localData.length / rowsPerPage) : 1
  const startIndex = enablePagination ? (currentPage - 1) * rowsPerPage : 0
  const endIndex = enablePagination ? startIndex + rowsPerPage : localData.length
  const currentData = enablePagination ? localData.slice(startIndex, endIndex) : localData

  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
    }
  }

  const goToFirstPage = () => goToPage(1)
  const goToLastPage = () => goToPage(totalPages)
  const goToPreviousPage = () => goToPage(currentPage - 1)
  const goToNextPage = () => goToPage(currentPage + 1)

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
      <div className="button-group" style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          {editable && (
            <button className="button button-primary" onClick={handleAddRow}>
              Add Row
            </button>
          )}
        </div>
        {enablePagination && (
          <div style={{ fontSize: '14px', color: '#666' }}>
            Showing {startIndex + 1}-{Math.min(endIndex, localData.length)} of {localData.length} rows
          </div>
        )}
      </div>

      <div style={{ overflowX: 'auto', maxWidth: '100%' }}>
        <table className={`preview-table ${enablePagination ? 'paginated' : ''}`} style={{ width: '100%' }}>
          <thead>
            <tr>
              {editable && <th style={{ width: '80px' }}>Actions</th>}
              {headers.map(header => (
                <th key={header}>{header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {currentData.map((row, localIndex) => {
              const actualRowIndex = startIndex + localIndex
              const isInvalid = invalidRowIndices.includes(actualRowIndex)
              return (
                <tr 
                  key={actualRowIndex}
                  className={isInvalid ? 'invalid-row' : ''}
                  style={isInvalid ? {
                    backgroundColor: '#fef2f2',
                    borderLeft: '4px solid #ef4444'
                  } : {}}
                >
                {editable && (
                  <td>
                    <button
                      className="remove-button"
                      onClick={() => handleDeleteRow(actualRowIndex)}
                      style={{ fontSize: '12px', padding: '4px 8px' }}
                    >
                      Delete
                    </button>
                  </td>
                )}
                {headers.map(header => {
                  const cellKey = `${actualRowIndex}-${header}`
                  const isEditing = editingCell === cellKey
                  const value = row[header] || ''

                  return (
                    <td key={header}>
                      {isEditing ? (
                        <input
                          type="text"
                          value={value}
                          onChange={(e) => handleCellChange(actualRowIndex, header, e.target.value)}
                          onBlur={stopEditing}
                          onKeyDown={(e) => handleKeyPress(e, actualRowIndex, header)}
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
                          onClick={() => startEditing(actualRowIndex, header)}
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
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {enablePagination && totalPages > 1 && (
        <div style={{ 
          marginTop: '20px', 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center',
          gap: '8px',
          flexWrap: 'wrap'
        }}>
          <button 
            className="button button-secondary"
            onClick={goToFirstPage}
            disabled={currentPage === 1}
            style={{ padding: '6px 12px', fontSize: '12px' }}
          >
            First
          </button>
          <button 
            className="button button-secondary"
            onClick={goToPreviousPage}
            disabled={currentPage === 1}
            style={{ padding: '6px 12px', fontSize: '12px' }}
          >
            Previous
          </button>
          
          <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }
              
              return (
                <button
                  key={pageNum}
                  className={`button ${currentPage === pageNum ? 'button-primary' : 'button-secondary'}`}
                  onClick={() => goToPage(pageNum)}
                  style={{ 
                    padding: '6px 12px', 
                    fontSize: '12px',
                    minWidth: '32px'
                  }}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>
          
          <button 
            className="button button-secondary"
            onClick={goToNextPage}
            disabled={currentPage === totalPages}
            style={{ padding: '6px 12px', fontSize: '12px' }}
          >
            Next
          </button>
          <button 
            className="button button-secondary"
            onClick={goToLastPage}
            disabled={currentPage === totalPages}
            style={{ padding: '6px 12px', fontSize: '12px' }}
          >
            Last
          </button>
        </div>
      )}

      {editable && (
        <div style={{ marginTop: '16px', fontSize: '14px', color: '#666' }}>
          <p>💡 Click on any cell to edit. Press Enter to save, Escape to cancel.</p>
        </div>
      )}
    </div>
  )
}

export default EditableTable
