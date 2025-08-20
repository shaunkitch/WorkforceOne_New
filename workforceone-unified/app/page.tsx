'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  signInWithEmail, 
  signUpWithEmail, 
  getUserProfile,
  acceptProductInvitation,
  logProductAccess,
  getUser
} from '@/lib/supabase'
import { 
  PRODUCTS, 
  getPrimaryProduct, 
  getProductTheme,
  type ProductId 
} from '@/lib/products'
import QRScanner from '@/components/QRScanner'
import { 
  Building, Clock, Shield, Users, Eye, EyeOff, 
  ArrowRight, CheckCircle, AlertTriangle, QrCode, 
  Camera, Scan, Zap, Star
} from 'lucide-react'

export default function UnifiedAuthPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showQRScanner, setShowQRScanner] = useState(false)
  const [inviteCode, setInviteCode] = useState('')
  const [showInviteForm, setShowInviteForm] = useState(false)
  const [invitationData, setInvitationData] = useState<any>(null)
  
  const router = useRouter()

  useEffect(() => {
    // Check if user is already authenticated
    checkAuthStatus()
  }, [])

  const checkAuthStatus = async () => {
    try {
      const { user } = await getUser()
      if (user) {
        const { profile } = await getUserProfile()
        if (profile && profile.products.length > 0) {
          // User is authenticated and has products, redirect to appropriate dashboard
          const primaryProduct = getPrimaryProduct(profile.products)
          if (primaryProduct) {
            router.push(`/${primaryProduct.id}/dashboard`)
          }
        }
      }
    } catch (error) {
      // Not authenticated, stay on auth page
    }
  }

  const handleQRScan = async (scannedData: string) => {
    try {
      // Parse QR code data
      if (scannedData.startsWith('WORKFORCE_INVITE:')) {
        const inviteData = JSON.parse(scannedData.replace('WORKFORCE_INVITE:', ''))
        
        // Check if invitation is still valid
        const expiryDate = new Date(inviteData.expires)
        if (expiryDate < new Date()) {
          setError('This invitation has expired. Please request a new one.')
          return
        }
        
        // Set the invite code and show registration form
        setInviteCode(inviteData.code)
        setInvitationData(inviteData)
        setSuccess(`Invitation scanned successfully! Products: ${inviteData.products.join(', ')}`)
        setShowQRScanner(false)
        setShowInviteForm(true)
        setIsSignUp(true)
        
      } else {
        setError('Invalid QR code. Please scan a valid WorkforceOne invitation.')
      }
    } catch (err) {
      setError('Failed to process QR code. Please try again.')
    }
  }

  const handleInviteCodeSubmit = async () => {
    if (!inviteCode.trim()) {
      setError('Please enter a valid invitation code')
      return
    }
    
    setIsLoading(true)
    try {
      // In real implementation, validate invite code against database
      setSuccess('Invitation code accepted! Please complete your registration.')
      setShowInviteForm(false)
      setIsSignUp(true)
    } catch (err) {
      setError('Invalid invitation code')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setIsLoading(true)

    try {
      if (isSignUp) {
        // Sign up new user
        const { data, error } = await signUpWithEmail(email, password, {
          full_name: '',
          invitation_code: inviteCode
        })

        if (error) {
          setError(error.message)
        } else if (data?.user) {
          // If we have invitation data, accept the invitation
          if (invitationData && inviteCode) {
            const acceptResult = await acceptProductInvitation(inviteCode, email)
            if (acceptResult.error) {
              setError('Account created but failed to process invitation')
            } else {
              // Log the successful invitation acceptance
              if (invitationData.products) {
                for (const productId of invitationData.products) {
                  await logProductAccess(productId, 'invitation_accepted', {
                    invitation_code: inviteCode
                  })
                }
              }
              
              setSuccess('Account created successfully and invitation accepted! Please check your email for verification.')
            }
          } else {
            setSuccess('Account created successfully! Please check your email for verification.')
          }
        }
      } else {
        // Sign in existing user
        const { data, error } = await signInWithEmail(email, password)

        if (error) {
          setError(error.message)
        } else if (data?.user) {
          // Get user profile to determine products
          const { profile } = await getUserProfile()
          if (profile && profile.products.length > 0) {
            // Log successful login
            const primaryProduct = getPrimaryProduct(profile.products)
            if (primaryProduct) {
              await logProductAccess(primaryProduct.id, 'login')
              setSuccess('Successfully signed in!')
              setTimeout(() => {
                router.push(`/${primaryProduct.id}/dashboard`)
              }, 1000)
            }
          } else {
            setError('No product access found. Please contact your administrator.')
          }
        }
      }
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-6">
        
        {/* Header */}
        <div className="text-center">
          <div className="flex justify-center items-center mb-4">
            <div className="h-16 w-16 bg-gradient-to-br from-blue-600 via-purple-600 to-green-600 rounded-2xl flex items-center justify-center">
              <Zap className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-green-600 bg-clip-text text-transparent">
            WorkforceOne
          </h1>
          <p className="text-gray-600 mt-2">Unified Workforce Management Platform</p>
          <div className="flex justify-center gap-2 mt-3">
            <Badge className="bg-green-100 text-green-800">
              <Building className="h-3 w-3 mr-1" />
              Management
            </Badge>
            <Badge className="bg-blue-100 text-blue-800">
              <Clock className="h-3 w-3 mr-1" />
              Time Tracking
            </Badge>
            <Badge className="bg-purple-100 text-purple-800">
              <Shield className="h-3 w-3 mr-1" />
              Security
            </Badge>
          </div>
        </div>

        {/* New User Invitation Section */}
        {!isSignUp && !showInviteForm && (
          <Card className="bg-gradient-to-r from-indigo-100 to-purple-100 border-indigo-200">
            <CardContent className="p-6">
              <div className="text-center space-y-4">
                <h3 className="font-semibold text-indigo-900 flex items-center justify-center">
                  <Star className="h-4 w-4 mr-2" />
                  New to WorkforceOne?
                </h3>
                <p className="text-sm text-indigo-800">
                  Scan your invitation QR code or enter your invite code to get started
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setShowQRScanner(true)}
                    className="h-16 flex-col bg-white hover:bg-indigo-50"
                  >
                    <QrCode className="h-6 w-6 mb-1 text-indigo-600" />
                    Scan QR Code
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowInviteForm(true)}
                    className="h-16 flex-col bg-white hover:bg-indigo-50"
                  >
                    <Users className="h-6 w-6 mb-1 text-indigo-600" />
                    Enter Code
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Invite Code Form */}
        {showInviteForm && (
          <Card className="shadow-lg border-indigo-200">
            <CardHeader>
              <CardTitle className="text-center flex items-center justify-center">
                <Users className="h-5 w-5 mr-2 text-indigo-600" />
                Enter Invitation Code
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="inviteCode">Invitation Code</Label>
                <Input
                  id="inviteCode"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                  placeholder="WF-ABC123-XYZ"
                  className="text-center font-mono"
                  maxLength={15}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Enter the code provided by your organization
                </p>
              </div>
              
              <div className="flex space-x-2">
                <Button
                  onClick={handleInviteCodeSubmit}
                  disabled={!inviteCode.trim() || isLoading}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700"
                >
                  Verify Code
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowInviteForm(false)
                    setInviteCode('')
                    setInvitationData(null)
                  }}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Sign In Form */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-center">
              {isSignUp ? 'Complete Registration' : 'Sign In to WorkforceOne'}
            </CardTitle>
            {invitationData && (
              <div className="text-center space-y-2">
                <Badge className="bg-green-100 text-green-800">
                  Invitation: {inviteCode}
                </Badge>
                <div className="flex justify-center gap-1">
                  {invitationData.products?.map((productId: ProductId) => (
                    <Badge key={productId} className={`${PRODUCTS[productId].color.primary.includes('green') ? 'bg-green-100 text-green-800' : 
                      PRODUCTS[productId].color.primary.includes('blue') ? 'bg-blue-100 text-blue-800' : 
                      'bg-purple-100 text-purple-800'}`}>
                      {PRODUCTS[productId].name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  required
                  disabled={isLoading}
                />
              </div>
              
              <div>
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <Alert className="border-red-200 bg-red-50">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-800">
                    {error}
                  </AlertDescription>
                </Alert>
              )}

              {success && (
                <Alert className="border-green-200 bg-green-50">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    {success}
                  </AlertDescription>
                </Alert>
              )}

              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    {isSignUp ? 'Creating Account...' : 'Signing In...'}
                  </div>
                ) : (
                  <>
                    {isSignUp ? 'Create Account' : 'Sign In'}
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            </form>

            <div className="mt-4 text-center">
              <button
                onClick={() => {
                  setIsSignUp(!isSignUp)
                  setError('')
                  setSuccess('')
                }}
                className="text-indigo-600 hover:text-indigo-800 text-sm"
                disabled={isLoading}
              >
                {isSignUp 
                  ? 'Already have an account? Sign in' 
                  : "Don't have an account? Sign up"
                }
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Product Features */}
        <Card className="bg-gradient-to-r from-slate-50 to-gray-100">
          <CardContent className="p-4">
            <h3 className="font-semibold text-gray-900 mb-3 text-center">
              One Platform, Multiple Solutions
            </h3>
            <div className="space-y-3">
              {Object.values(PRODUCTS).map((product) => (
                <div key={product.id} className="flex items-start space-x-3">
                  <div className={`p-2 rounded-lg`} style={{ backgroundColor: product.color.primary + '20' }}>
                    <product.icon className="h-4 w-4" style={{ color: product.color.primary }} />
                  </div>
                  <div>
                    <h4 className="font-medium text-sm text-gray-900">{product.name}</h4>
                    <p className="text-xs text-gray-600">{product.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-sm text-gray-500">
          <p>© 2025 WorkforceOne. All rights reserved.</p>
          <p className="mt-1">Unified • Scalable • Professional</p>
        </div>
      </div>

      {/* QR Scanner Modal */}
      {showQRScanner && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-sm">
            <CardHeader>
              <CardTitle className="text-center flex items-center justify-center">
                <Camera className="h-5 w-5 mr-2 text-indigo-600" />
                Scan Invitation QR Code
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <QRScanner
                isOpen={showQRScanner}
                onScan={handleQRScan}
                onError={(error) => setError(error)}
              />
              
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setShowQRScanner(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}