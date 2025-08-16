'use client'

import { useRef, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Trash2, Download, RotateCcw } from 'lucide-react'

interface SignaturePadProps {
  label: string
  required?: boolean
  value?: string
  onChange: (value: string) => void
  width?: number
  height?: number
  clearButton?: boolean
  className?: string
  error?: string
}

export default function SignaturePad({
  label,
  required = false,
  value,
  onChange,
  width = 400,
  height = 200,
  clearButton = true,
  className = '',
  error
}: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [isEmpty, setIsEmpty] = useState(true)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas size
    canvas.width = width
    canvas.height = height

    // Set drawing styles
    ctx.strokeStyle = '#000000'
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'

    // Load existing signature if available
    if (value && value !== '') {
      const img = new Image()
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        ctx.drawImage(img, 0, 0)
        setIsEmpty(false)
      }
      img.src = value
    }
  }, [width, height, value])

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    setIsDrawing(true)
    ctx.beginPath()
    ctx.moveTo(x, y)
  }

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return

    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.lineTo(x, y)
    ctx.stroke()
    setIsEmpty(false)
  }

  const stopDrawing = () => {
    setIsDrawing(false)
    saveSignature()
  }

  const saveSignature = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const dataURL = canvas.toDataURL('image/png')
    onChange(dataURL)
  }

  const clearSignature = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    setIsEmpty(true)
    onChange('')
  }

  const downloadSignature = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const link = document.createElement('a')
    link.download = 'signature.png'
    link.href = canvas.toDataURL()
    link.click()
  }

  return (
    <div className={`space-y-3 ${className}`}>
      <Label className="text-base font-semibold text-gray-800 flex items-center">
        {label}
        {required && <span className="text-red-500 ml-2 text-lg">*</span>}
      </Label>
      
      <div className={`relative border-2 border-dashed rounded-lg bg-white ${
        error ? 'border-red-300' : 'border-gray-300'
      }`}>
        <canvas
          ref={canvasRef}
          className="cursor-crosshair touch-none"
          style={{ width: '100%', maxWidth: `${width}px`, height: `${height}px` }}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
        />
        
        {isEmpty && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center">
              <div className="text-4xl mb-2">✍️</div>
              <p className="text-sm text-gray-500">Click and drag to sign</p>
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {clearButton && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={clearSignature}
            disabled={isEmpty}
            className="hover:bg-red-50 hover:text-red-600"
          >
            <RotateCcw className="h-4 w-4 mr-1" />
            Clear
          </Button>
        )}
        
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={downloadSignature}
          disabled={isEmpty}
          className="hover:bg-blue-50 hover:text-blue-600"
        >
          <Download className="h-4 w-4 mr-1" />
          Download
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center space-x-2">
          <Trash2 className="h-4 w-4 text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-700 font-medium">{error}</p>
        </div>
      )}
    </div>
  )
}