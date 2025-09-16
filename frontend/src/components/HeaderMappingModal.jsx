import React, { useState, useEffect } from 'react'

const HeaderMappingModal = ({ 
  isOpen, 
  onClose, 
  fileData, 
  onConfirmMapping 
}) => {
  const [mapping, setMapping] = useState({})
  const [detectedRole, setDetectedRole] = useState('unknown')

  useEffect(() => {
    if (fileData && isOpen) {
      // Initialize mapping with detected role
      setDetectedRole(fileData.detectedRole || 'unknown')
      
      // Create initial mapping based on normalized header map
      const initialMapping = {}
      if (fileData.normalizedHeaderMap) {
        Object.entries(fileData.normalizedHeaderMap).forEach(([original, canonical]) => {
          initialMapping[original] = canonical
        })
      }
      setMapping(initialMapping)
    }
  }, [fileData, isOpen])

  const handleRoleChange = (role) => {
    setDetectedRole(role)
  }

  const handleHeaderMappingChange = (originalHeader, canonicalHeader) => {
    setMapping(prev => ({
      ...prev,
      [originalHeader]: canonicalHeader
    }))
  }

  const handleConfirm = () => {
    onConfirmMapping({
      role: detectedRole,
      headerMapping: mapping
    })
    onClose()
  }

  const getRequiredHeaders = (role) => {
    const requiredHeaders = {
      strings: ['Tier', 'Industry', 'Topic', 'SubTopic', 'Prefix', 'Fuzzing-Idx', 'Prompt', 'Risks', 'Keywords'],
      classifications: ['Topic', 'SubTopic', 'Industry', 'Classification']
    }
    return requiredHeaders[role] || []
  }

  const getCanonicalOptions = (role) => {
    const allCanonical = [
      'Tier', 'Industry', 'Topic', 'SubTopic', 'Prefix', 'Fuzzing-Idx', 
      'Prompt', 'Risks', 'Keywords', 'Classification'
    ]
    
    if (role === 'strings') {
      return allCanonical.filter(h => h !== 'Classification')
    } else if (role === 'classifications') {
      return allCanonical.filter(h => !['Tier', 'Prefix', 'Fuzzing-Idx', 'Prompt', 'Risks', 'Keywords'].includes(h))
    }
    return allCanonical
  }

  if (!isOpen || !fileData) return null

  const originalHeaders = fileData.headers || []
  const requiredHeaders = getRequiredHeaders(detectedRole)
  const canonicalOptions = getCanonicalOptions(detectedRole)

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Header Mapping Required</h2>
          <p>This file has ambiguous headers. Please map the headers to their canonical names and assign a role.</p>
        </div>

        <div className="modal-body">
          <div className="file-info">
            <h3>File: {fileData.originalName}</h3>
            <p>Detected Role: <strong>{fileData.detectedRole || 'Unknown'}</strong></p>
            {fileData.ambiguous && (
              <p className="warning">⚠️ This file could be either strings or classifications data</p>
            )}
          </div>

          <div className="role-selection">
            <h4>Assign Role:</h4>
            <div className="role-options">
              <label className="role-option">
                <input
                  type="radio"
                  name="role"
                  value="strings"
                  checked={detectedRole === 'strings'}
                  onChange={(e) => handleRoleChange(e.target.value)}
                />
                <span>Strings Data</span>
              </label>
              <label className="role-option">
                <input
                  type="radio"
                  name="role"
                  value="classifications"
                  checked={detectedRole === 'classifications'}
                  onChange={(e) => handleRoleChange(e.target.value)}
                />
                <span>Classifications Data</span>
              </label>
            </div>
          </div>

          <div className="header-mapping">
            <h4>Map Headers to Canonical Names:</h4>
            <div className="mapping-table">
              <div className="mapping-header">
                <div>Original Header</div>
                <div>Canonical Header</div>
                <div>Required</div>
              </div>
              {originalHeaders.map((originalHeader, index) => (
                <div key={index} className="mapping-row">
                  <div className="original-header">
                    <code>{originalHeader}</code>
                  </div>
                  <div className="canonical-select">
                    <select
                      value={mapping[originalHeader] || ''}
                      onChange={(e) => handleHeaderMappingChange(originalHeader, e.target.value)}
                    >
                      <option value="">Select canonical header...</option>
                      {canonicalOptions.map(canonical => (
                        <option key={canonical} value={canonical}>
                          {canonical}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="required-indicator">
                    {requiredHeaders.some(req => 
                      mapping[originalHeader] === req
                    ) ? (
                      <span className="required">✓ Required</span>
                    ) : (
                      <span className="optional">Optional</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="validation-status">
            <h4>Validation Status:</h4>
            {detectedRole !== 'unknown' && (
              <div className="status-info">
                {requiredHeaders.every(req => 
                  Object.values(mapping).includes(req)
                ) ? (
                  <div className="status-valid">
                    ✅ All required headers are mapped
                  </div>
                ) : (
                  <div className="status-invalid">
                    ❌ Missing required headers: {
                      requiredHeaders
                        .filter(req => !Object.values(mapping).includes(req))
                        .join(', ')
                    }
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="modal-footer">
          <button className="button button-secondary" onClick={onClose}>
            Cancel
          </button>
          <button 
            className="button button-primary" 
            onClick={handleConfirm}
            disabled={detectedRole === 'unknown' || !Object.values(mapping).some(v => v)}
          >
            Confirm Mapping
          </button>
        </div>
      </div>
    </div>
  )
}

export default HeaderMappingModal
