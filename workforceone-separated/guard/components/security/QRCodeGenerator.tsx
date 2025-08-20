'use client';

import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Download, 
  RefreshCw, 
  MapPin, 
  Shield,
  QrCode,
  Printer
} from 'lucide-react';

interface CheckpointQRData {
  checkpoint_id: string;
  checkpoint_name: string;
  route_id: string;
  route_name: string;
  latitude: number;
  longitude: number;
  order_sequence: number;
  organization_id: string;
  timestamp: string;
  verification_code: string;
}

interface QRCodeGeneratorProps {
  checkpoint: {
    id: string;
    name: string;
    latitude: number;
    longitude: number;
    order_sequence: number;
  };
  route: {
    id: string;
    name: string;
  };
  organizationId: string;
  className?: string;
}

export default function QRCodeGenerator({ 
  checkpoint, 
  route, 
  organizationId, 
  className = '' 
}: QRCodeGeneratorProps) {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [verificationCode, setVerificationCode] = useState<string>('');

  // Generate unique verification code for checkpoint
  const generateVerificationCode = () => {
    const timestamp = Date.now().toString();
    const randomSuffix = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `${checkpoint.order_sequence}${randomSuffix}`;
  };

  // Generate QR code data
  const generateQRData = (): CheckpointQRData => {
    const code = generateVerificationCode();
    setVerificationCode(code);

    return {
      checkpoint_id: checkpoint.id,
      checkpoint_name: checkpoint.name,
      route_id: route.id,
      route_name: route.name,
      latitude: checkpoint.latitude,
      longitude: checkpoint.longitude,
      order_sequence: checkpoint.order_sequence,
      organization_id: organizationId,
      timestamp: new Date().toISOString(),
      verification_code: code
    };
  };

  // Generate QR code image
  const generateQRCode = async () => {
    try {
      setLoading(true);
      
      const qrData = generateQRData();
      const qrString = JSON.stringify(qrData);
      
      const options = {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        },
        errorCorrectionLevel: 'M' as const
      };
      
      const url = await QRCode.toDataURL(qrString, options);
      setQrCodeUrl(url);
      
    } catch (error) {
      console.error('Error generating QR code:', error);
    } finally {
      setLoading(false);
    }
  };

  // Generate QR code on component mount
  useEffect(() => {
    generateQRCode();
  }, [checkpoint.id, route.id]);

  // Download QR code as image
  const downloadQRCode = () => {
    if (!qrCodeUrl) return;

    const link = document.createElement('a');
    link.download = `checkpoint-${checkpoint.order_sequence}-${checkpoint.name}.png`;
    link.href = qrCodeUrl;
    link.click();
  };

  // Print QR code
  const printQRCode = () => {
    if (!qrCodeUrl) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Checkpoint QR Code - ${checkpoint.name}</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              text-align: center; 
              margin: 20px;
            }
            .qr-container { 
              border: 2px solid #333; 
              padding: 20px; 
              display: inline-block; 
              margin: 20px;
            }
            .qr-info { 
              margin-top: 15px; 
              font-size: 14px;
            }
            .verification-code { 
              font-size: 18px; 
              font-weight: bold; 
              margin: 10px 0;
              border: 2px solid #333;
              padding: 10px;
              background: #f5f5f5;
            }
          </style>
        </head>
        <body>
          <div class="qr-container">
            <h2>${route.name}</h2>
            <h3>Checkpoint ${checkpoint.order_sequence}: ${checkpoint.name}</h3>
            <img src="${qrCodeUrl}" alt="QR Code" />
            <div class="verification-code">Code: ${verificationCode}</div>
            <div class="qr-info">
              <p><strong>Instructions:</strong></p>
              <p>1. Scan this QR code with your mobile device</p>
              <p>2. Verify location matches checkpoint coordinates</p>
              <p>3. Complete required actions for this checkpoint</p>
              <p><small>Generated: ${new Date().toLocaleString()}</small></p>
            </div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center">
            <QrCode className="h-5 w-5 mr-2" />
            Checkpoint QR Code
          </CardTitle>
          <Badge variant="secondary">
            #{checkpoint.order_sequence}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Checkpoint Info */}
        <div className="text-sm space-y-1">
          <div className="flex items-center">
            <Shield className="h-4 w-4 mr-2 text-gray-500" />
            <span className="font-medium">{route.name}</span>
          </div>
          <div className="flex items-center">
            <MapPin className="h-4 w-4 mr-2 text-gray-500" />
            <span>{checkpoint.name}</span>
          </div>
          <div className="text-gray-600">
            {checkpoint.latitude.toFixed(6)}, {checkpoint.longitude.toFixed(6)}
          </div>
        </div>

        {/* QR Code Display */}
        <div className="flex justify-center">
          {loading ? (
            <div className="flex items-center justify-center h-[300px] w-[300px] border-2 border-gray-200 rounded">
              <RefreshCw className="h-8 w-8 animate-spin text-gray-500" />
            </div>
          ) : qrCodeUrl ? (
            <div className="border-2 border-gray-200 rounded p-4">
              <img 
                src={qrCodeUrl} 
                alt={`QR Code for ${checkpoint.name}`}
                className="block"
              />
            </div>
          ) : null}
        </div>

        {/* Verification Code */}
        {verificationCode && (
          <div className="text-center">
            <div className="text-xs text-gray-600 mb-1">Verification Code</div>
            <div className="font-mono font-bold text-lg border-2 border-gray-300 rounded px-3 py-2 bg-gray-50">
              {verificationCode}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex space-x-2">
          <Button 
            onClick={generateQRCode} 
            disabled={loading}
            size="sm"
            variant="outline"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Regenerate
          </Button>
          
          <Button 
            onClick={downloadQRCode} 
            disabled={!qrCodeUrl}
            size="sm"
            variant="outline"
          >
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
          
          <Button 
            onClick={printQRCode} 
            disabled={!qrCodeUrl}
            size="sm"
          >
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
        </div>

        {/* Usage Instructions */}
        <div className="text-xs text-gray-600 bg-gray-50 p-3 rounded">
          <p className="font-medium mb-1">Usage Instructions:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Print and place this QR code at the checkpoint location</li>
            <li>Security guards scan the code using their mobile app</li>
            <li>The app verifies location and logs checkpoint completion</li>
            <li>Regenerate codes periodically for security</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}