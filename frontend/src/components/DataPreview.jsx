import React, { useState } from 'react'
import EditableTable from './EditableTable'
import ValidationResults from './ValidationResults'
import ExportButtons from './ExportButtons'
import ValidationWrapper from './ValidationWrapper'

const DataPreview = ({ 
  stringsData, 
  classificationsData, 
  onBackToUpload, 
  onEditData,
  isEditMode 
}) => {
  console.log('DataPreview received:', { stringsData, classificationsData })
  const [validationResults, setValidationResults] = useState(null)
  const [isValidating, setIsValidating] = useState(false)
  const [editedStringsData, setEditedStringsData] = useState(stringsData)
  const [editedClassificationsData, setEditedClassificationsData] = useState(classificationsData)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  const handleValidate = async () => {
    setIsValidating(true)
    try {
      const response = await fetch('/api/csv/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          stringsData: editedStringsData,
          classificationsData: editedClassificationsData
        })
      })

      const result = await response.json()
      setValidationResults(result)
    } catch (error) {
      console.error('Validation error:', error)
      setValidationResults({
        valid: false,
        error: 'Validation failed: ' + error.message
      })
    } finally {
      setIsValidating(false)
    }
  }

  const handleStringsDataChange = (newData) => {
    setEditedStringsData(newData)
    setHasUnsavedChanges(true)
    // Clear validation results when data changes
    if (validationResults) {
      setValidationResults(null)
    }
  }

  const handleClassificationsDataChange = (newData) => {
    setEditedClassificationsData(newData)
    setHasUnsavedChanges(true)
    // Clear validation results when data changes
    if (validationResults) {
      setValidationResults(null)
    }
  }

  const handleSaveChanges = () => {
    // This would typically save to the backend or update parent state
    setStringsData(editedStringsData)
    setClassificationsData(editedClassificationsData)
    setHasUnsavedChanges(false)
    alert('Changes saved successfully!')
  }

  const handleCancelChanges = () => {
    setEditedStringsData(stringsData)
    setEditedClassificationsData(classificationsData)
    setHasUnsavedChanges(false)
    setValidationResults(null)
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
            {isEditMode ? (
              <>
                <button className="button button-secondary" onClick={handleCancelChanges}>
                  Cancel
                </button>
                <button 
                  className="button button-success" 
                  onClick={handleSaveChanges}
                  disabled={!hasUnsavedChanges}
                >
                  Save Changes
                </button>
                <button className="button button-primary" onClick={onEditData}>
                  View Mode
                </button>
              </>
            ) : (
              <button className="button button-primary" onClick={onEditData}>
                Edit Data
              </button>
            )}
          </div>
        </div>

        {isEditMode ? (
          <ValidationWrapper
            stringsData={editedStringsData}
            classificationsData={classificationsData}
            onSave={handleSaveChanges}
            onCancel={handleCancelChanges}
            hasUnsavedChanges={hasUnsavedChanges}
          >
            {stringsData.length > 0 && (
              <div style={{ marginBottom: '30px' }}>
                <h3>Strings Data ({stringsData.length} rows)</h3>
                <EditableTable
                  data={editedStringsData}
                  headers={getTableHeaders(stringsData)}
                  onChange={handleStringsDataChange}
                  editable={true}
                  classificationsData={classificationsData}
                  showValidation={classificationsData.length > 0}
                />
              </div>
            )}

            {classificationsData.length > 0 && (
              <div style={{ marginBottom: '30px' }}>
                <h3>Classifications Data ({classificationsData.length} rows)</h3>
                <EditableTable
                  data={editedClassificationsData}
                  headers={getTableHeaders(classificationsData)}
                  onChange={handleClassificationsDataChange}
                  editable={true}
                />
              </div>
            )}
          </ValidationWrapper>
        ) : (
          <>
            {stringsData.length > 0 && (
              <div style={{ marginBottom: '30px' }}>
                <h3>Strings Data ({stringsData.length} rows)</h3>
                <EditableTable
                  data={stringsData}
                  headers={getTableHeaders(stringsData)}
                  onChange={handleStringsDataChange}
                  editable={false}
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
                  editable={false}
                />
              </div>
            )}
          </>
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
            <ValidationResults results={validationResults} />
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
          />
        </div>
      )}
    </div>
  )
}

export default DataPreview
