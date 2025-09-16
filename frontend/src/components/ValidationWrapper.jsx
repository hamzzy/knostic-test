import React from 'react'
import { useValidation } from '../hooks/useValidation'

/**
 * Wrapper component that provides validation context and prevents invalid saves
 */
const ValidationWrapper = ({ 
  children, 
  stringsData, 
  classificationsData, 
  onSave, 
  onCancel,
  hasUnsavedChanges = false 
}) => {
  const validation = useValidation(stringsData, classificationsData)

  const handleSave = () => {
    if (!validation.isValid) {
      alert(`Cannot save: ${validation.validationResults.errors.join(', ')}`)
      return
    }
    
    if (onSave) {
      onSave()
    }
  }

  const handleCancel = () => {
    if (onCancel) {
      onCancel()
    }
  }

  // Clone children and inject validation props
  const childrenWithProps = React.Children.map(children, child => {
    if (React.isValidElement(child)) {
      return React.cloneElement(child, {
        validation,
        onSave: handleSave,
        onCancel: handleCancel,
        canSave: validation.isValid && hasUnsavedChanges,
        hasUnsavedChanges
      })
    }
    return child
  })

  return (
    <div>
      {/* Validation Status Banner */}
      {classificationsData.length > 0 && (
        <div className={`validation-status ${validation.isValid ? 'valid' : 'invalid'}`}>
          <span>
            {validation.isValidating ? '⏳ Validating...' : 
             validation.isValid ? '✅ All data is valid' : '❌ Validation errors found'}
          </span>
          {validation.validationResults.errors.length > 0 && (
            <span>({validation.validationResults.errors.join(', ')})</span>
          )}
        </div>
      )}
      
      {childrenWithProps}
    </div>
  )
}

export default ValidationWrapper
