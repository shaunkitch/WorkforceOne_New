import { createClient } from '@/lib/supabase/client'

export interface UploadResult {
  success: boolean
  url?: string
  fileName?: string
  error?: string
}

export class FileUploadService {
  private supabase = createClient()

  async uploadFile(file: File, bucket: string = 'form-uploads'): Promise<UploadResult> {
    try {
      // Generate unique filename
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
      const filePath = `${new Date().getFullYear()}/${new Date().getMonth() + 1}/${fileName}`

      // Upload file to Supabase Storage
      const { data, error } = await this.supabase.storage
        .from(bucket)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (error) {
        console.error('Upload error:', error)
        return {
          success: false,
          error: error.message
        }
      }

      // Get public URL
      const { data: { publicUrl } } = this.supabase.storage
        .from(bucket)
        .getPublicUrl(filePath)

      return {
        success: true,
        url: publicUrl,
        fileName: file.name
      }
    } catch (error) {
      console.error('Upload error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed'
      }
    }
  }

  async uploadMultipleFiles(files: File[], bucket: string = 'form-uploads'): Promise<UploadResult[]> {
    const uploadPromises = files.map(file => this.uploadFile(file, bucket))
    return Promise.all(uploadPromises)
  }

  validateFile(file: File, maxSizeMB: number = 10, allowedTypes?: string[]): { valid: boolean; error?: string } {
    // Check file size
    const maxSizeBytes = maxSizeMB * 1024 * 1024
    if (file.size > maxSizeBytes) {
      return {
        valid: false,
        error: `File size exceeds ${maxSizeMB}MB limit`
      }
    }

    // Check file type
    if (allowedTypes && allowedTypes.length > 0) {
      const fileType = file.type
      const fileExt = `.${file.name.split('.').pop()?.toLowerCase()}`
      
      const isAllowed = allowedTypes.some(type => {
        if (type.startsWith('.')) {
          return type.toLowerCase() === fileExt
        }
        if (type.includes('/*')) {
          return fileType.startsWith(type.split('/*')[0])
        }
        return fileType === type
      })

      if (!isAllowed) {
        return {
          valid: false,
          error: `File type not allowed. Accepted types: ${allowedTypes.join(', ')}`
        }
      }
    }

    return { valid: true }
  }

  async deleteFile(filePath: string, bucket: string = 'form-uploads'): Promise<boolean> {
    try {
      const { error } = await this.supabase.storage
        .from(bucket)
        .remove([filePath])

      return !error
    } catch (error) {
      console.error('Delete error:', error)
      return false
    }
  }
}

export const fileUploadService = new FileUploadService()