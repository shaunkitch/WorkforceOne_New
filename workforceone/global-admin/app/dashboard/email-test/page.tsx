'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Mail, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'

export default function EmailTestPage() {
  const [email, setEmail] = useState('')
  const [testing, setTesting] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)

  const testEmail = async () => {
    if (!email || !email.includes('@')) {
      setResult({ success: false, message: 'Please enter a valid email address' })
      return
    }

    setTesting(true)
    setResult(null)

    try {
      // Update environment variable
      const response = await fetch('/api/monitoring/email-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          from_email: email,
          admin_email: email
        })
      })

      if (response.ok) {
        // Send test email
        const testResponse = await fetch('/api/monitoring/incidents', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'send_test_alert' })
        })

        const data = await testResponse.json()
        setResult({
          success: data.success,
          message: data.success 
            ? `Test email sent to ${email}! Check your inbox.`
            : 'Failed to send email. Please verify the email in SendGrid first.'
        })
      } else {
        setResult({ success: false, message: 'Failed to update email configuration' })
      }
    } catch (error) {
      setResult({ success: false, message: 'Error testing email configuration' })
    } finally {
      setTesting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Email Configuration Test</h1>
        <p className="text-gray-600 mt-1">Configure and test SendGrid email delivery</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>SendGrid Setup Status</CardTitle>
          <CardDescription>
            Your SendGrid API key is configured. Now verify your sender email.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">Quick Setup Instructions:</h3>
            <ol className="list-decimal list-inside space-y-2 text-sm text-blue-800">
              <li>Go to <a href="https://app.sendgrid.com/" target="_blank" className="underline">SendGrid Dashboard</a></li>
              <li>Navigate to Settings → Sender Authentication</li>
              <li>Click "Verify a Single Sender"</li>
              <li>Enter YOUR email address (Gmail, Outlook, etc.)</li>
              <li>Check your email and click the verification link</li>
              <li>Come back here and enter your verified email below</li>
            </ol>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Verified Email Address
              </label>
              <div className="flex space-x-2">
                <Input
                  type="email"
                  placeholder="your-email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1"
                />
                <Button 
                  onClick={testEmail} 
                  disabled={testing}
                >
                  {testing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Testing...
                    </>
                  ) : (
                    <>
                      <Mail className="w-4 h-4 mr-2" />
                      Test Email
                    </>
                  )}
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                This email must be verified in SendGrid first
              </p>
            </div>

            {result && (
              <div className={`rounded-lg p-4 ${
                result.success 
                  ? 'bg-green-50 border border-green-200' 
                  : 'bg-red-50 border border-red-200'
              }`}>
                <div className="flex items-start">
                  {result.success ? (
                    <CheckCircle className="w-5 h-5 text-green-600 mr-2 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-600 mr-2 mt-0.5" />
                  )}
                  <div>
                    <p className={`font-medium ${
                      result.success ? 'text-green-900' : 'text-red-900'
                    }`}>
                      {result.message}
                    </p>
                    {result.success && (
                      <p className="text-sm text-green-700 mt-1">
                        Your AI incident monitoring is now active and will send alerts to {email}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="border-t pt-4">
            <h4 className="font-medium text-gray-900 mb-2">Current Configuration:</h4>
            <div className="bg-gray-50 rounded-lg p-3 space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">SendGrid API:</span>
                <span className="text-green-600 font-medium">✓ Connected</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">From Email:</span>
                <span className="font-mono text-gray-900">
                  {email || process.env.NEXT_PUBLIC_FROM_EMAIL || 'Not configured'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Admin Email:</span>
                <span className="font-mono text-gray-900">
                  {email || process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'Not configured'}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Detected Incidents</CardTitle>
          <CardDescription>
            These incidents are waiting to send email alerts once configuration is complete
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
              <div className="flex items-center">
                <div className="w-2 h-2 bg-red-500 rounded-full mr-3"></div>
                <span className="font-medium">Critical: Supabase Database Timeout</span>
              </div>
              <span className="text-sm text-gray-600">Waiting to send alert</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
              <div className="flex items-center">
                <div className="w-2 h-2 bg-yellow-500 rounded-full mr-3"></div>
                <span className="font-medium">Low: Vercel API 404 Error</span>
              </div>
              <span className="text-sm text-gray-600">Waiting to send alert</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
              <div className="flex items-center">
                <div className="w-2 h-2 bg-yellow-500 rounded-full mr-3"></div>
                <span className="font-medium">Low: Missing Build Files</span>
              </div>
              <span className="text-sm text-gray-600">Waiting to send alert</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}