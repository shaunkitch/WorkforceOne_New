'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Copy, CheckCircle, Users, Link2, Mail, 
  Building, Shield, ArrowRight, Share2 
} from 'lucide-react'

export default function WelcomePage() {
  const [organization, setOrganization] = useState<any>(null)
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [inviteLink, setInviteLink] = useState('')
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    checkUserAndOrg()
  }, [])

  const checkUserAndOrg = async () => {
    try {
      // Get current user
      const { data: { user: authUser } } = await supabase.auth.getUser()
      
      if (!authUser) {
        router.push('/login')
        return
      }

      // Get user profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*, organizations(*)')
        .eq('id', authUser.id)
        .single()

      if (!profile) {
        router.push('/login')
        return
      }

      setUser(profile)
      setOrganization(profile.organizations)
      
      // Generate invite link
      const baseUrl = window.location.origin
      const link = `${baseUrl}/signup?code=${profile.organizations?.join_code}`
      setInviteLink(link)
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const sendInviteEmail = () => {
    const subject = encodeURIComponent(`Join ${organization?.name} on WorkforceOne`)
    const body = encodeURIComponent(`Hello!

You've been invited to join ${organization?.name} on WorkforceOne.

Join using this code: ${organization?.join_code}

Or click this link to get started:
${inviteLink}

WorkforceOne is our remote workforce management platform where you can:
- Track your time and attendance
- Manage tasks and projects
- Collaborate with your team
- And much more!

See you there!`)

    window.location.href = `mailto:?subject=${subject}&body=${body}`
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // Only show welcome page for admins who just created an organization
  if (user?.role !== 'admin') {
    router.push('/dashboard')
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Welcome to WorkforceOne!
          </h1>
          <p className="text-xl text-gray-600">
            Your organization <strong>{organization?.name}</strong> has been created successfully
          </p>
        </div>

        {/* Join Code Card */}
        <Card className="mb-6 border-2 border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Shield className="h-5 w-5 mr-2 text-blue-600" />
              Your Organization Join Code
            </CardTitle>
            <CardDescription>
              Share this code with your team members so they can join your organization
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <div className="text-4xl font-mono font-bold text-blue-600 tracking-wider">
                  {organization?.join_code}
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  This unique code allows team members to join during signup
                </p>
              </div>
              <Button
                onClick={() => copyToClipboard(organization?.join_code)}
                variant="outline"
                size="lg"
              >
                {copied ? (
                  <>
                    <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-5 w-5 mr-2" />
                    Copy Code
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Invite Link Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Link2 className="h-5 w-5 mr-2" />
              Invitation Link
            </CardTitle>
            <CardDescription>
              Share this direct link for easier onboarding
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={inviteLink}
                readOnly
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-sm"
              />
              <Button
                onClick={() => copyToClipboard(inviteLink)}
                variant="outline"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <div className="mt-4 flex space-x-3">
              <Button
                onClick={sendInviteEmail}
                variant="outline"
                className="flex-1"
              >
                <Mail className="h-4 w-4 mr-2" />
                Send via Email
              </Button>
              <Button
                onClick={() => copyToClipboard(inviteLink)}
                variant="outline"
                className="flex-1"
              >
                <Share2 className="h-4 w-4 mr-2" />
                Share Link
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Next Steps */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="h-5 w-5 mr-2" />
              Next Steps
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start">
                <div className="flex-shrink-0 h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                  <span className="text-sm font-semibold text-blue-600">1</span>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-gray-900">Invite Your Team</h3>
                  <p className="text-sm text-gray-600">
                    Share the join code or invitation link with your team members
                  </p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="flex-shrink-0 h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                  <span className="text-sm font-semibold text-blue-600">2</span>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-gray-900">Configure Settings</h3>
                  <p className="text-sm text-gray-600">
                    Set up your organization preferences, departments, and teams
                  </p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="flex-shrink-0 h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                  <span className="text-sm font-semibold text-blue-600">3</span>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-gray-900">Create Projects</h3>
                  <p className="text-sm text-gray-600">
                    Start creating projects and tasks for your team
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mt-8 text-center">
          <Button
            onClick={() => router.push('/dashboard')}
            size="lg"
            className="px-8"
          >
            Go to Dashboard
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  )
}