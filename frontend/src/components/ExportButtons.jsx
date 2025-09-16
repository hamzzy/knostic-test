import React, { useState } from 'react'

const ExportButtons = ({ 
  stringsData, 
  classificationsData, 
  stringsHeaders, 
  classificationsHeaders,
  validationPassed = false
}) => {
  const [isExporting, setIsExporting] = useState(false)
  const [exportError, setExportError] = useState('')

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
          filename: filename,
          validationPassed: validationPassed
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
      
      {!validationPassed && (
        <div className="warning" style={{ 
          background: '#fef3c7', 
          border: '1px solid #f59e0b', 
          borderRadius: '6px', 
          padding: '12px', 
          marginBottom: '16px',
          color: '#92400e'
        }}>
          ⚠️ <strong>Warning:</strong> Data must be validated before export. Please run validation first.
        </div>
      )}
      
      <div className="button-group">
        {stringsData && stringsData.length > 0 && (
          <button
            className="button button-primary"
            onClick={handleExportStrings}
            disabled={isExporting}
          >
            {isExporting ? 'Exporting...' : 'Export Strings Data'}
          </button>
        )}
        
        {classificationsData && classificationsData.length > 0 && (
          <button
            className="button button-primary"
            onClick={handleExportClassifications}
            disabled={isExporting}
          >
            {isExporting ? 'Exporting...' : 'Export Classifications Data'}
          </button>
        )}
        
        {stringsData && stringsData.length > 0 && classificationsData && classificationsData.length > 0 && (
          <button
            className="button button-success"
            onClick={handleExportAll}
            disabled={isExporting}
          >
            {isExporting ? 'Exporting...' : 'Export All Data'}
          </button>
        )}
      </div>

      <div style={{ marginTop: '16px', fontSize: '14px', color: '#666' }}>
        <p>💡 Exported files will be downloaded to your default download folder.</p>
      </div>
    </div>
  )
}

export default ExportButtons
