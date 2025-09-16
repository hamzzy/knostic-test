import React, { useState } from 'react'
import CsvUploader from './components/CsvUploader'
import DataPreview from './components/DataPreview'
import './index.css'

function App() {
  const [uploadedFiles, setUploadedFiles] = useState([])
  const [stringsData, setStringsData] = useState([])
  const [classificationsData, setClassificationsData] = useState([])
  const [editedStringsData, setEditedStringsData] = useState([])
  const [editedClassificationsData, setEditedClassificationsData] = useState([])
  const [currentView, setCurrentView] = useState('upload') // 'upload', 'preview', 'edit'

  const handleFilesUploaded = (files) => {
    console.log('Files uploaded:', files)
    setUploadedFiles(files)
    
    // Separate strings and classifications data
    const strings = files.find(file => file.role === 'strings')
    const classifications = files.find(file => file.role === 'classifications')
    
    
    if (strings && strings.parsed) {
      const stringsRows = strings.parsed.rows || []
      setStringsData(stringsRows)
      setEditedStringsData(stringsRows)
    }
    if (classifications && classifications.parsed) {
      const classificationsRows = classifications.parsed.rows || []
      setClassificationsData(classificationsRows)
      setEditedClassificationsData(classificationsRows)
    }
    
    if (strings || classifications) {
      setCurrentView('preview')
    }
  }

  const handleBackToUpload = () => {
    setCurrentView('upload')
  }

  const handleEditData = () => {
    setCurrentView(currentView === 'edit' ? 'preview' : 'edit')
  }

  const handleStringsDataChange = (newData) => {
    setEditedStringsData(newData)
  }

  const handleClassificationsDataChange = (newData) => {
    setEditedClassificationsData(newData)
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
          stringsData={editedStringsData.length > 0 ? editedStringsData : stringsData}
          classificationsData={editedClassificationsData.length > 0 ? editedClassificationsData : classificationsData}
          editedStringsData={editedStringsData}
          editedClassificationsData={editedClassificationsData}
          onBackToUpload={handleBackToUpload}
          onEditData={handleEditData}
          onStringsDataChange={handleStringsDataChange}
          onClassificationsDataChange={handleClassificationsDataChange}
          isEditMode={currentView === 'edit'}
        />
      )}
    </div>
  )
}

export default App
