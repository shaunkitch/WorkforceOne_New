'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Copy, RefreshCw, Users, Link2, Mail, 
  Shield, Share2, CheckCircle, AlertCircle,
  Loader2, UserPlus, Clock, Eye, EyeOff
} from 'lucide-react'

export default function InvitationsPage() {
  const [organization, setOrganization] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState<string | null>(null)
  const [regenerating, setRegenerating] = useState(false)
  const [showCode, setShowCode] = useState(true)
  const [invitations, setInvitations] = useState<any[]>([])
  const [newInvite, setNewInvite] = useState({ email: '', role: 'employee', department: '' })
  const [sendingInvite, setSendingInvite] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    fetchOrganizationData()
    fetchInvitations()
  }, [])

  const fetchOrganizationData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile } = await supabase
        .from('profiles')
        .select('*, organizations(*)')
        .eq('id', user.id)
        .single()

      if (profile?.organizations) {
        setOrganization(profile.organizations)
      }
    } catch (error) {
      console.error('Error fetching organization:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchInvitations = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single()

      if (!profile?.organization_id) return

      const { data } = await supabase
        .from('company_invitations')
        .select('*')
        .eq('organization_id', profile.organization_id)
        .order('created_at', { ascending: false })

      if (data) {
        setInvitations(data)
      }
    } catch (error) {
      console.error('Error fetching invitations:', error)
    }
  }

  const regenerateJoinCode = async () => {
    if (!organization) return
    
    setRegenerating(true)
    try {
      // Generate new code
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
      let newCode = ''
      for (let i = 0; i < 6; i++) {
        newCode += chars.charAt(Math.floor(Math.random() * chars.length))
      }

      // Update in database
      const { data, error } = await supabase
        .from('organizations')
        .update({ join_code: newCode })
        .eq('id', organization.id)
        .select()
        .single()

      if (error) throw error
      
      setOrganization(data)
      alert('Join code regenerated successfully!')
    } catch (error) {
      console.error('Error regenerating code:', error)
      alert('Failed to regenerate code')
    } finally {
      setRegenerating(false)
    }
  }

  const sendInvitation = async () => {
    if (!newInvite.email || !organization) return

    setSendingInvite(true)
    try {
      // Generate invitation token
      const token = Math.random().toString(36).substring(2) + Date.now().toString(36)
      
      // Create invitation record
      const { data, error } = await supabase
        .from('company_invitations')
        .insert({
          organization_id: organization.id,
          email: newInvite.email,
          role: newInvite.role,
          department: newInvite.department || null,
          invitation_token: token,
          status: 'pending',
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
        })
        .select()
        .single()

      if (error) throw error

      // Send email (you could integrate with your email service here)
      const inviteLink = `${window.location.origin}/signup?token=${token}`
      
      // For now, just copy to clipboard
      navigator.clipboard.writeText(inviteLink)
      alert('Invitation created! Link copied to clipboard.')
      
      // Reset form
      setNewInvite({ email: '', role: 'employee', department: '' })
      fetchInvitations()
    } catch (error: any) {
      console.error('Error sending invitation:', error)
      alert(error.message || 'Failed to send invitation')
    } finally {
      setSendingInvite(false)
    }
  }

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text)
    setCopied(type)
    setTimeout(() => setCopied(null), 2000)
  }

  const getInviteLink = () => {
    return `${window.location.origin}/signup?code=${organization?.join_code}`
  }

  const resendInvitation = async (invitation: any) => {
    const inviteLink = `${window.location.origin}/signup?token=${invitation.invitation_token}`
    navigator.clipboard.writeText(inviteLink)
    alert('Invitation link copied to clipboard!')
  }

  const cancelInvitation = async (id: string) => {
    try {
      await supabase
        .from('company_invitations')
        .update({ status: 'cancelled' })
        .eq('id', id)
      
      fetchInvitations()
    } catch (error) {
      console.error('Error cancelling invitation:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Team Invitations</h1>
        <p className="text-gray-600">Manage your organization join code and send invitations</p>
      </div>

      {/* Join Code Card */}
      <Card className="border-2 border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center">
              <Shield className="h-5 w-5 mr-2 text-blue-600" />
              Organization Join Code
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCode(!showCode)}
            >
              {showCode ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </CardTitle>
          <CardDescription>
            Share this code with team members to let them join during signup
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <div className="text-3xl font-mono font-bold text-blue-600 tracking-wider">
                {showCode ? organization?.join_code : '••••••'}
              </div>
              <p className="text-sm text-gray-600 mt-2">
                Valid for: <strong>{organization?.name}</strong>
              </p>
            </div>
            <div className="flex space-x-2">
              <Button
                onClick={() => copyToClipboard(organization?.join_code, 'code')}
                variant="outline"
                disabled={!showCode}
              >
                {copied === 'code' ? (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy
                  </>
                )}
              </Button>
              <Button
                onClick={regenerateJoinCode}
                variant="outline"
                disabled={regenerating}
              >
                {regenerating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          <div className="mt-4 p-3 bg-white rounded-lg">
            <Label className="text-sm">Quick Share Link</Label>
            <div className="flex items-center space-x-2 mt-2">
              <Input
                value={getInviteLink()}
                readOnly
                className="text-sm"
              />
              <Button
                size="sm"
                variant="outline"
                onClick={() => copyToClipboard(getInviteLink(), 'link')}
              >
                {copied === 'link' ? <CheckCircle className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Send Individual Invitation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Mail className="h-5 w-5 mr-2" />
            Send Individual Invitation
          </CardTitle>
          <CardDescription>
            Send a personalized invitation with specific role and department
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="team@example.com"
                value={newInvite.email}
                onChange={(e) => setNewInvite({ ...newInvite, email: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="role">Role</Label>
              <select
                id="role"
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                value={newInvite.role}
                onChange={(e) => setNewInvite({ ...newInvite, role: e.target.value })}
              >
                <option value="employee">Employee</option>
                <option value="manager">Manager</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div>
              <Label htmlFor="department">Department (Optional)</Label>
              <Input
                id="department"
                placeholder="Engineering, Sales..."
                value={newInvite.department}
                onChange={(e) => setNewInvite({ ...newInvite, department: e.target.value })}
              />
            </div>
          </div>
          <Button
            className="mt-4"
            onClick={sendInvitation}
            disabled={!newInvite.email || sendingInvite}
          >
            {sendingInvite ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <UserPlus className="h-4 w-4 mr-2" />
                Send Invitation
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Pending Invitations */}
      <Card>
        <CardHeader>
          <CardTitle>Pending Invitations</CardTitle>
          <CardDescription>
            Track and manage sent invitations
          </CardDescription>
        </CardHeader>
        <CardContent>
          {invitations.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No pending invitations
            </div>
          ) : (
            <div className="space-y-3">
              {invitations.map((invitation) => (
                <div key={invitation.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium">{invitation.email}</div>
                    <div className="text-sm text-gray-600">
                      {invitation.role} {invitation.department && `• ${invitation.department}`}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Status: <span className={`font-medium ${
                        invitation.status === 'pending' ? 'text-yellow-600' :
                        invitation.status === 'accepted' ? 'text-green-600' :
                        'text-red-600'
                      }`}>{invitation.status}</span>
                      {invitation.status === 'pending' && (
                        <span> • Expires: {new Date(invitation.expires_at).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    {invitation.status === 'pending' && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => resendInvitation(invitation)}
                        >
                          <Link2 className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => cancelInvitation(invitation.id)}
                        >
                          Cancel
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}