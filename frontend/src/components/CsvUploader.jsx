import React, { useState, useRef } from 'react'
import axios from 'axios'

const CsvUploader = ({ onFilesUploaded }) => {
  const [files, setFiles] = useState([])
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState('')
  const [isDragOver, setIsDragOver] = useState(false)
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
      // Auto-detect role based on filename
      let role = 'auto'
      const filename = file.name.toLowerCase()
      if (filename.includes('string')) {
        role = 'strings'
      } else if (filename.includes('classification')) {
        role = 'classifications'
      }
      
      return {
        file,
        name: file.name,
        size: file.size,
        role,
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

  const handleRoleChange = (index, role) => {
    setFiles(prev => prev.map((file, i) => 
      i === index ? { ...file, role } : file
    ))
  }

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index))
  }

  const uploadFiles = async () => {
    if (files.length === 0) {
      setError('Please select files to upload')
      return
    }

    // Check if all files have roles assigned
    const unassignedFiles = files.filter(file => file.role === 'auto')
    if (unassignedFiles.length > 0) {
      setError('Please assign roles to all files (strings or classifications)')
      return
    }

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
        const processedFiles = response.data.files.map((fileData, index) => {
          const fileObj = files[index]
          
          // Auto-detect role based on headers if still 'auto'
          let role = fileObj.role
          if (role === 'auto' && fileData.headers) {
            const headers = fileData.headers.map(h => h.toLowerCase())
            if (headers.includes('classification')) {
              role = 'classifications'
            } else if (headers.includes('topic') && headers.includes('subtopic')) {
              role = 'strings'
            }
          }
          
          return {
            ...fileObj,
            parsed: fileData,
            role: role
          }
        })

        setFiles(processedFiles)
        onFilesUploaded(processedFiles)
      } else {
        setError('Upload failed: ' + (response.data.error || 'Unknown error'))
      }
    } catch (err) {
      setError('Upload failed: ' + (err.response?.data?.error || err.message))
    } finally {
      setIsUploading(false)
    }
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
                <label>Role:</label>
                <select
                  value={fileObj.role}
                  onChange={(e) => handleRoleChange(index, e.target.value)}
                >
                  <option value="auto">Auto-detect</option>
                  <option value="strings">Strings Data</option>
                  <option value="classifications">Classifications Data</option>
                </select>
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
    </div>
  )
}

export default CsvUploader
