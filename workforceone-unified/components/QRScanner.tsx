'use client'

import { useEffect, useRef, useState } from 'react'
import { Html5QrcodeScanner } from 'html5-qrcode'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Camera, QrCode, AlertTriangle } from 'lucide-react'

interface QRScannerProps {
  onScan: (data: string) => void
  onError?: (error: string) => void
  isOpen: boolean
}

export default function QRScanner({ onScan, onError, isOpen }: QRScannerProps) {
  const scannerRef = useRef<Html5QrcodeScanner | null>(null)
  const [isScanning, setIsScanning] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (isOpen && !scannerRef.current) {
      const scanner = new Html5QrcodeScanner(
        'qr-scanner-container',
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1,
          showTorchButtonIfSupported: true,
          supportedScanTypes: [],
        },
        false
      )

      scanner.render(
        (decodedText) => {
          // Success callback
          setIsScanning(false)
          onScan(decodedText)
          scanner.clear()
          scannerRef.current = null
        },
        (error) => {
          // Error callback - don't show every scan attempt error
          if (error.includes('NotFoundException')) {
            return // Ignore when no QR code is found
          }
          setError(`Scanner error: ${error}`)
          if (onError) onError(error)
        }
      )

      scannerRef.current = scanner
      setIsScanning(true)
    }

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear()
        scannerRef.current = null
      }
    }
  }, [isOpen, onScan, onError])

  const stopScanner = () => {
    if (scannerRef.current) {
      scannerRef.current.clear()
      scannerRef.current = null
      setIsScanning(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="space-y-4">
      {/* Scanner Container */}
      <div id="qr-scanner-container" className="w-full" />
      
      {/* Instructions */}
      <Alert className="bg-blue-50 border-blue-200">
        <QrCode className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-800">
          <strong>Instructions:</strong>
          <br />1. Allow camera access when prompted
          <br />2. Point camera at the QR code
          <br />3. Hold steady until scan completes
        </AlertDescription>
      </Alert>

      {/* Error Display */}
      {error && (
        <Alert className="bg-red-50 border-red-200">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            {error}
          </AlertDescription>
        </Alert>
      )}

      {/* Demo Mode Fallback */}
      <div className="border-t pt-4">
        <p className="text-xs text-gray-500 text-center mb-2">
          Demo Mode - Click to simulate QR scan:
        </p>
        <Button
          onClick={() => onScan('GUARD_INVITE:{"id":"DEMO-001","code":"GRD-DEMO1","name":"Demo Guard","site":"Demo Site","access":"basic","expires":"2025-12-31T23:59:59Z","type":"guard_invitation"}')}
          className="w-full bg-purple-600 hover:bg-purple-700"
          size="sm"
        >
          <Camera className="h-4 w-4 mr-2" />
          Simulate Valid QR Scan
        </Button>
      </div>
    </div>
  )
}