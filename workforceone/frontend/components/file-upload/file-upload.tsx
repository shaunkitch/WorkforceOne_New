'use client'

import { useState, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Upload, 
  File, 
  Image, 
  FileText, 
  X, 
  Download, 
  Eye,
  Trash2,
  Folder,
  Search,
  Filter,
  MoreVertical
} from 'lucide-react'
import { format } from 'date-fns'

interface FileUploadProps {
  onUploadComplete?: (files: UploadedFile[]) => void
  acceptedTypes?: string[]
  maxFileSize?: number // in MB
  maxFiles?: number
  folder?: string
}

interface UploadedFile {
  id: string
  name: string
  size: number
  type: string
  url: string
  path: string
  uploaded_by: string
  created_at: string
  folder?: string
  tags?: string[]
}

export default function FileUpload({ 
  onUploadComplete, 
  acceptedTypes = ['image/*', 'application/pdf', '.doc,.docx,.txt'],
  maxFileSize = 10,
  maxFiles = 5,
  folder = 'documents'
}: FileUploadProps) {
  const [files, setFiles] = useState<File[]>([])
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState<{ [key: string]: number }>({})
  const [dragOver, setDragOver] = useState(false)
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  const handleFileSelect = (selectedFiles: FileList | File[]) => {
    const fileArray = Array.from(selectedFiles)
    const validFiles = fileArray.filter(file => {
      // Check file type
      const isValidType = acceptedTypes.some(type => {
        if (type.includes('*')) {
          return file.type.includes(type.split('/')[0])
        }
        return file.type === type || file.name.endsWith(type.replace('.', ''))
      })

      // Check file size
      const isValidSize = file.size <= maxFileSize * 1024 * 1024

      return isValidType && isValidSize
    })

    // Limit number of files
    const limitedFiles = validFiles.slice(0, maxFiles - files.length)
    setFiles(prev => [...prev, ...limitedFiles])
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    
    const droppedFiles = e.dataTransfer.files
    handleFileSelect(droppedFiles)
  }, [files.length, maxFiles, acceptedTypes, maxFileSize])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
  }, [])

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index))
  }

  const uploadFiles = async () => {
    if (files.length === 0) return

    setUploading(true)
    const uploadedFilesData: UploadedFile[] = []

    try {
      const { data: user } = await supabase.auth.getUser()
      if (!user.user) throw new Error('User not authenticated')

      for (const file of files) {
        const fileExt = file.name.split('.').pop()
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
        const filePath = `${folder}/${fileName}`

        // Update progress
        setProgress(prev => ({ ...prev, [file.name]: 0 }))

        // Upload file to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('documents')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
          })

        if (uploadError) throw uploadError

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('documents')
          .getPublicUrl(filePath)

        // Save file metadata to database
        const { data: fileData, error: dbError } = await supabase
          .from('documents')
          .insert({
            name: file.name,
            size: file.size,
            type: file.type,
            path: filePath,
            url: urlData.publicUrl,
            uploaded_by: user.user.id,
            folder: folder
          })
          .select()
          .single()

        if (dbError) throw dbError

        uploadedFilesData.push(fileData)
        setProgress(prev => ({ ...prev, [file.name]: 100 }))
      }

      setUploadedFiles(prev => [...prev, ...uploadedFilesData])
      setFiles([])
      setProgress({})

      if (onUploadComplete) {
        onUploadComplete(uploadedFilesData)
      }

    } catch (error) {
      console.error('Upload error:', error)
      alert('Upload failed. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  const getFileIcon = (type: string) => {
    if (type.includes('image')) return <Image className="h-6 w-6 text-blue-600" />
    if (type.includes('pdf')) return <FileText className="h-6 w-6 text-red-600" />
    return <File className="h-6 w-6 text-gray-600" />
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Upload className="h-5 w-5 mr-2" />
            File Upload
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragOver 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-lg font-medium text-gray-900 mb-2">
              Drop files here or click to browse
            </p>
            <p className="text-sm text-gray-500 mb-4">
              Supports: {acceptedTypes.join(', ')} • Max {maxFileSize}MB per file • Up to {maxFiles} files
            </p>
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              Choose Files
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept={acceptedTypes.join(',')}
              onChange={(e) => e.target.files && handleFileSelect(e.target.files)}
              className="hidden"
            />
          </div>

          {/* File List */}
          {files.length > 0 && (
            <div className="mt-6">
              <h4 className="font-medium mb-3">Selected Files ({files.length})</h4>
              <div className="space-y-2">
                {files.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      {getFileIcon(file.type)}
                      <div>
                        <p className="font-medium text-sm">{file.name}</p>
                        <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {progress[file.name] !== undefined && (
                        <div className="w-20">
                          <div className="bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${progress[file.name]}%` }}
                            />
                          </div>
                        </div>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeFile(index)}
                        disabled={uploading}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4">
                <Button 
                  onClick={uploadFiles}
                  disabled={uploading || files.length === 0}
                  className="w-full"
                >
                  {uploading ? 'Uploading...' : `Upload ${files.length} File${files.length > 1 ? 's' : ''}`}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}