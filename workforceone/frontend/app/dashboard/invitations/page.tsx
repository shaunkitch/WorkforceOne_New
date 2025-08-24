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
import QRCode from 'qrcode'
import { createClient } from '@/lib/supabase/client'
import { getCurrentUserProfile, hasWebPortalAccess } from '@/lib/rbac'
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
  const [userProfile, setUserProfile] = useState<any>(null)
  const [hasCreateAccess, setHasCreateAccess] = useState(false)
  
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
  const supabase = createClient()
  
  // Load real data from database
  useEffect(() => {
    loadInvitations()
    checkUserPermissions()
  }, [])

  const checkUserPermissions = async () => {
    try {
      const profile = await getCurrentUserProfile()
      setUserProfile(profile)
      
      if (profile) {
        const canCreate = hasWebPortalAccess(profile, 'userManagement')
        setHasCreateAccess(canCreate)
      }
    } catch (error) {
      console.error('Error checking permissions:', error)
    }
  }

  const loadInvitations = async () => {
    try {
      setLoading(true)
      devLog('🔄 Loading invitations from database...');

      // First try to get from security_guard_invitations table
      const { data: guardInvitations, error: guardError } = await supabase
        .from('security_guard_invitations')
        .select('*')
        .order('created_at', { ascending: false })

      if (guardError) {
        console.error('Guard invitations error:', guardError)
      }

      // Also try to get from general product_invitations table
      const { data: productInvitations, error: productError } = await supabase
        .from('product_invitations')
        .select('*')
        .in('products', ['guard-management'])
        .order('created_at', { ascending: false })

      if (productError) {
        console.error('Product invitations error:', productError)
      }

      // Transform database data to UI format
      const transformedInvitations: GuardInvitation[] = []

      // Process guard invitations
      if (guardInvitations && guardInvitations.length > 0) {
        guardInvitations.forEach(inv => {
          transformedInvitations.push({
            id: inv.id,
            guardName: inv.guard_name || inv.email?.split('@')[0] || 'Unknown',
            email: inv.email || '',
            phoneNumber: inv.phone_number || '',
            invitationType: 'qr' as const,
            status: inv.status || 'pending',
            createdAt: inv.created_at || new Date().toISOString(),
            expiresAt: inv.expires_at || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            qrCodeData: inv.qr_code_data || `GUARD_INVITE:{"code":"${inv.invitation_code}"}`,
            assignedSite: inv.assigned_site || 'No site assigned',
            accessLevel: inv.access_level || 'basic',
            inviteCode: inv.invitation_code || inv.id
          })
        })
      }

      // Process product invitations
      if (productInvitations && productInvitations.length > 0) {
        productInvitations.forEach(inv => {
          transformedInvitations.push({
            id: inv.id,
            guardName: inv.invited_name || inv.invited_email?.split('@')[0] || 'Unknown',
            email: inv.invited_email || '',
            phoneNumber: '',
            invitationType: 'qr' as const,
            status: inv.status || 'pending',
            createdAt: inv.created_at || new Date().toISOString(),
            expiresAt: inv.expires_at || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            qrCodeData: `GUARD_INVITE:{"code":"${inv.invitation_code}","products":${JSON.stringify(inv.products)}}`,
            assignedSite: 'Multiple sites',
            accessLevel: 'basic',
            inviteCode: inv.invitation_code
          })
        })
      }

      devLog(`✅ Loaded ${transformedInvitations.length} invitations from database`);
      setInvitations(transformedInvitations)

      // If no invitations found, show some sample data
      if (transformedInvitations.length === 0) {
        devLog('No invitations found, showing sample data for demo');
        setInvitations([{
          id: 'DEMO-001',
          guardName: 'Demo Guard',
          email: 'demo@example.com',
          phoneNumber: '+1 (555) 000-0000',
          invitationType: 'qr',
          status: 'pending',
          createdAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          qrCodeData: 'GUARD_INVITE:{"code":"DEMO-123","type":"demo"}',
          assignedSite: 'Demo Site',
          accessLevel: 'basic',
          inviteCode: 'DEMO-123'
        }])
      }

    } catch (error) {
      console.error('❌ Error loading invitations:', error)
    } finally {
      setLoading(false)
    }
  }

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
      // Check permissions
      if (!hasCreateAccess) {
        console.error('User does not have permission to create invitations')
        return
      }

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

      devLog('🔄 Creating invitation in database...');
      
      // Save to database - use security_guard_invitations table with correct schema
      const { data: dbInvitation, error: dbError } = await supabase
        .from('security_guard_invitations')
        .insert({
          invitation_code: inviteCode,
          email: formData.email || `${inviteCode.toLowerCase()}@auto-invite.temp`, // Use auto-generated email if none provided
          status: 'pending',
          expires_at: expiresAt.toISOString(),
          metadata: {
            guard_name: formData.guardName,
            guard_phone: formData.phoneNumber,
            assigned_site: formData.assignedSite,
            access_level: formData.accessLevel,
            invitation_type: formData.invitationType,
            custom_message: formData.customMessage,
            qr_code_data: qrData
          }
        })
        .select()
        .single()

      if (dbError) {
        console.error('Database error:', dbError)
        throw new Error('Failed to create invitation in database')
      }

      devLog('✅ Invitation created in database:', dbInvitation);
      
      // Create UI representation
      const newInvitation: GuardInvitation = {
        id: dbInvitation.id,
        guardName: formData.guardName,
        email: formData.email,
        phoneNumber: formData.phoneNumber,
        invitationType: formData.invitationType as 'qr' | 'email' | 'both',
        status: 'pending',
        createdAt: dbInvitation.created_at,
        expiresAt: expiresAt.toISOString(),
        qrCodeData: qrData,
        assignedSite: formData.assignedSite,
        accessLevel: formData.accessLevel as 'basic' | 'elevated' | 'supervisor',
        inviteCode
      }
      
      // Update UI state
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
      console.error('❌ Error creating invitation:', error)
      // In real implementation, show user-friendly error message
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
          {hasCreateAccess && (
            <Button 
              onClick={() => setShowCreateForm(true)}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Invite Guard
            </Button>
          )}
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