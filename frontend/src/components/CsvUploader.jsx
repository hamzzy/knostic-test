import React, { useState, useRef } from 'react'
import axios from 'axios'
import HeaderMappingModal from './HeaderMappingModal'

const CsvUploader = ({ onFilesUploaded }) => {
  const [files, setFiles] = useState([])
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState('')
  const [isDragOver, setIsDragOver] = useState(false)
  const [showMappingModal, setShowMappingModal] = useState(false)
  const [currentFileForMapping, setCurrentFileForMapping] = useState(null)
  const fileInputRef = useRef(null)

  const handleFileSelect = (selectedFiles) => {
    const csvFiles = Array.from(selectedFiles).filter(file => 
      file.type === 'text/csv' || file.name.toLowerCase().endsWith('.csv')
    )
    
    if (csvFiles.length === 0) {
      setError('Please select CSV files only')
      return
    }

    if (csvFiles.length !== selectedFiles.length) {
      setError('Some files were skipped - only CSV files are allowed')
    } else {
      setError('')
    }

    const newFiles = csvFiles.map(file => {
      // Role will be determined by backend header validation
      return {
        file,
        name: file.name,
        size: file.size,
        role: 'auto', // Will be determined by backend
        parsed: null,
        error: null
      }
    })

    setFiles(prev => [...prev, ...newFiles])
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragOver(false)
    const droppedFiles = e.dataTransfer.files
    handleFileSelect(droppedFiles)
  }

  const handleFileInputChange = (e) => {
    handleFileSelect(e.target.files)
  }

  // Role changes are no longer needed - roles are determined by backend header validation

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index))
  }

  const uploadFiles = async () => {
    if (files.length === 0) {
      setError('Please select files to upload')
      return
    }

    // Files will be processed by backend which will determine roles based on headers

    setIsUploading(true)
    setError('')

    try {
      const formData = new FormData()
      files.forEach(fileObj => {
        formData.append('files', fileObj.file)
      })

      const response = await axios.post('/api/csv/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })

      if (response.data.success) {
        const processedFiles = []
        const filesToMap = []
        
        // Process each file response
        Object.entries(response.data.files).forEach(([filename, fileData]) => {
          const fileObj = files.find(f => f.name === filename)
          if (!fileObj) return
          
          // Use backend role detection exclusively
          let role = fileData.detectedRole
          
          // If role is ambiguous or unknown, mark for mapping
          if (fileData.ambiguous || role === 'unknown') {
            filesToMap.push({
              ...fileObj,
              parsed: fileData,
              role: 'pending_mapping'
            })
          } else {
            processedFiles.push({
              ...fileObj,
              parsed: fileData,
              role: role
            })
          }
        })

        // If there are files that need mapping, show the modal
        if (filesToMap.length > 0) {
          setCurrentFileForMapping(filesToMap[0])
          setShowMappingModal(true)
          setFiles([...processedFiles, ...filesToMap])
        } else {
          setFiles(processedFiles)
          onFilesUploaded(processedFiles)
        }
      } else {
        setError('Upload failed: ' + (response.data.error || 'Unknown error'))
      }
    } catch (err) {
      setError('Upload failed: ' + (err.response?.data?.error || err.message))
    } finally {
      setIsUploading(false)
    }
  }

  const handleMappingConfirm = (mappingData) => {
    const { role, headerMapping } = mappingData
    
    // Update the current file with the mapping
    setFiles(prev => prev.map(file => {
      if (file === currentFileForMapping) {
        return {
          ...file,
          role: role,
          parsed: {
            ...file.parsed,
            detectedRole: role,
            headerMapping: headerMapping
          }
        }
      }
      return file
    }))

    // Check if there are more files that need mapping
    const remainingFilesToMap = files.filter(f => f.role === 'pending_mapping')
    if (remainingFilesToMap.length > 1) {
      // Show next file for mapping
      setCurrentFileForMapping(remainingFilesToMap[1])
    } else {
      // All files mapped, proceed with upload
      setShowMappingModal(false)
      setCurrentFileForMapping(null)
      
      // Filter out pending mapping files and call onFilesUploaded
      const finalFiles = files.map(file => 
        file.role === 'pending_mapping' 
          ? { ...file, role: role, parsed: { ...file.parsed, detectedRole: role, headerMapping: headerMapping } }
          : file
      ).filter(file => file.role !== 'pending_mapping')
      
      onFilesUploaded(finalFiles)
    }
  }

  const handleMappingCancel = () => {
    setShowMappingModal(false)
    setCurrentFileForMapping(null)
    // Remove files that were pending mapping
    setFiles(prev => prev.filter(file => file.role !== 'pending_mapping'))
  }

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className="upload-section">
      <h2>Upload CSV Files</h2>
      
      <div
        className={`upload-area ${isDragOver ? 'dragover' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".csv"
          onChange={handleFileInputChange}
        />
        <div className="upload-text">
          <p>Drag and drop CSV files here, or click to select files</p>
          <p>Supported: .csv files only</p>
        </div>
        <button className="upload-button" type="button">
          Select Files
        </button>
      </div>

      {error && <div className="error">{error}</div>}

      {files.length > 0 && (
        <div className="file-list">
          <h3>Selected Files</h3>
          {files.map((fileObj, index) => (
            <div key={index} className="file-item">
              <div className="file-info">
                <span className="file-name">{fileObj.name}</span>
                <span className="file-size">{formatFileSize(fileObj.size)}</span>
              </div>
              
              <div className="file-role">
                <label>Status:</label>
                {fileObj.role === 'pending_mapping' ? (
                  <span className="status-pending">⚠️ Needs Header Mapping</span>
                ) : fileObj.role === 'strings' ? (
                  <span className="status-strings">📝 Strings Data</span>
                ) : fileObj.role === 'classifications' ? (
                  <span className="status-classifications">🏷️ Classifications Data</span>
                ) : (
                  <span className="status-auto">🔍 Auto-detecting...</span>
                )}
              </div>

              <button
                className="remove-button"
                onClick={() => removeFile(index)}
              >
                Remove
              </button>
            </div>
          ))}

          <div className="button-group">
            <button
              className="button button-primary"
              onClick={uploadFiles}
              disabled={isUploading}
            >
              {isUploading ? (
                <div className="loading">
                  <div className="spinner"></div>
                  Uploading...
                </div>
              ) : (
                'Upload & Parse Files'
              )}
            </button>
          </div>
        </div>
      )}

      <HeaderMappingModal
        isOpen={showMappingModal}
        onClose={handleMappingCancel}
        fileData={currentFileForMapping?.parsed}
        onConfirmMapping={handleMappingConfirm}
      />
    </div>
  )
}

export default CsvUploader
