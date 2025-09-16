import React from 'react'

const ValidationResults = ({ results }) => {
  if (results.error) {
    return (
      <div className="error">
        <strong>Validation Error:</strong> {results.error}
      </div>
    )
  }

  if (results.valid) {
    return (
      <div className="success">
        <strong>✅ Validation Passed!</strong>
        <p>All {results.totalRows} rows are valid and have corresponding classifications.</p>
      </div>
    )
  }

  return (
    <div className="error">
      <strong>❌ Validation Failed</strong>
      <p>
        Found {results.invalidCount} invalid rows out of {results.totalRows} total rows.
      </p>
      
      {results.invalidRows && results.invalidRows.length > 0 && (
        <div style={{ marginTop: '16px' }}>
          <h4>Invalid Rows:</h4>
          <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
            {results.invalidRows.map((invalidRow, index) => (
              <div
                key={index}
                style={{
                  background: '#fdf2f2',
                  border: '1px solid #fecaca',
                  borderRadius: '4px',
                  padding: '12px',
                  marginBottom: '8px'
                }}
              >
                <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                  Row {invalidRow.rowIndex + 1}:
                </div>
                <div style={{ color: '#dc2626', marginBottom: '8px' }}>
                  {invalidRow.reason}
                </div>
                <div style={{ fontSize: '14px', color: '#666' }}>
                  <strong>Data:</strong> {JSON.stringify(invalidRow.row, null, 2)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default ValidationResults
