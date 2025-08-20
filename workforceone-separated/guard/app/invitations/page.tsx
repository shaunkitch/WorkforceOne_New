'use client'

import { useState, useRef, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import Navbar from '@/components/navigation/Navbar'
import QRCode from 'qrcode'
import { 
  UserPlus, QrCode, Mail, Copy, RefreshCw, Eye, EyeOff,
  CheckCircle, AlertTriangle, Timer, MapPin, Shield,
  Download, Share, Send, Clock, Users
} from 'lucide-react'

interface GuardInvitation {
  id: string
  guardName: string
  email: string
  phoneNumber: string
  invitationType: 'qr' | 'email' | 'both'
  status: 'pending' | 'accepted' | 'expired' | 'revoked'
  createdAt: string
  expiresAt: string
  qrCodeData: string
  assignedSite?: string
  accessLevel: 'basic' | 'elevated' | 'supervisor'
  tempPassword?: string
  inviteCode: string
}

export default function GuardInvitationsPage() {
  const [invitations, setInvitations] = useState<GuardInvitation[]>([])
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [selectedInvitation, setSelectedInvitation] = useState<GuardInvitation | null>(null)
  const [showQRModal, setShowQRModal] = useState(false)
  const [qrCodeUrl, setQRCodeUrl] = useState('')
  const [loading, setLoading] = useState(false)
  
  // Form state
  const [formData, setFormData] = useState({
    guardName: '',
    email: '',
    phoneNumber: '',
    invitationType: 'qr',
    assignedSite: '',
    accessLevel: 'basic',
    customMessage: ''
  })
  
  const qrRef = useRef<HTMLCanvasElement>(null)
  
  // Mock data for demonstration
  useEffect(() => {
    const mockInvitations: GuardInvitation[] = [
      {
        id: 'INV-001',
        guardName: 'John Martinez',
        email: 'john.martinez@email.com',
        phoneNumber: '+1 (555) 123-4567',
        invitationType: 'qr',
        status: 'pending',
        createdAt: '2025-01-20T10:30:00Z',
        expiresAt: '2025-01-27T10:30:00Z',
        qrCodeData: 'GUARD_INVITE:{"id":"INV-001","code":"GRD-ABC123","expires":"2025-01-27T10:30:00Z"}',
        assignedSite: 'Downtown Financial Plaza',
        accessLevel: 'basic',
        inviteCode: 'GRD-ABC123'
      },
      {
        id: 'INV-002',
        guardName: 'Sarah Chen',
        email: 'sarah.chen@security.com',
        phoneNumber: '+1 (555) 234-5678',
        invitationType: 'both',
        status: 'accepted',
        createdAt: '2025-01-19T14:15:00Z',
        expiresAt: '2025-01-26T14:15:00Z',
        qrCodeData: 'GUARD_INVITE:{"id":"INV-002","code":"GRD-XYZ789","expires":"2025-01-26T14:15:00Z"}',
        assignedSite: 'Tech Campus North',
        accessLevel: 'supervisor',
        inviteCode: 'GRD-XYZ789'
      }
    ]
    setInvitations(mockInvitations)
  }, [])

  const generateQRCode = async (inviteData: string) => {
    try {
      const qrDataURL = await QRCode.toDataURL(inviteData, {
        width: 256,
        margin: 2,
        color: {
          dark: '#7C3AED', // Purple color for guard system
          light: '#FFFFFF'
        },
        errorCorrectionLevel: 'M'
      })
      return qrDataURL
    } catch (error) {
      console.error('Error generating QR code:', error)
      return ''
    }
  }

  const createInvitation = async () => {
    setLoading(true)
    
    try {
      // Generate unique invitation code
      const inviteCode = `GRD-${Math.random().toString(36).substr(2, 6).toUpperCase()}`
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + 7) // 7 days expiry
      
      // Create QR code data
      const qrData = `GUARD_INVITE:${JSON.stringify({
        id: `INV-${Date.now()}`,
        code: inviteCode,
        name: formData.guardName,
        site: formData.assignedSite,
        access: formData.accessLevel,
        expires: expiresAt.toISOString(),
        type: 'guard_invitation'
      })}`
      
      const newInvitation: GuardInvitation = {
        id: `INV-${Date.now()}`,
        guardName: formData.guardName,
        email: formData.email,
        phoneNumber: formData.phoneNumber,
        invitationType: formData.invitationType as 'qr' | 'email' | 'both',
        status: 'pending',
        createdAt: new Date().toISOString(),
        expiresAt: expiresAt.toISOString(),
        qrCodeData: qrData,
        assignedSite: formData.assignedSite,
        accessLevel: formData.accessLevel as 'basic' | 'elevated' | 'supervisor',
        inviteCode
      }
      
      // In real implementation, this would be saved to database
      setInvitations([newInvitation, ...invitations])
      
      // Reset form
      setFormData({
        guardName: '',
        email: '',
        phoneNumber: '',
        invitationType: 'qr',
        assignedSite: '',
        accessLevel: 'basic',
        customMessage: ''
      })
      
      setShowCreateForm(false)
      
      // Automatically show QR code for QR invitations
      if (formData.invitationType === 'qr' || formData.invitationType === 'both') {
        setSelectedInvitation(newInvitation)
        showQRCode(newInvitation)
      }
      
    } catch (error) {
      console.error('Error creating invitation:', error)
    } finally {
      setLoading(false)
    }
  }

  const showQRCode = async (invitation: GuardInvitation) => {
    setSelectedInvitation(invitation)
    const qrUrl = await generateQRCode(invitation.qrCodeData)
    setQRCodeUrl(qrUrl)
    setShowQRModal(true)
  }

  const copyInviteCode = (code: string) => {
    navigator.clipboard.writeText(code)
    // In real implementation, show success toast
  }

  const revokeInvitation = (invitationId: string) => {
    setInvitations(invitations.map(inv => 
      inv.id === invitationId ? { ...inv, status: 'revoked' } : inv
    ))
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'accepted': return 'bg-green-100 text-green-800'
      case 'expired': return 'bg-red-100 text-red-800'
      case 'revoked': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getAccessLevelColor = (level: string) => {
    switch (level) {
      case 'basic': return 'bg-blue-100 text-blue-800'
      case 'elevated': return 'bg-orange-100 text-orange-800'
      case 'supervisor': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <UserPlus className="h-8 w-8 mr-3 text-purple-600" />
              Guard Invitations
            </h1>
            <p className="text-gray-600 mt-2">Invite new guards using QR codes or traditional methods</p>
          </div>
          <Button 
            onClick={() => setShowCreateForm(true)}
            className="bg-purple-600 hover:bg-purple-700"
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Invite Guard
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Timer className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Pending</p>
                  <p className="text-2xl font-bold">{invitations.filter(i => i.status === 'pending').length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Accepted</p>
                  <p className="text-2xl font-bold">{invitations.filter(i => i.status === 'accepted').length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <QrCode className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">QR Invites</p>
                  <p className="text-2xl font-bold">{invitations.filter(i => i.invitationType === 'qr' || i.invitationType === 'both').length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Users className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Total</p>
                  <p className="text-2xl font-bold">{invitations.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Create Invitation Form */}
        {showCreateForm && (
          <Card className="border-purple-200">
            <CardHeader>
              <CardTitle className="flex items-center">
                <UserPlus className="h-5 w-5 mr-2 text-purple-600" />
                Create Guard Invitation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="guardName">Guard Name *</Label>
                  <Input
                    id="guardName"
                    value={formData.guardName}
                    onChange={(e) => setFormData({...formData, guardName: e.target.value})}
                    placeholder="Enter guard's full name"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    placeholder="guard@security.com"
                  />
                </div>
                
                <div>
                  <Label htmlFor="phoneNumber">Phone Number</Label>
                  <Input
                    id="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})}
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
                
                <div>
                  <Label htmlFor="invitationType">Invitation Method *</Label>
                  <Select value={formData.invitationType} onValueChange={(value) => setFormData({...formData, invitationType: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="qr">QR Code Only</SelectItem>
                      <SelectItem value="email">Email Only</SelectItem>
                      <SelectItem value="both">QR Code + Email</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="assignedSite">Assigned Site</Label>
                  <Select value={formData.assignedSite} onValueChange={(value) => setFormData({...formData, assignedSite: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select site" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="downtown">Downtown Financial Plaza</SelectItem>
                      <SelectItem value="tech-campus">Tech Campus North</SelectItem>
                      <SelectItem value="retail-west">Retail Complex West</SelectItem>
                      <SelectItem value="medical">Medical Center</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="accessLevel">Access Level *</Label>
                  <Select value={formData.accessLevel} onValueChange={(value) => setFormData({...formData, accessLevel: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="basic">Basic Access</SelectItem>
                      <SelectItem value="elevated">Elevated Access</SelectItem>
                      <SelectItem value="supervisor">Supervisor Access</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <Label htmlFor="customMessage">Custom Message (Optional)</Label>
                <Textarea
                  id="customMessage"
                  value={formData.customMessage}
                  onChange={(e) => setFormData({...formData, customMessage: e.target.value})}
                  placeholder="Welcome message for the new guard..."
                  rows={3}
                />
              </div>
              
              <div className="flex space-x-3">
                <Button 
                  onClick={createInvitation}
                  disabled={loading || !formData.guardName}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  {loading && <RefreshCw className="h-4 w-4 mr-2 animate-spin" />}
                  Create Invitation
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setShowCreateForm(false)}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Invitations List */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Invitations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {invitations.map((invitation) => (
                <div key={invitation.id} className="border rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="h-10 w-10 bg-purple-100 rounded-lg flex items-center justify-center">
                        <Shield className="h-5 w-5 text-purple-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{invitation.guardName}</h3>
                        <p className="text-sm text-gray-600">{invitation.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={getStatusColor(invitation.status)}>
                        {invitation.status.toUpperCase()}
                      </Badge>
                      <Badge className={getAccessLevelColor(invitation.accessLevel)}>
                        {invitation.accessLevel}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 mb-3">
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-1" />
                      Created: {new Date(invitation.createdAt).toLocaleDateString()}
                    </div>
                    <div className="flex items-center">
                      <Timer className="h-4 w-4 mr-1" />
                      Expires: {new Date(invitation.expiresAt).toLocaleDateString()}
                    </div>
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 mr-1" />
                      {invitation.assignedSite || 'No site assigned'}
                    </div>
                    <div className="flex items-center">
                      <Mail className="h-4 w-4 mr-1" />
                      {invitation.invitationType.toUpperCase()}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {(invitation.invitationType === 'qr' || invitation.invitationType === 'both') && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => showQRCode(invitation)}
                        disabled={invitation.status === 'revoked' || invitation.status === 'expired'}
                      >
                        <QrCode className="h-3 w-3 mr-1" />
                        Show QR
                      </Button>
                    )}
                    
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyInviteCode(invitation.inviteCode)}
                    >
                      <Copy className="h-3 w-3 mr-1" />
                      Copy Code
                    </Button>
                    
                    {invitation.status === 'pending' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => revokeInvitation(invitation.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        Revoke
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* QR Code Modal */}
      {showQRModal && selectedInvitation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="text-center">
                Guard Invitation QR Code
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <div className="bg-white p-4 rounded-lg inline-block">
                {qrCodeUrl && (
                  <img src={qrCodeUrl} alt="Invitation QR Code" className="w-64 h-64" />
                )}
              </div>
              
              <div className="text-sm text-gray-600">
                <p><strong>{selectedInvitation.guardName}</strong></p>
                <p>{selectedInvitation.assignedSite}</p>
                <p>Code: <span className="font-mono">{selectedInvitation.inviteCode}</span></p>
                <p>Expires: {new Date(selectedInvitation.expiresAt).toLocaleDateString()}</p>
              </div>
              
              <Alert className="bg-blue-50 border-blue-200">
                <QrCode className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800 text-left">
                  <strong>Instructions:</strong>
                  <br />1. Guard opens WorkforceOne Guard app
                  <br />2. Taps "Scan Invitation" 
                  <br />3. Scans this QR code
                  <br />4. Completes registration process
                </AlertDescription>
              </Alert>
              
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    const link = document.createElement('a')
                    link.download = `guard-invitation-${selectedInvitation.inviteCode}.png`
                    link.href = qrCodeUrl
                    link.click()
                  }}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => setShowQRModal(false)}
                >
                  Close
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}