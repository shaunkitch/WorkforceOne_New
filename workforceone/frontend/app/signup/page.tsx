// ===================================
// app/signup/page.tsx
// ===================================
'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { devLog } from '@/lib/utils/logger'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Mail, Lock, User, Building, Users, Plus, Clock, Shield, CheckCircle, Badge as BadgeIcon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'

function SignupForm() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    organizationName: '',
    organizationCode: '',
    phone: '',
    department: ''
  })
  const [signupMode, setSignupMode] = useState<'join' | 'create'>('create')
  const [selectedProducts, setSelectedProducts] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [invitationData, setInvitationData] = useState<any>(null)
  const [isInvitationMode, setIsInvitationMode] = useState(false)
  const [validatingCode, setValidatingCode] = useState(false)
  const [orgDetails, setOrgDetails] = useState<{ id: string; name: string } | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  // Product definitions
  const products = [
    {
      id: 'remote',
      name: 'WorkforceOne Remote',
      displayName: 'Remote',
      description: 'Team & task management',
      monthlyPrice: 8,
      icon: Users,
      color: 'blue'
    },
    {
      id: 'time',
      name: 'WorkforceOne Time',
      displayName: 'Time',
      description: 'Time tracking & attendance',
      monthlyPrice: 6,
      icon: Clock,
      color: 'green'
    },
    {
      id: 'guard',
      name: 'WorkforceOne Guard',
      displayName: 'Guard',
      description: 'Security patrol management',
      monthlyPrice: 12,
      icon: Shield,
      color: 'purple'
    }
  ]

  useEffect(() => {
    // Check for invitation token first
    const token = searchParams.get('token')
    
    if (token) {
      handleInvitationToken(token)
    } else {
      // Check for URL parameters (for invitation links)
      const codeParam = searchParams.get('code')
      const emailParam = searchParams.get('email')
      const nameParam = searchParams.get('name')
      const typeParam = searchParams.get('type')
      const orgParam = searchParams.get('org')
      const productParam = searchParams.get('product')
      const productsParam = searchParams.get('products')
      const onboardingCompleteParam = searchParams.get('onboarding')
      
      if (codeParam) {
        setFormData(prev => ({ ...prev, organizationCode: codeParam }))
        setSignupMode('join')
      }
      
      if (emailParam) {
        setFormData(prev => ({ ...prev, email: emailParam }))
      }
      
      if (nameParam) {
        setFormData(prev => ({ ...prev, fullName: decodeURIComponent(nameParam) }))
      }
      
      // Handle security guard invitation
      if (typeParam === 'security' && codeParam) {
        devLog('🛡️ Security Guard invitation detected');
        setInvitationData({
          type: 'security',
          code: codeParam,
          email: emailParam
        });
      }

      // Handle product selection from URL parameters
      if (onboardingCompleteParam && productsParam) {
        // Products were selected from onboarding
        setSelectedProducts(productsParam.split(','))
      } else if (productParam) {
        // Single product was selected from landing page
        setSelectedProducts([productParam])
      }

      devLog('Product selection detected:', { productParam, productsParam, onboardingCompleteParam });
    }
  }, [searchParams])

  // Product selection functions
  const toggleProduct = (productId: string) => {
    setSelectedProducts(prev => 
      prev.includes(productId)
        ? prev.filter(p => p !== productId)
        : [...prev, productId]
    )
  }

  const calculateTotal = () => {
    const selectedProductsData = products.filter(p => selectedProducts.includes(p.id))
    const isBundle = selectedProductsData.length === 3
    const bundlePrice = 20
    
    if (isBundle) return bundlePrice
    
    return selectedProductsData.reduce((total, product) => total + product.monthlyPrice, 0)
  }

  // Function to validate organization code and get org details
  const validateOrganizationCode = async (code: string) => {
    try {
      // Check if this is a security guard invitation code first
      if (invitationData?.type === 'security') {
        const { data: invitation, error: inviteError } = await supabase
          .from('security_guard_invitations')
          .select(`
            id,
            organization_id,
            email,
            status,
            expires_at,
            organizations (
              id,
              name
            )
          `)
          .eq('invitation_code', code.toUpperCase())
          .eq('status', 'pending')
          .single();

        if (inviteError || !invitation) {
          throw new Error('Invalid or expired security guard invitation code');
        }

        // Check if invitation has expired
        if (new Date(invitation.expires_at) < new Date()) {
          throw new Error('Security guard invitation has expired');
        }

        return {
          id: invitation.organization_id,
          name: invitation.organizations.name,
          join_code: code.toUpperCase(),
          isSecurityInvite: true
        };
      }

      // Regular organization join code validation
      const { data, error } = await supabase
        .from('organizations')
        .select('id, name, join_code')
        .eq('join_code', code.toUpperCase())
        .single()

      if (error || !data) {
        throw new Error('Invalid organization code')
      }

      return { ...data, isSecurityInvite: false }
    } catch (error) {
      throw new Error(error.message || 'Invalid organization code')
    }
  }

  // Real-time organization code validation
  const handleCodeChange = async (code: string) => {
    setFormData({ ...formData, organizationCode: code.toUpperCase() })
    setError(null)
    setOrgDetails(null)
    
    if (code.length === 6) {
      setValidatingCode(true)
      try {
        const org = await validateOrganizationCode(code)
        setOrgDetails({ id: org.id, name: org.name })
      } catch (err) {
        setError('Invalid organization code. Please check and try again.')
      } finally {
        setValidatingCode(false)
      }
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
      setSignupMode('join')

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
        if (signupMode === 'join' && !formData.organizationCode) {
          throw new Error('Please enter an organization code to join.')
        }
        
        if (signupMode === 'create' && !formData.organizationName) {
          throw new Error('Please enter an organization name.')
        }

        let organizationId = ''

        // Validate organization code if joining
        if (signupMode === 'join') {
          const orgData = await validateOrganizationCode(formData.organizationCode)
          organizationId = orgData.id
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

          // Generate unique 6-character join code
          const generateJoinCode = () => {
            const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
            let code = ''
            for (let i = 0; i < 6; i++) {
              code += chars.charAt(Math.floor(Math.random() * chars.length))
            }
            return code
          }

          let joinCode = generateJoinCode()
          
          // Ensure join code is unique
          let isUnique = false
          while (!isUnique) {
            const { data: existingCode } = await supabase
              .from('organizations')
              .select('id')
              .eq('join_code', joinCode)
              .maybeSingle()
            
            if (!existingCode) {
              isUnique = true
            } else {
              joinCode = generateJoinCode()
            }
          }

          const { data: org, error: orgError } = await supabase
            .from('organizations')
            .insert({
              name: formData.organizationName,
              slug: formData.organizationName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
              join_code: joinCode, // Explicitly set the join code
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
          // Check if this is a security guard invitation
          if (invitationData?.type === 'security') {
            // Use the security guard invitation acceptance function
            const { data: success, error: acceptError } = await supabase.rpc('accept_security_guard_invitation', {
              p_invitation_code: formData.organizationCode,
              p_user_id: authData.user.id,
              p_full_name: formData.fullName
            });

            if (acceptError || !success) {
              throw new Error('Failed to accept security guard invitation: ' + (acceptError?.message || 'Unknown error'));
            }

            devLog('🛡️ Security guard invitation accepted successfully');
          } else {
            // Regular profile creation
            let workType = 'field'; // default
            let role = signupMode === 'create' ? 'admin' : 'employee';
            
            const { error: profileError } = await supabase
              .from('profiles')
              .insert({
                id: authData.user.id,
                email: formData.email,
                full_name: formData.fullName,
                phone: formData.phone || null,
                organization_id: organizationId,
                role: role, // Creator is admin, joiners are employees
                status: 'active',
                work_type: workType,
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
      }

      // Always redirect to dashboard after successful signup
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
          <div className="flex justify-center mb-4">
            <img 
              src="/logo.png" 
              alt="WorkforceOne Logo" 
              className="h-12 w-auto"
              onError={(e) => {
                // Fallback to icon if logo doesn't exist
                e.currentTarget.style.display = 'none';
                e.currentTarget.nextElementSibling?.classList.remove('hidden');
              }}
            />
            <div className="hidden w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center shadow-lg">
              <Users className="h-7 w-7 text-white" />
            </div>
          </div>
          <h2 className="text-3xl font-bold text-gray-900">WorkforceOne</h2>
          <p className="mt-2 text-sm text-gray-600">
            {isInvitationMode 
              ? `Join ${invitationData?.organizations?.name || 'organization'}`
              : signupMode === 'create' ? 'Create your organization' : 'Join an organization with code'
            }
          </p>
          
          {/* Show product selection from URL parameters */}
          {(searchParams.get('product') || searchParams.get('products') || searchParams.get('onboarding')) && !isInvitationMode && (
            <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                {searchParams.get('onboarding') === 'complete' ? (
                  <>✓ Product selection completed via onboarding</>
                ) : searchParams.get('product') ? (
                  <>✓ Selected: <strong>{searchParams.get('product')?.charAt(0).toUpperCase() + (searchParams.get('product')?.slice(1) || '')}</strong> product</>
                ) : (
                  <>✓ Products pre-selected</>
                )}
                {!searchParams.get('onboarding') && (
                  <span className="ml-2">
                    <Link href="/onboarding" className="text-blue-600 hover:text-blue-500 underline">
                      Change selection
                    </Link>
                  </span>
                )}
              </p>
            </div>
          )}
          {isInvitationMode && (
            <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-800">
                ✓ You've been invited to join as a <strong>{invitationData?.role}</strong>
                {invitationData?.department && ` in ${invitationData.department}`}
              </p>
            </div>
          )}
          
          {/* Security Guard Invitation Notice */}
          {invitationData?.type === 'security' && (
            <div className="mt-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-semibold text-amber-800">
                    🛡️ Security Guard Invitation
                  </h3>
                  <p className="text-sm text-amber-700 mt-1">
                    You've been invited to join as a <strong>Security Guard</strong>. 
                    After registration, you'll have access to mobile security patrol features including:
                  </p>
                  <ul className="text-xs text-amber-600 mt-2 ml-4 list-disc">
                    <li>QR Code checkpoint scanning</li>
                    <li>Real-time location tracking</li>
                    <li>Incident reporting</li>
                    <li>Patrol route management</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Signup Mode Toggle - Hidden in invitation mode */}
        {!isInvitationMode && (
          <div className="flex rounded-lg bg-gray-100 p-1">
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
            <Button
              type="button"
              variant={signupMode === 'join' ? 'default' : 'ghost'}
              size="sm"
              className="flex-1"
              onClick={() => setSignupMode('join')}
            >
              <Building className="h-4 w-4 mr-2" />
              Join with Code
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

            {/* Organization Creation/Joining - Hidden in invitation mode */}
            {!isInvitationMode && (
              signupMode === 'join' ? (
                <div>
                  <Label htmlFor="organizationCode">Organization Code</Label>
                  <div className="mt-1 relative">
                    <Input
                      id="organizationCode"
                      type="text"
                      value={formData.organizationCode}
                      onChange={(e) => handleCodeChange(e.target.value)}
                      required
                      className="pl-10 uppercase font-mono tracking-wider"
                      placeholder="ABC123"
                      maxLength={6}
                    />
                    <Building className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                    {validatingCode && (
                      <Loader2 className="absolute right-3 top-2.5 h-5 w-5 text-blue-500 animate-spin" />
                    )}
                  </div>
                  {orgDetails && (
                    <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded">
                      <p className="text-sm text-green-800">
                        ✓ You'll be joining <strong>{orgDetails.name}</strong>
                      </p>
                    </div>
                  )}
                  {!orgDetails && !validatingCode && formData.organizationCode.length === 6 && error && (
                    <p className="text-xs text-red-600 mt-1">
                      {error}
                    </p>
                  )}
                  {!error && !orgDetails && (
                    <p className="text-xs text-gray-500 mt-1">
                      Enter the 6-character code provided by your organization admin
                    </p>
                  )}
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
                  <p className="text-xs text-gray-500 mt-1">
                    You'll receive a unique code to share with your team members
                  </p>
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

            {/* Product Selection - Only show for organization creators */}
            {!isInvitationMode && signupMode === 'create' && (
              <div className="border-t pt-6">
                <div className="mb-4">
                  <Label className="text-base font-medium">Choose Your Products</Label>
                  <p className="text-sm text-gray-600 mt-1">
                    Select the products you need. You can change this later.
                  </p>
                </div>
                
                <div className="grid grid-cols-1 gap-3">
                  {products.map((product) => {
                    const IconComponent = product.icon
                    const isSelected = selectedProducts.includes(product.id)
                    return (
                      <Card 
                        key={product.id}
                        className={`cursor-pointer transition-all ${
                          isSelected 
                            ? `border-${product.color}-500 bg-${product.color}-50 shadow-md` 
                            : 'hover:shadow-md border-gray-200'
                        }`}
                        onClick={() => toggleProduct(product.id)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <div className={`w-10 h-10 rounded-lg flex items-center justify-center mr-3 ${
                                product.color === 'blue' ? 'bg-blue-100' :
                                product.color === 'green' ? 'bg-green-100' : 'bg-purple-100'
                              }`}>
                                <IconComponent className={`h-5 w-5 ${
                                  product.color === 'blue' ? 'text-blue-600' :
                                  product.color === 'green' ? 'text-green-600' : 'text-purple-600'
                                }`} />
                              </div>
                              <div>
                                <h3 className="font-semibold text-gray-900">{product.displayName}</h3>
                                <p className="text-sm text-gray-600">{product.description}</p>
                              </div>
                            </div>
                            <div className="flex items-center">
                              <div className="text-right mr-3">
                                <div className="font-bold text-gray-900">${product.monthlyPrice}</div>
                                <div className="text-xs text-gray-600">per user/month</div>
                              </div>
                              {isSelected && (
                                <CheckCircle className={`h-5 w-5 ${
                                  product.color === 'blue' ? 'text-blue-600' :
                                  product.color === 'green' ? 'text-green-600' : 'text-purple-600'
                                }`} />
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>

                {selectedProducts.length === 3 && (
                  <div className="mt-4 p-3 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-semibold text-green-800">Complete Bundle Selected!</span>
                        <p className="text-sm text-green-700">Save 23% with all three products</p>
                      </div>
                      <Badge className="bg-green-600">23% OFF</Badge>
                    </div>
                  </div>
                )}

                {selectedProducts.length > 0 && (
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-900">Total per user/month:</span>
                      <span className="text-xl font-bold text-gray-900">${calculateTotal()}</span>
                    </div>
                    <p className="text-xs text-gray-600 mt-1">
                      14-day free trial • No credit card required
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={loading}
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