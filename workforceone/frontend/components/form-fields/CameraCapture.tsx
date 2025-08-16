'use client'

import { useRef, useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Camera, Upload, X, Eye, Download } from 'lucide-react'
import Image from 'next/image'

interface CameraCaptureProps {
  label: string
  required?: boolean
  value?: string[]
  onChange: (value: string[]) => void
  multiple?: boolean
  maxSize?: number // in MB
  allowUpload?: boolean
  className?: string
  error?: string
}

export default function CameraCapture({
  label,
  required = false,
  value = [],
  onChange,
  multiple = false,
  maxSize = 5,
  allowUpload = true,
  className = '',
  error
}: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isCameraActive, setIsCameraActive] = useState(false)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [capturedImages, setCapturedImages] = useState<string[]>(value)

  const startCamera = useCallback(async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' } // Use back camera on mobile
      })
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
        setStream(mediaStream)
        setIsCameraActive(true)
      }
    } catch (err) {
      console.error('Error accessing camera:', err)
      alert('Unable to access camera. Please check permissions.')
    }
  }, [])

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop())
      setStream(null)
    }
    setIsCameraActive(false)
  }, [stream])

  const capturePhoto = useCallback(() => {
    const video = videoRef.current
    const canvas = canvasRef.current
    
    if (!video || !canvas) return

    const context = canvas.getContext('2d')
    if (!context) return

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    // Draw the video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height)

    // Convert to data URL
    const dataURL = canvas.toDataURL('image/jpeg', 0.8)
    
    const newImages = multiple ? [...capturedImages, dataURL] : [dataURL]
    setCapturedImages(newImages)
    onChange(newImages)

    // Stop camera after single capture if not multiple
    if (!multiple) {
      stopCamera()
    }
  }, [capturedImages, multiple, onChange, stopCamera])

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    const fileArray = Array.from(files)
    
    fileArray.forEach(file => {
      // Check file size
      if (file.size > maxSize * 1024 * 1024) {
        alert(`File ${file.name} is too large. Maximum size is ${maxSize}MB.`)
        return
      }

      // Check if it's an image
      if (!file.type.startsWith('image/')) {
        alert(`File ${file.name} is not an image.`)
        return
      }

      const reader = new FileReader()
      reader.onload = (event) => {
        const dataURL = event.target?.result as string
        if (dataURL) {
          const newImages = multiple ? [...capturedImages, dataURL] : [dataURL]
          setCapturedImages(newImages)
          onChange(newImages)
        }
      }
      reader.readAsDataURL(file)
    })

    // Clear the input
    e.target.value = ''
  }, [capturedImages, maxSize, multiple, onChange])

  const removeImage = useCallback((index: number) => {
    const newImages = capturedImages.filter((_, i) => i !== index)
    setCapturedImages(newImages)
    onChange(newImages)
  }, [capturedImages, onChange])

  const downloadImage = useCallback((dataURL: string, index: number) => {
    const link = document.createElement('a')
    link.href = dataURL
    link.download = `photo-${index + 1}.jpg`
    link.click()
  }, [])

  return (
    <div className={`space-y-4 ${className}`}>
      <Label className="text-base font-semibold text-gray-800 flex items-center">
        {label}
        {required && <span className="text-red-500 ml-2 text-lg">*</span>}
      </Label>

      {/* Camera Controls */}
      <div className="flex flex-wrap gap-2">
        {!isCameraActive ? (
          <Button
            type="button"
            variant="outline"
            onClick={startCamera}
            className="hover:bg-blue-50 hover:text-blue-600"
          >
            <Camera className="h-4 w-4 mr-2" />
            Open Camera
          </Button>
        ) : (
          <>
            <Button
              type="button"
              onClick={capturePhoto}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Camera className="h-4 w-4 mr-2" />
              Take Photo
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={stopCamera}
              className="hover:bg-red-50 hover:text-red-600"
            >
              <X className="h-4 w-4 mr-2" />
              Close Camera
            </Button>
          </>
        )}

        {allowUpload && (
          <>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple={multiple}
              onChange={handleFileUpload}
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              className="hover:bg-green-50 hover:text-green-600"
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload Image
            </Button>
          </>
        )}
      </div>

      {/* Camera Video Feed */}
      {isCameraActive && (
        <div className="relative">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="w-full max-w-md mx-auto rounded-lg border-2 border-gray-300"
          />
          <canvas
            ref={canvasRef}
            className="hidden"
          />
        </div>
      )}

      {/* Captured Images */}
      {capturedImages.length > 0 && (
        <div className="space-y-3">
          <Label className="text-sm font-medium text-gray-700">
            Captured Images ({capturedImages.length})
          </Label>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {capturedImages.map((imageData, index) => (
              <div key={index} className="relative group">
                <div className="aspect-square relative rounded-lg overflow-hidden border-2 border-gray-200">
                  <Image
                    src={imageData}
                    alt={`Captured photo ${index + 1}`}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="absolute top-2 right-2 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={() => downloadImage(imageData, index)}
                    className="p-1 h-6 w-6 bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Download className="h-3 w-3" />
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="destructive"
                    onClick={() => removeImage(index)}
                    className="p-1 h-6 w-6"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
                <div className="absolute bottom-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                  {index + 1}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {capturedImages.length === 0 && (
        <div className={`border-2 border-dashed rounded-lg p-8 text-center ${
          error ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-gray-50'
        }`}>
          <div className="text-4xl mb-2">📷</div>
          <p className="text-sm text-gray-600 mb-2">No photos captured yet</p>
          <p className="text-xs text-gray-500">
            Use the camera or upload images to get started
          </p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center space-x-2">
          <X className="h-4 w-4 text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-700 font-medium">{error}</p>
        </div>
      )}
    </div>
  )
}