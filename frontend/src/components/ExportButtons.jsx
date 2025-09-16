import React, { useState } from 'react'
import ValidationResults from './ValidationResults'

const ExportButtons = ({ 
  stringsData, 
  classificationsData, 
  stringsHeaders, 
  classificationsHeaders 
}) => {
  const [isExporting, setIsExporting] = useState(false)
  const [isValidating, setIsValidating] = useState(false)
  const [exportError, setExportError] = useState('')
  const [validationResults, setValidationResults] = useState(null)
  const [showValidationResults, setShowValidationResults] = useState(false)

  const validateData = async () => {
    setIsValidating(true)
    setExportError('')
    setShowValidationResults(false)
    
    try {
      const response = await fetch('/api/csv/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          stringsData: stringsData,
          classificationsData: classificationsData
        })
      })

      const result = await response.json()
      setValidationResults(result)
      setShowValidationResults(true)
      
      return result.valid
    } catch (error) {
      console.error('Validation error:', error)
      setExportError('Validation failed: ' + error.message)
      setValidationResults({
        valid: false,
        error: 'Validation failed: ' + error.message
      })
      setShowValidationResults(true)
      return false
    } finally {
      setIsValidating(false)
    }
  }

  const downloadCSV = (data, headers, filename) => {
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header] || ''
          // Escape commas and quotes in CSV
          if (value.includes(',') || value.includes('"') || value.includes('\n')) {
            return `"${value.replace(/"/g, '""')}"`
          }
          return value
        }).join(',')
      )
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  }

  const handleExport = async (data, headers, filename) => {
    // First validate the data
    const isValid = await validateData()
    
    if (!isValid) {
      setExportError('Export blocked: Data validation failed. Please fix the errors above before exporting.')
      return
    }

    setIsExporting(true)
    setExportError('')

    try {
      const response = await fetch('/api/csv/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          rows: data,
          headers: headers,
          filename: filename
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Export failed')
      }

      // Get the CSV content from response
      const csvContent = await response.text()
      
      // Create and download the file
      const blob = new Blob([csvContent], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

    } catch (error) {
      console.error('Export error:', error)
      setExportError('Export failed: ' + error.message)
    } finally {
      setIsExporting(false)
    }
  }

  const handleExportStrings = () => {
    if (stringsData && stringsData.length > 0) {
      handleExport(stringsData, stringsHeaders, 'strings.csv')
    }
  }

  const handleExportClassifications = () => {
    if (classificationsData && classificationsData.length > 0) {
      handleExport(classificationsData, classificationsHeaders, 'classifications.csv')
    }
  }

  const handleExportAll = () => {
    if (stringsData && stringsData.length > 0) {
      handleExportStrings()
    }
    if (classificationsData && classificationsData.length > 0) {
      setTimeout(() => handleExportClassifications(), 100)
    }
  }

  return (
    <div>
      {exportError && <div className="error">{exportError}</div>}
      
      <div className="button-group">
        <button
          className="button button-secondary"
          onClick={validateData}
          disabled={isValidating || isExporting}
        >
          {isValidating ? 'Validating...' : 'Validate Data Only'}
        </button>
        
        {stringsData && stringsData.length > 0 && (
          <button
            className="button button-primary"
            onClick={handleExportStrings}
            disabled={isExporting || isValidating}
          >
            {isValidating ? 'Validating...' : isExporting ? 'Exporting...' : 'Export Strings Data'}
          </button>
        )}
        
        {classificationsData && classificationsData.length > 0 && (
          <button
            className="button button-primary"
            onClick={handleExportClassifications}
            disabled={isExporting || isValidating}
          >
            {isValidating ? 'Validating...' : isExporting ? 'Exporting...' : 'Export Classifications Data'}
          </button>
        )}
        
        {stringsData && stringsData.length > 0 && classificationsData && classificationsData.length > 0 && (
          <button
            className="button button-success"
            onClick={handleExportAll}
            disabled={isExporting || isValidating}
          >
            {isValidating ? 'Validating...' : isExporting ? 'Exporting...' : 'Export All Data'}
          </button>
        )}
      </div>

      {showValidationResults && validationResults && (
        <div style={{ marginTop: '20px' }}>
          <ValidationResults results={validationResults} />
        </div>
      )}

      <div style={{ marginTop: '16px', fontSize: '14px', color: '#666' }}>
        <p>💡 Data will be validated before export. Invalid data will be highlighted and export will be blocked.</p>
      </div>
    </div>
  )
}

export default ExportButtons
