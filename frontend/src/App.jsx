import React, { useState } from 'react'
import CsvUploader from './components/CsvUploader'
import DataPreview from './components/DataPreview'
import './index.css'

function App() {
  const [uploadedFiles, setUploadedFiles] = useState([])
  const [stringsData, setStringsData] = useState([])
  const [classificationsData, setClassificationsData] = useState([])
  const [currentView, setCurrentView] = useState('upload') // 'upload', 'preview', 'edit'

  const handleFilesUploaded = (files) => {
    console.log('Files uploaded:', files)
    setUploadedFiles(files)
    
    // Separate strings and classifications data
    const strings = files.find(file => file.role === 'strings')
    const classifications = files.find(file => file.role === 'classifications')
    
    console.log('Strings file:', strings)
    console.log('Classifications file:', classifications)
    
    if (strings && strings.parsed) {
      console.log('Setting strings data:', strings.parsed.rows)
      setStringsData(strings.parsed.rows || [])
    }
    if (classifications && classifications.parsed) {
      console.log('Setting classifications data:', classifications.parsed.rows)
      setClassificationsData(classifications.parsed.rows || [])
    }
    
    if (strings || classifications) {
      setCurrentView('preview')
    }
  }

  const handleBackToUpload = () => {
    setCurrentView('upload')
  }

  const handleEditData = () => {
    setCurrentView('edit')
  }

  return (
    <div className="container">
      <div className="header">
        <h1>Knostic CSV Data Manager</h1>
        <p>Upload, validate, and export CSV data with ease</p>
      </div>

      {currentView === 'upload' && (
        <CsvUploader onFilesUploaded={handleFilesUploaded} />
      )}

      {(currentView === 'preview' || currentView === 'edit') && (
        <DataPreview
          stringsData={stringsData}
          classificationsData={classificationsData}
          onBackToUpload={handleBackToUpload}
          onEditData={handleEditData}
          isEditMode={currentView === 'edit'}
        />
      )}
    </div>
  )
}

export default App
