// ===================================
// app/signup/page.tsx
// ===================================
'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import { Loader2, Mail, Lock, User, Building, Users, Plus } from 'lucide-react'

interface Organization {
  id: string
  name: string
  slug: string
}

function SignupForm() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    organizationName: '',
    phone: '',
    department: ''
  })
  const [signupMode, setSignupMode] = useState<'join' | 'create'>('join')
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [selectedOrgId, setSelectedOrgId] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [loadingOrgs, setLoadingOrgs] = useState(true)
  const [invitationData, setInvitationData] = useState<any>(null)
  const [isInvitationMode, setIsInvitationMode] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  useEffect(() => {
    // Check for invitation token first
    const token = searchParams.get('token')
    
    if (token) {
      handleInvitationToken(token)
    } else {
      // Load organizations for normal signup
      fetchOrganizations()
      
      // Check for URL parameters (for invitation links)
      const orgParam = searchParams.get('org')
      const emailParam = searchParams.get('email')
      const nameParam = searchParams.get('name')
      
      if (orgParam) {
        setSelectedOrgId(orgParam)
        setSignupMode('join')
      }
      
      if (emailParam) {
        setFormData(prev => ({ ...prev, email: emailParam }))
      }
      
      if (nameParam) {
        setFormData(prev => ({ ...prev, fullName: decodeURIComponent(nameParam) }))
      }
    }
  }, [searchParams])

  const fetchOrganizations = async () => {
    try {
      const { data, error } = await supabase
        .from('organizations')
        .select('id, name, slug')
        .order('name')

      if (error) throw error
      setOrganizations(data || [])
      
      // If only one organization exists, auto-select it
      if (data && data.length === 1) {
        setSelectedOrgId(data[0].id)
      }
    } catch (error) {
      // Error fetching organizations handled silently
    } finally {
      setLoadingOrgs(false)
    }
  }

  const handleInvitationToken = async (token: string) => {
    setLoading(true)
    try {
      // Fetch invitation details
      const { data: invitation, error } = await supabase
        .from('company_invitations')
        .select(`
          id,
          email,
          role,
          department,
          organization_id,
          status,
          expires_at,
          organizations(name)
        `)
        .eq('invitation_token', token)
        .single()

      if (error || !invitation) {
        setError('Invalid or expired invitation link. Please contact your administrator.')
        return
      }

      // Check if invitation is still valid
      if (invitation.status !== 'pending' || new Date(invitation.expires_at) < new Date()) {
        setError('This invitation has expired. Please contact your administrator for a new invitation.')
        return
      }

      // Set invitation mode and pre-fill form
      setIsInvitationMode(true)
      setInvitationData(invitation)
      setFormData(prev => ({
        ...prev,
        email: invitation.email,
        department: invitation.department || ''
      }))
      setSelectedOrgId(invitation.organization_id)
      setSignupMode('join')
      setLoadingOrgs(false)

    } catch (error) {
      // Error handling invitation
      setError('Failed to process invitation. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      if (isInvitationMode && invitationData) {
        // Handle invitation acceptance
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: {
              full_name: formData.fullName,
              phone: formData.phone,
              department: formData.department,
            },
          },
        })

        if (authError) throw authError

        if (authData.user) {
          // Use the accept_invitation function from the database
          const { data: success, error: acceptError } = await supabase.rpc('accept_invitation', {
            p_token: searchParams.get('token'),
            p_user_id: authData.user.id,
            p_full_name: formData.fullName
          })

          if (acceptError || !success) {
            throw new Error('Failed to accept invitation. Please contact your administrator.')
          }
        }
      } else {
        // Regular signup flow
        // Validation
        if (signupMode === 'join' && !selectedOrgId) {
          throw new Error('Please select an organization to join.')
        }
        
        if (signupMode === 'create' && !formData.organizationName) {
          throw new Error('Please enter an organization name.')
        }

        // Sign up the user
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: {
              full_name: formData.fullName,
              phone: formData.phone,
              department: formData.department,
            },
          },
        })

        if (authError) throw authError

        let organizationId = selectedOrgId

        // Create organization if in create mode
        if (signupMode === 'create') {
          // Check if organization name already exists
          const { data: existingOrg } = await supabase
            .from('organizations')
            .select('id')
            .eq('name', formData.organizationName)
            .maybeSingle()

          if (existingOrg) {
            throw new Error('An organization with this name already exists. Please choose a different name or join the existing organization.')
          }

          const { data: org, error: orgError } = await supabase
            .from('organizations')
            .insert({
              name: formData.organizationName,
              slug: formData.organizationName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
              description: null,
              website: null,
              logo_url: null,
              address: null,
              city: null,
              state: null,
              country: null,
              postal_code: null,
              phone: null,
              email: null,
              settings: {
                currency_symbol: '$',
                currency_code: 'USD',
                date_format: 'MM/DD/YYYY',
                time_format: '12',
                timezone: 'UTC',
                language: 'en'
              },
              feature_flags: {
                dashboard: true,
                time_tracking: true,
                attendance: true,
                maps: true,
                teams: true,
                projects: true,
                tasks: true,
                forms: true,
                leave: true,
                outlets: true,
                settings: true,
                analytics: true,
                reports: true,
                automation: true,
                integrations: true
              }
            })
            .select()
            .single()

          if (orgError) throw orgError
          organizationId = org.id
        }

        // Create user profile
        if (authData.user && organizationId) {
          const { error: profileError } = await supabase
            .from('profiles')
            .insert({
              id: authData.user.id,
              email: formData.email,
              full_name: formData.fullName,
              phone: formData.phone || null,
              organization_id: organizationId,
              role: signupMode === 'create' ? 'admin' : 'employee', // Creator is admin, joiners are employees
              status: 'active',
              department: formData.department || null,
              job_title: null,
              hire_date: null,
              salary: null,
              hourly_rate: null,
              employee_id: null,
              manager_id: null,
              last_login: null,
              timezone: 'UTC',
              settings: {},
              feature_flags: {},
              is_active: true
            })

          if (profileError) throw profileError
        }
      }

      router.push('/dashboard')
      router.refresh()
    } catch (error: any) {
      // Handle rate limiting specifically
      if (error.message?.includes('Too Many Requests') || error.message?.includes('429')) {
        setError('Too many signup attempts. Please wait a few minutes and try again.')
      } else if (error.message?.includes('already registered')) {
        setError('An account with this email already exists. Please try logging in instead.')
      } else {
        setError(error.message || 'An error occurred during signup')
      }
      // Signup error handled
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-lg">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900">WorkforceOne</h2>
          <p className="mt-2 text-sm text-gray-600">
            {isInvitationMode 
              ? `Join ${invitationData?.organizations?.name || 'organization'}`
              : signupMode === 'join' ? 'Join an organization' : 'Create your organization'
            }
          </p>
          {isInvitationMode && (
            <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-800">
                ✓ You've been invited to join as a <strong>{invitationData?.role}</strong>
                {invitationData?.department && ` in ${invitationData.department}`}
              </p>
            </div>
          )}
        </div>

        {/* Signup Mode Toggle - Hidden in invitation mode */}
        {!isInvitationMode && (
          <div className="flex rounded-lg bg-gray-100 p-1">
            <Button
              type="button"
              variant={signupMode === 'join' ? 'default' : 'ghost'}
              size="sm"
              className="flex-1"
              onClick={() => setSignupMode('join')}
            >
              <Users className="h-4 w-4 mr-2" />
              Join Organization
            </Button>
            <Button
              type="button"
              variant={signupMode === 'create' ? 'default' : 'ghost'}
              size="sm"
              className="flex-1"
              onClick={() => setSignupMode('create')}
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Organization
            </Button>
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSignup}>
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            <div>
              <Label htmlFor="fullName">Full Name</Label>
              <div className="mt-1 relative">
                <Input
                  id="fullName"
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  required
                  className="pl-10"
                  placeholder="John Doe"
                />
                <User className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              </div>
            </div>

            <div>
              <Label htmlFor="email">Email Address</Label>
              <div className="mt-1 relative">
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  className="pl-10"
                  placeholder="you@example.com"
                  disabled={isInvitationMode}
                />
                <Mail className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              </div>
              {isInvitationMode && (
                <p className="text-xs text-gray-500 mt-1">
                  This email is pre-filled from your invitation
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="password">Password</Label>
              <div className="mt-1 relative">
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  className="pl-10"
                  placeholder="••••••••"
                  minLength={6}
                />
                <Lock className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              </div>
            </div>

            <div>
              <Label htmlFor="phone">Phone Number (Optional)</Label>
              <div className="mt-1">
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+1 (555) 123-4567"
                />
              </div>
            </div>

            {/* Organization Selection/Creation - Hidden in invitation mode */}
            {!isInvitationMode && (
              signupMode === 'join' ? (
                <div>
                  <Label htmlFor="organization">Select Organization</Label>
                  <div className="mt-1">
                    {loadingOrgs ? (
                      <div className="flex items-center justify-center py-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="ml-2 text-sm text-gray-500">Loading organizations...</span>
                      </div>
                    ) : organizations.length === 0 ? (
                      <div className="text-center py-4">
                        <p className="text-sm text-gray-500 mb-2">No organizations available</p>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setSignupMode('create')}
                        >
                          Create First Organization
                        </Button>
                      </div>
                    ) : (
                      <Select value={selectedOrgId} onValueChange={setSelectedOrgId} required>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose an organization" />
                        </SelectTrigger>
                        <SelectContent>
                          {organizations.map((org) => (
                            <SelectItem key={org.id} value={org.id}>
                              {org.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                </div>
              ) : (
                <div>
                  <Label htmlFor="organizationName">Organization Name</Label>
                  <div className="mt-1 relative">
                    <Input
                      id="organizationName"
                      type="text"
                      value={formData.organizationName}
                      onChange={(e) => setFormData({ ...formData, organizationName: e.target.value })}
                      required
                      className="pl-10"
                      placeholder="Acme Corp"
                    />
                    <Building className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                  </div>
                </div>
              )
            )}

            <div>
              <Label htmlFor="department">Department (Optional)</Label>
              <div className="mt-1">
                <Input
                  id="department"
                  type="text"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  placeholder="Engineering, Sales, Marketing..."
                />
              </div>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={loading || (!isInvitationMode && signupMode === 'join' && loadingOrgs)}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isInvitationMode 
              ? 'Accept Invitation' 
              : signupMode === 'join' ? 'Join Organization' : 'Create Organization'
            }
          </Button>

          <div className="text-center text-sm">
            Already have an account?{' '}
            <Link href="/login" className="text-blue-600 hover:text-blue-500">
              Sign in
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
      <SignupForm />
    </Suspense>
  )
}