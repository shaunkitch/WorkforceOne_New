'use client';

import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Download, 
  RefreshCw, 
  Smartphone,
  QrCode,
  Printer,
  Copy,
  CheckCircle
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface ProductInvitationQRProps {
  organizationId: string;
  className?: string;
}

interface ProductInvitationData {
  type: 'product_invitation';
  invitationCode: string;
  products: string[];
  organizationName?: string;
}

export default function ProductInvitationQR({ 
  organizationId, 
  className = '' 
}: ProductInvitationQRProps) {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [invitationCode, setInvitationCode] = useState<string>('');
  const [selectedProducts, setSelectedProducts] = useState<string[]>(['workforce-management']);
  const [organizationName, setOrganizationName] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  
  const supabase = createClient();

  const availableProducts = [
    { id: 'workforce-management', name: 'Workforce Management', icon: '👥' },
    { id: 'time-tracker', name: 'Time Tracker', icon: '⏰' },
    { id: 'guard-management', name: 'Guard Management', icon: '🛡️' }
  ];

  useEffect(() => {
    fetchOrganizationName();
  }, [organizationId]);

  const fetchOrganizationName = async () => {
    try {
      const { data } = await supabase
        .from('organizations')
        .select('name')
        .eq('id', organizationId)
        .single();
      
      if (data) {
        setOrganizationName(data.name);
      }
    } catch (error) {
      console.error('Error fetching organization:', error);
    }
  };

  // Generate unique invitation code
  const generateInvitationCode = () => {
    const timestamp = Date.now().toString();
    const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `WF${timestamp.slice(-6)}${randomPart}`;
  };

  // Create product invitation in database
  const createProductInvitation = async (code: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('User not authenticated');
        throw new Error('User not authenticated');
      }

      console.log('Creating invitation with data:', {
        invitation_code: code,
        products: selectedProducts,
        organization_id: organizationId,
        created_by: user.id,
        status: 'pending'
      });

      console.log('QR Data that will be generated:', JSON.stringify({
        type: 'product_invitation',
        invitationCode: code,
        products: selectedProducts,
        organizationName: organizationName || 'Organization'
      }));

      const { data, error } = await supabase
        .from('product_invitations')
        .insert({
          invitation_code: code,
          products: selectedProducts,
          organization_id: organizationId,
          created_by: user.id,
          status: 'pending',
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
        })
        .select();

      if (error) {
        console.error('Database error:', error);
        throw error;
      }

      console.log('Invitation created successfully:', data);
      return true;
    } catch (error) {
      console.error('Error creating invitation:', error);
      alert(`Failed to create invitation: ${error.message}`);
      return false;
    }
  };

  // Generate QR code data for mobile app
  const generateQRData = (): ProductInvitationData => {
    return {
      type: 'product_invitation',
      invitationCode: invitationCode,
      products: selectedProducts,
      organizationName: organizationName
    };
  };

  // Generate QR code image
  const generateQRCode = async () => {
    if (!invitationCode || selectedProducts.length === 0) {
      return;
    }

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

  // Create new invitation
  const createNewInvitation = async () => {
    if (selectedProducts.length === 0) {
      alert('Please select at least one product');
      return;
    }

    setIsCreating(true);
    try {
      const code = generateInvitationCode();
      const success = await createProductInvitation(code);
      
      if (success) {
        setInvitationCode(code);
        // QR code will be generated automatically via useEffect
      } else {
        alert('Failed to create invitation');
      }
    } catch (error) {
      console.error('Error creating invitation:', error);
      alert('Failed to create invitation');
    } finally {
      setIsCreating(false);
    }
  };

  // Generate QR code when invitation code or products change
  useEffect(() => {
    if (invitationCode) {
      generateQRCode();
    }
  }, [invitationCode, selectedProducts]);

  // Download QR code as image
  const downloadQRCode = () => {
    if (!qrCodeUrl) return;

    const link = document.createElement('a');
    link.download = `product-invitation-${invitationCode}.png`;
    link.href = qrCodeUrl;
    link.click();
  };

  // Copy invitation code
  const copyInvitationCode = () => {
    if (!invitationCode) return;
    
    navigator.clipboard.writeText(invitationCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Print QR code
  const printQRCode = () => {
    if (!qrCodeUrl || !invitationCode) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>WorkforceOne Mobile Invitation</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              text-align: center; 
              margin: 20px;
            }
            .qr-container { 
              border: 2px solid #333; 
              padding: 30px; 
              display: inline-block; 
              margin: 20px;
            }
            .invitation-code { 
              font-size: 24px; 
              font-weight: bold; 
              margin: 15px 0;
              border: 2px solid #333;
              padding: 15px;
              background: #f5f5f5;
              font-family: monospace;
            }
            .products { 
              margin: 15px 0;
              font-size: 16px;
            }
            .instructions { 
              margin-top: 20px; 
              font-size: 14px;
              text-align: left;
              max-width: 400px;
              margin-left: auto;
              margin-right: auto;
            }
          </style>
        </head>
        <body>
          <div class="qr-container">
            <h1>WorkforceOne Mobile App</h1>
            <h2>${organizationName}</h2>
            <img src="${qrCodeUrl}" alt="Mobile Invitation QR Code" />
            <div class="invitation-code">${invitationCode}</div>
            <div class="products">
              <strong>Products:</strong> ${selectedProducts.map(p => 
                availableProducts.find(ap => ap.id === p)?.name || p
              ).join(', ')}
            </div>
            <div class="instructions">
              <h3>Mobile App Installation:</h3>
              <ol>
                <li>Download the WorkforceOne app from App Store or Google Play</li>
                <li>Open the app and tap "Scan QR Code to Join"</li>
                <li>Scan this QR code with your phone camera</li>
                <li>Follow the setup instructions in the app</li>
              </ol>
              <p><strong>Alternative:</strong> Manually enter code <strong>${invitationCode}</strong> in the app</p>
              <p><small>Generated: ${new Date().toLocaleString()}</small></p>
              <p><small>Expires: ${new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString()}</small></p>
            </div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const toggleProduct = (productId: string) => {
    setSelectedProducts(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Smartphone className="h-5 w-5 mr-2" />
          Mobile App Invitation QR
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Product Selection */}
        <div>
          <Label className="text-base font-medium">Select Products to Grant Access</Label>
          <div className="grid grid-cols-1 gap-3 mt-3">
            {availableProducts.map((product) => (
              <div 
                key={product.id} 
                className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                  selectedProducts.includes(product.id)
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => toggleProduct(product.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <span className="text-2xl mr-3">{product.icon}</span>
                    <div>
                      <div className="font-medium">{product.name}</div>
                    </div>
                  </div>
                  {selectedProducts.includes(product.id) && (
                    <CheckCircle className="h-5 w-5 text-blue-600" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Generate Button */}
        <Button 
          onClick={createNewInvitation}
          disabled={selectedProducts.length === 0 || isCreating}
          className="w-full"
        >
          {isCreating ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Creating Invitation...
            </>
          ) : (
            <>
              <QrCode className="h-4 w-4 mr-2" />
              Generate Mobile Invitation QR
            </>
          )}
        </Button>

        {/* QR Code Display */}
        {invitationCode && (
          <>
            <div className="text-center space-y-4">
              {loading ? (
                <div className="flex items-center justify-center h-[300px] w-[300px] border-2 border-gray-200 rounded mx-auto">
                  <RefreshCw className="h-8 w-8 animate-spin text-gray-500" />
                </div>
              ) : qrCodeUrl ? (
                <div className="border-2 border-gray-200 rounded p-4 inline-block">
                  <img 
                    src={qrCodeUrl} 
                    alt="Mobile App Invitation QR Code"
                    className="block mx-auto"
                  />
                </div>
              ) : null}
            </div>

            {/* Invitation Code */}
            <div className="text-center space-y-2">
              <Label className="text-sm text-gray-600">Invitation Code</Label>
              <div className="flex items-center justify-center space-x-2">
                <Input
                  value={invitationCode}
                  readOnly
                  className="font-mono font-bold text-center text-lg max-w-xs"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={copyInvitationCode}
                >
                  {copied ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            {/* Selected Products Display */}
            <div className="text-center">
              <Label className="text-sm text-gray-600">Access Granted To</Label>
              <div className="flex flex-wrap justify-center gap-2 mt-2">
                {selectedProducts.map(productId => {
                  const product = availableProducts.find(p => p.id === productId);
                  return (
                    <Badge key={productId} variant="secondary">
                      {product?.icon} {product?.name}
                    </Badge>
                  );
                })}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap justify-center gap-2">
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
                variant="outline"
              >
                <Printer className="h-4 w-4 mr-2" />
                Print
              </Button>
            </div>

            {/* Usage Instructions */}
            <div className="text-xs text-gray-600 bg-blue-50 p-4 rounded border border-blue-200">
              <p className="font-medium mb-2 text-blue-800">📱 Mobile App Setup Instructions:</p>
              <ol className="list-decimal list-inside space-y-1 text-blue-700">
                <li>Employee downloads WorkforceOne app from App Store/Google Play</li>
                <li>Opens app and taps "Scan QR Code to Join"</li>
                <li>Scans this QR code or enters the invitation code manually</li>
                <li>App automatically grants access to selected products</li>
                <li>Employee can immediately use all enabled features</li>
              </ol>
              <p className="mt-2 text-blue-600">
                <strong>Expires:</strong> {new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString()}
              </p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}