'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import QRScanner from '@/components/QRScanner'
import { 
  signInWithEmail, 
  signUpWithEmail, 
  handleSSOSession, 
  ssoRedirect,
  APP_URLS,
  TIME_PRODUCT_ID,
  GUARD_PRODUCT_ID,
  MAIN_PRODUCT_ID,
  addProductAccess
} from '@/lib/supabase'
import { 
  Shield, Clock, Users, Eye, EyeOff, Building, 
  ArrowRight, CheckCircle, ShieldCheck, AlertTriangle, 
  QrCode, Camera, Scan
} from 'lucide-react'

export default function SignInPage() {
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
  
  const router = useRouter()
  const searchParams = useSearchParams()
  
  useEffect(() => {
    // Handle SSO login from other apps
    const authToken = searchParams.get('auth')
    if (authToken) {
      handleSSO(authToken)
    }
  }, [searchParams])

  const handleSSO = async (encodedAuth: string) => {
    setIsLoading(true)
    const { data, error } = await handleSSOSession(encodedAuth)
    
    if (error) {
      setError('Invalid authentication token')
      setIsLoading(false)
      return
    }

    if (data?.user) {
      await addProductAccess(GUARD_PRODUCT_ID)
      setSuccess('Successfully signed in!')
      setTimeout(() => router.push('/'), 1000)
    }
    setIsLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setIsLoading(true)

    try {
      if (isSignUp) {
        const { data, error } = await signUpWithEmail(email, password, {
          full_name: '',
          role: 'guard'
        })

        if (error) {
          setError(error.message)
        } else {
          setSuccess('Guard account created successfully! Please check your email for verification.')
        }
      } else {
        const { data, error } = await signInWithEmail(email, password)

        if (error) {
          setError(error.message)
        } else if (data?.user) {
          await addProductAccess(GUARD_PRODUCT_ID)
          setSuccess('Successfully signed in!')
          setTimeout(() => router.push('/'), 1000)
        }
      }
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const navigateToApp = async (targetApp: string) => {
    const url = await ssoRedirect(targetApp)
    if (url) {
      window.open(url, '_blank')
    }
  }

  const handleQRScan = (scannedData: string) => {
    try {
      // Parse QR code data
      if (scannedData.startsWith('GUARD_INVITE:')) {
        const inviteData = JSON.parse(scannedData.replace('GUARD_INVITE:', ''))
        
        // Check if invitation is still valid
        const expiryDate = new Date(inviteData.expires)
        if (expiryDate < new Date()) {
          setError('This invitation has expired. Please request a new one.')
          return
        }
        
        // Set the invite code and show registration form
        setInviteCode(inviteData.code)
        setSuccess(`Invitation scanned successfully for ${inviteData.name || 'Guard'}!`)
        setShowQRScanner(false)
        setShowInviteForm(true)
        setIsSignUp(true)
        
      } else {
        setError('Invalid QR code. Please scan a valid guard invitation.')
      }
    } catch (err) {
      setError('Failed to process QR code. Please try again.')
    }
  }

  const handleInviteCodeSubmit = () => {
    if (!inviteCode.trim()) {
      setError('Please enter a valid invitation code')
      return
    }
    
    // In real implementation, validate invite code against database
    setSuccess('Invitation code accepted! Please complete your registration.')
    setShowInviteForm(false)
    setIsSignUp(true)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-6">
        
        {/* Header */}
        <div className="text-center">
          <div className="flex justify-center items-center mb-4">
            <div className="h-12 w-12 bg-purple-600 rounded-xl flex items-center justify-center">
              <Shield className="h-7 w-7 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">WorkforceOne</h1>
          <p className="text-gray-600 mt-2">Security Management System</p>
          <Badge className="mt-2 bg-purple-100 text-purple-800">
            <ShieldCheck className="h-3 w-3 mr-1" />
            Guard System
          </Badge>
        </div>

        {/* New Guard Invitation Section */}
        {!isSignUp && !showInviteForm && (
          <Card className="bg-gradient-to-r from-purple-100 to-indigo-100 border-purple-200">
            <CardContent className="p-6">
              <div className="text-center space-y-4">
                <h3 className="font-semibold text-purple-900">New Guard?</h3>
                <p className="text-sm text-purple-800">
                  Scan your invitation QR code or enter your invite code
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setShowQRScanner(true)}
                    className="h-16 flex-col bg-white hover:bg-purple-50"
                  >
                    <QrCode className="h-6 w-6 mb-1 text-purple-600" />
                    Scan QR Code
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowInviteForm(true)}
                    className="h-16 flex-col bg-white hover:bg-purple-50"
                  >
                    <ShieldCheck className="h-6 w-6 mb-1 text-purple-600" />
                    Enter Code
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Invite Code Form */}
        {showInviteForm && (
          <Card className="shadow-lg border-purple-200">
            <CardHeader>
              <CardTitle className="text-center flex items-center justify-center">
                <ShieldCheck className="h-5 w-5 mr-2 text-purple-600" />
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
                  placeholder="GRD-ABC123"
                  className="text-center font-mono"
                  maxLength={10}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Enter the code provided by your security manager
                </p>
              </div>
              
              <div className="flex space-x-2">
                <Button
                  onClick={handleInviteCodeSubmit}
                  disabled={!inviteCode.trim()}
                  className="flex-1 bg-purple-600 hover:bg-purple-700"
                >
                  Verify Code
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowInviteForm(false)
                    setInviteCode('')
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
              {isSignUp ? 'Complete Guard Registration' : 'Guard Sign In'}
            </CardTitle>
            {inviteCode && (
              <div className="text-center">
                <Badge className="bg-green-100 text-green-800">
                  Invitation: {inviteCode}
                </Badge>
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
                  placeholder="guard@security.com"
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
                className="w-full bg-purple-600 hover:bg-purple-700"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    {isSignUp ? 'Creating Account...' : 'Signing In...'}
                  </div>
                ) : (
                  <>
                    {isSignUp ? 'Register as Guard' : 'Sign In'}
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            </form>

            <div className="mt-4 text-center">
              <button
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-purple-600 hover:text-purple-800 text-sm"
                disabled={isLoading}
              >
                {isSignUp 
                  ? 'Already have an account? Sign in' 
                  : "Need guard access? Register here"
                }
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Cross-App Navigation */}
        <Card className="bg-gradient-to-r from-slate-50 to-gray-100">
          <CardContent className="p-4">
            <h3 className="font-semibold text-gray-900 mb-3 text-center">
              Access Other WorkforceOne Apps
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                className="h-16 flex-col text-xs"
                onClick={() => navigateToApp(APP_URLS.time)}
              >
                <Clock className="h-5 w-5 mb-1 text-blue-600" />
                Time Tracker
              </Button>
              <Button
                variant="outline"
                className="h-16 flex-col text-xs"
                onClick={() => navigateToApp(APP_URLS.main)}
              >
                <Building className="h-5 w-5 mb-1 text-green-600" />
                Main Portal
              </Button>
            </div>
            <p className="text-xs text-gray-500 text-center mt-2">
              Single sign-on across all WorkforceOne applications
            </p>
          </CardContent>
        </Card>

        {/* Features */}
        <Card className="bg-gradient-to-r from-purple-50 to-indigo-50">
          <CardContent className="p-4">
            <h3 className="font-semibold text-purple-900 mb-3 text-center">
              Guard System Features
            </h3>
            <div className="space-y-2 text-sm text-purple-800">
              <div className="flex items-center">
                <CheckCircle className="h-4 w-4 mr-2 text-purple-600" />
                Complete guard onboarding workflow
              </div>
              <div className="flex items-center">
                <CheckCircle className="h-4 w-4 mr-2 text-purple-600" />
                Site assignment and management
              </div>
              <div className="flex items-center">
                <CheckCircle className="h-4 w-4 mr-2 text-purple-600" />
                Real-time operations dashboard
              </div>
              <div className="flex items-center">
                <CheckCircle className="h-4 w-4 mr-2 text-purple-600" />
                Incident reporting and tracking
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Security Notice */}
        <Card className="bg-gradient-to-r from-red-50 to-orange-50 border-red-200">
          <CardContent className="p-4">
            <div className="flex items-center mb-2">
              <Shield className="h-4 w-4 text-red-600 mr-2" />
              <h3 className="font-semibold text-red-900 text-sm">Security Notice</h3>
            </div>
            <p className="text-xs text-red-800">
              This system contains sensitive security information. Unauthorized access is prohibited 
              and monitored. All activities are logged for security purposes.
            </p>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-sm text-gray-500">
          <p>© 2025 WorkforceOne Security. All rights reserved.</p>
          <p className="mt-1">Secure • Reliable • Professional</p>
        </div>
      </div>

      {/* QR Scanner Modal */}
      {showQRScanner && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-sm">
            <CardHeader>
              <CardTitle className="text-center flex items-center justify-center">
                <Camera className="h-5 w-5 mr-2 text-purple-600" />
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