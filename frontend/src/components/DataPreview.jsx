import React, { useState } from 'react'
import EditableTable from './EditableTable'
import ValidationResults from './ValidationResults'
import ExportButtons from './ExportButtons'

const DataPreview = ({ 
  stringsData, 
  classificationsData, 
  editedStringsData,
  editedClassificationsData,
  onBackToUpload, 
  onEditData,
  onStringsDataChange,
  onClassificationsDataChange,
  isEditMode 
}) => {
  console.log('DataPreview received:', { stringsData, classificationsData, editedStringsData, editedClassificationsData })
  const [validationResults, setValidationResults] = useState(null)
  const [isValidating, setIsValidating] = useState(false)
  const [invalidStringsRows, setInvalidStringsRows] = useState([])
  const [invalidClassificationsRows, setInvalidClassificationsRows] = useState([])

  const handleValidate = async () => {
    setIsValidating(true)
    try {
      const response = await fetch('/api/csv/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          strings: {
            headers: getTableHeaders(editedStringsData),
            rows: editedStringsData
          },
          classifications: {
            headers: getTableHeaders(editedClassificationsData),
            rows: editedClassificationsData
          }
        })
      })

      const result = await response.json()
      setValidationResults(result)
    } catch (error) {
      console.error('Validation error:', error)
      setValidationResults({
        success: false,
        valid: false,
        error: 'Validation failed: ' + error.message
      })
    } finally {
      setIsValidating(false)
    }
  }

  const handleStringsDataChange = (newData) => {
    onStringsDataChange(newData)
    // Clear validation results when data changes
    if (validationResults) {
      setValidationResults(null)
    }
  }

  const handleClassificationsDataChange = (newData) => {
    onClassificationsDataChange(newData)
    // Clear validation results when data changes
    if (validationResults) {
      setValidationResults(null)
    }
  }

  const handleInvalidRowsChange = (invalidIndices) => {
    setInvalidStringsRows(invalidIndices)
    setInvalidClassificationsRows(invalidIndices)
  }

  const getTableHeaders = (data) => {
    if (!data || data.length === 0) return []
    return Object.keys(data[0])
  }

  return (
    <div>
      <div className="preview-section">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2>Data Preview</h2>
          <div className="button-group">
            <button className="button button-secondary" onClick={onBackToUpload}>
              Back to Upload
            </button>
            <button className="button button-primary" onClick={onEditData}>
              {isEditMode ? 'View Mode' : 'Edit Data'}
            </button>
          </div>
        </div>

        {stringsData.length > 0 && (
          <div style={{ marginBottom: '30px' }}>
            <h3>Strings Data ({stringsData.length} rows)</h3>
            <EditableTable
              data={stringsData}
              headers={getTableHeaders(stringsData)}
              onChange={handleStringsDataChange}
              editable={isEditMode}
              invalidRowIndices={invalidStringsRows}
              rowsPerPage={10}
              enablePagination={true}
            />
          </div>
        )}

        {classificationsData.length > 0 && (
          <div style={{ marginBottom: '30px' }}>
            <h3>Classifications Data ({classificationsData.length} rows)</h3>
            <EditableTable
              data={classificationsData}
              headers={getTableHeaders(classificationsData)}
              onChange={handleClassificationsDataChange}
              editable={isEditMode}
              invalidRowIndices={invalidClassificationsRows}
              rowsPerPage={10}
            />
          </div>
        )}

        {stringsData.length === 0 && classificationsData.length === 0 && (
          <div className="error">
            No data available. Please upload CSV files first.
          </div>
        )}
      </div>

      {stringsData.length > 0 && classificationsData.length > 0 && (
        <div className="preview-section">
          <h3>Validation</h3>
          <p>Validate that all strings data has corresponding classifications.</p>
          
          <div className="button-group">
            <button
              className="button button-primary"
              onClick={handleValidate}
              disabled={isValidating}
            >
              {isValidating ? (
                <div className="loading">
                  <div className="spinner"></div>
                  Validating...
                </div>
              ) : (
                'Validate Data'
              )}
            </button>
          </div>

          {validationResults && (
            <ValidationResults 
              results={validationResults} 
              onInvalidRowsChange={handleInvalidRowsChange}
            />
          )}
        </div>
      )}

      {(stringsData.length > 0 || classificationsData.length > 0) && (
        <div className="preview-section">
          <h3>Export</h3>
          <p>Export your data as CSV files.</p>
          
          <ExportButtons
            stringsData={editedStringsData}
            classificationsData={editedClassificationsData}
            stringsHeaders={getTableHeaders(editedStringsData)}
            classificationsHeaders={getTableHeaders(editedClassificationsData)}
            validationPassed={validationResults?.valid === true}
          />
        </div>
      )}
    </div>
  )
}

export default DataPreview
