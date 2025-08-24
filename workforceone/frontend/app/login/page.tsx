// ===================================
// app/login/page.tsx
// ===================================
'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
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
} from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Loader2, Mail, Lock, Users, Eye, EyeOff, Building, 
  ArrowRight, CheckCircle, Shield, Clock, Timer
} from 'lucide-react'

function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  
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
    setLoading(true)
    const { data, error } = await handleSSOSession(encodedAuth)
    
    if (error) {
      setError('Invalid authentication token')
      setLoading(false)
      return
    }

    if (data?.user) {
      await addProductAccess(MAIN_PRODUCT_ID)
      setSuccess('Successfully signed in!')
      setTimeout(() => router.push('/dashboard'), 1000)
    }
    setLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess('')
    setLoading(true)

    try {
      if (isSignUp) {
        const { data, error } = await signUpWithEmail(email, password, {
          full_name: '',
          role: 'admin'
        })

        if (error) {
          setError(error.message)
        } else {
          setSuccess('Account created successfully! Please check your email for verification.')
        }
      } else {
        const { data, error } = await signInWithEmail(email, password)

        if (error) {
          // Handle rate limiting specifically
          if (error.message?.includes('Too Many Requests') || error.message?.includes('429')) {
            setError('Too many login attempts. Please wait a few minutes and try again.')
          } else {
            setError(error.message || 'An error occurred during login')
          }
        } else if (data?.user) {
          await addProductAccess(MAIN_PRODUCT_ID)
          setSuccess('Successfully signed in!')
          setTimeout(() => router.push('/dashboard'), 1000)
        }
      }
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const navigateToApp = async (targetApp: string) => {
    const url = await ssoRedirect(targetApp)
    if (url) {
      window.open(url, '_blank')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-6">
        
        {/* Header */}
        <div className="text-center">
          <div className="flex justify-center items-center mb-4">
            <div className="h-12 w-12 bg-green-600 rounded-xl flex items-center justify-center">
              <Building className="h-7 w-7 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">WorkforceOne</h1>
          <p className="text-gray-600 mt-2">Workforce Management System</p>
          <Badge className="mt-2 bg-green-100 text-green-800">
            <Users className="h-3 w-3 mr-1" />
            Main Portal
          </Badge>
        </div>

        {/* Sign In Form */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-center">
              {isSignUp ? 'Create Admin Account' : 'Sign In'}
            </CardTitle>
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
                  placeholder="admin@company.com"
                  required
                  disabled={loading}
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
                    disabled={loading}
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
                className="w-full bg-green-600 hover:bg-green-700"
                disabled={loading}
              >
                {loading ? (
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
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-green-600 hover:text-green-800 text-sm"
                disabled={loading}
              >
                {isSignUp 
                  ? 'Already have an account? Sign in' 
                  : "Need an admin account? Sign up"
                }
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Cross-App Navigation */}
        <Card className="bg-gradient-to-r from-slate-50 to-gray-100">
          <CardContent className="p-4">
            <h3 className="font-semibold text-gray-900 mb-3 text-center">
              Access Specialized WorkforceOne Apps
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
                onClick={() => navigateToApp(APP_URLS.guard)}
              >
                <Shield className="h-5 w-5 mb-1 text-purple-600" />
                Guard System
              </Button>
            </div>
            <p className="text-xs text-gray-500 text-center mt-2">
              Single sign-on across all WorkforceOne applications
            </p>
          </CardContent>
        </Card>

        {/* Features */}
        <Card className="bg-gradient-to-r from-green-50 to-blue-50">
          <CardContent className="p-4">
            <h3 className="font-semibold text-green-900 mb-3 text-center">
              Main Portal Features
            </h3>
            <div className="space-y-2 text-sm text-green-800">
              <div className="flex items-center">
                <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                Complete workforce management
              </div>
              <div className="flex items-center">
                <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                Multi-tenant organization system
              </div>
              <div className="flex items-center">
                <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                Advanced analytics and reporting
              </div>
              <div className="flex items-center">
                <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                Product access management
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-sm text-gray-500">
          <p>© 2025 WorkforceOne. All rights reserved.</p>
          <p className="mt-1">Secure • Scalable • Integrated</p>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}
