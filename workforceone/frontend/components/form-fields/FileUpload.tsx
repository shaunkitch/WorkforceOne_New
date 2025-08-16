'use client'

import { useState, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Upload, X, File, Download, AlertCircle, CheckCircle } from 'lucide-react'
import { fileUploadService, UploadResult } from '@/lib/file-upload'

interface FileInfo {
  name: string
  url: string
  size: number
  type: string
  uploadedAt: string
}

interface FileUploadProps {
  label: string
  required?: boolean
  value?: FileInfo[]
  onChange: (value: FileInfo[]) => void
  multiple?: boolean
  maxSize?: number // in MB
  accept?: string
  className?: string
  error?: string
}

export default function FileUpload({
  label,
  required = false,
  value = [],
  onChange,
  multiple = false,
  maxSize = 10,
  accept,
  className = '',
  error
}: FileUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [dragActive, setDragActive] = useState(false)

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return '🖼️'
    if (type.startsWith('video/')) return '🎥'
    if (type.startsWith('audio/')) return '🎵'
    if (type.includes('pdf')) return '📄'
    if (type.includes('word') || type.includes('document')) return '📝'
    if (type.includes('sheet') || type.includes('excel')) return '📊'
    if (type.includes('presentation') || type.includes('powerpoint')) return '📽️'
    return '📄'
  }

  const parseAcceptTypes = (accept?: string): string[] => {
    if (!accept) return []
    return accept.split(',').map(type => type.trim())
  }

  const handleFileSelect = useCallback(async (files: FileList) => {
    const fileArray = Array.from(files)
    const acceptedTypes = parseAcceptTypes(accept)

    // Validate files
    const validFiles: File[] = []
    for (const file of fileArray) {
      const validation = fileUploadService.validateFile(file, maxSize, acceptedTypes)
      if (validation.valid) {
        validFiles.push(file)
      } else {
        alert(`${file.name}: ${validation.error}`)
      }
    }

    if (validFiles.length === 0) return

    setUploading(true)
    setUploadProgress(0)

    try {
      const uploadResults: UploadResult[] = []
      
      // Upload files one by one with progress
      for (let i = 0; i < validFiles.length; i++) {
        const file = validFiles[i]
        const result = await fileUploadService.uploadFile(file)
        uploadResults.push(result)
        
        // Update progress
        setUploadProgress(((i + 1) / validFiles.length) * 100)
      }

      // Process successful uploads
      const successfulUploads = uploadResults
        .filter(result => result.success)
        .map((result, index) => ({
          name: result.fileName || validFiles[index].name,
          url: result.url!,
          size: validFiles[index].size,
          type: validFiles[index].type,
          uploadedAt: new Date().toISOString()
        }))

      // Update value
      const newFiles = multiple ? [...value, ...successfulUploads] : successfulUploads
      onChange(newFiles)

      // Show errors for failed uploads
      const failedUploads = uploadResults.filter(result => !result.success)
      if (failedUploads.length > 0) {
        const errorMessages = failedUploads.map(result => result.error).join('\n')
        alert(`Some uploads failed:\n${errorMessages}`)
      }

    } catch (error) {
      console.error('Upload error:', error)
      alert('Upload failed. Please try again.')
    } finally {
      setUploading(false)
      setUploadProgress(0)
    }
  }, [accept, maxSize, multiple, value, onChange])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(false)
    
    const files = e.dataTransfer.files
    if (files.length > 0) {
      handleFileSelect(files)
    }
  }, [handleFileSelect])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(false)
  }, [])

  const removeFile = useCallback((index: number) => {
    const newFiles = value.filter((_, i) => i !== index)
    onChange(newFiles)
  }, [value, onChange])

  const downloadFile = useCallback((file: FileInfo) => {
    const link = document.createElement('a')
    link.href = file.url
    link.download = file.name
    link.target = '_blank'
    link.click()
  }, [])

  return (
    <div className={`space-y-4 ${className}`}>
      <Label className="text-base font-semibold text-gray-800 flex items-center">
        {label}
        {required && <span className="text-red-500 ml-2 text-lg">*</span>}
      </Label>

      {/* Upload Area */}
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          dragActive 
            ? 'border-blue-400 bg-blue-50' 
            : error 
            ? 'border-red-300 bg-red-50' 
            : 'border-gray-300 bg-gray-50 hover:border-gray-400'
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple={multiple}
          accept={accept}
          onChange={(e) => e.target.files && handleFileSelect(e.target.files)}
          className="hidden"
        />

        {uploading ? (
          <div className="space-y-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-sm text-gray-600">Uploading files...</p>
            <Progress value={uploadProgress} className="w-full max-w-xs mx-auto" />
            <p className="text-xs text-gray-500">{Math.round(uploadProgress)}% complete</p>
          </div>
        ) : (
          <div className="space-y-2">
            <Upload className="h-8 w-8 text-gray-400 mx-auto" />
            <div>
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="hover:bg-blue-50 hover:text-blue-600"
              >
                Choose Files
              </Button>
              <p className="text-sm text-gray-600 mt-2">
                or drag and drop files here
              </p>
            </div>
            <div className="text-xs text-gray-500 space-y-1">
              {accept && <p>Accepted: {accept}</p>}
              <p>Max size: {maxSize}MB{multiple ? ' per file' : ''}</p>
              {multiple && <p>Multiple files allowed</p>}
            </div>
          </div>
        )}
      </div>

      {/* Uploaded Files */}
      {value.length > 0 && (
        <div className="space-y-3">
          <Label className="text-sm font-medium text-gray-700">
            Uploaded Files ({value.length})
          </Label>
          <div className="space-y-2">
            {value.map((file, index) => (
              <div key={index} className="flex items-center space-x-3 p-3 bg-white border border-gray-200 rounded-lg">
                <div className="text-2xl">{getFileIcon(file.type)}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {file.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatFileSize(file.size)} • {new Date(file.uploadedAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex space-x-1">
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => downloadFile(file)}
                    className="p-2 hover:bg-blue-50 hover:text-blue-600"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => removeFile(index)}
                    className="p-2 hover:bg-red-50 hover:text-red-600"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center space-x-2">
          <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-700 font-medium">{error}</p>
        </div>
      )}
    </div>
  )
}