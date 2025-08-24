'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react'

export default function GoogleMapsTestPage() {
  const [apiKeyStatus, setApiKeyStatus] = useState<'checking' | 'valid' | 'invalid' | 'missing'>('checking')
  const [apiKeyValue, setApiKeyValue] = useState<string>('')
  const [testResult, setTestResult] = useState<string>('')

  useEffect(() => {
    checkApiKey()
  }, [])

  const checkApiKey = () => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
    devLog('Environment variable:', apiKey);
    
    setApiKeyValue(apiKey || '')
    
    if (!apiKey) {
      setApiKeyStatus('missing')
      setTestResult('NEXT_PUBLIC_GOOGLE_MAPS_API_KEY environment variable is not set')
      return
    }

    if (apiKey.length < 30) {
      setApiKeyStatus('invalid')
      setTestResult('API key appears to be too short. Google Maps API keys are typically 39 characters long.')
      return
    }

    setApiKeyStatus('valid')
    setTestResult('API key is present and appears to be valid format')
  }

  const testDirectApiCall = async () => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
    if (!apiKey) {
      setTestResult('No API key to test')
      return
    }

    try {
      devLog('Testing direct API call...');
      const testUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=New+York+City&key=${apiKey}`
      
      const response = await fetch(testUrl)
      const data = await response.json()
      
      devLog('API Response:', data);
      
      if (data.status === 'OK') {
        setTestResult('✅ API key is working! Geocoding test successful.')
        setApiKeyStatus('valid')
      } else if (data.status === 'REQUEST_DENIED') {
        setTestResult('❌ API key denied. Check API restrictions and billing.')
        setApiKeyStatus('invalid')
      } else {
        setTestResult(`⚠️ API returned status: ${data.status} - ${data.error_message || 'No error message'}`)
        setApiKeyStatus('invalid')
      }
    } catch (error) {
      console.error('Test failed:', error)
      setTestResult(`❌ Network error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const testMapsJSAPI = async () => {
    try {
      devLog('Testing Maps JavaScript API...');
      
      // Try to load the Maps JavaScript API directly
      const script = document.createElement('script')
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&callback=initTestMap`
      script.async = true
      
      // Create a callback
      ;(window as any).initTestMap = () => {
        devLog('Maps JavaScript API loaded successfully');
        setTestResult('✅ Maps JavaScript API loaded successfully!')
        setApiKeyStatus('valid')
      }
      
      script.onerror = () => {
        console.error('Failed to load Maps JavaScript API')
        setTestResult('❌ Failed to load Maps JavaScript API. Check API key and restrictions.')
        setApiKeyStatus('invalid')
      }
      
      document.head.appendChild(script)
      
      // Clean up after 10 seconds
      setTimeout(() => {
        document.head.removeChild(script)
        delete (window as any).initTestMap
      }, 10000)
      
    } catch (error) {
      console.error('Test failed:', error)
      setTestResult(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const getStatusIcon = () => {
    switch (apiKeyStatus) {
      case 'valid':
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case 'invalid':
        return <XCircle className="h-5 w-5 text-red-600" />
      case 'missing':
        return <XCircle className="h-5 w-5 text-red-600" />
      case 'checking':
      default:
        return <AlertCircle className="h-5 w-5 text-yellow-600" />
    }
  }

  const getStatusColor = () => {
    switch (apiKeyStatus) {
      case 'valid':
        return 'border-green-200 bg-green-50'
      case 'invalid':
      case 'missing':
        return 'border-red-200 bg-red-50'
      case 'checking':
      default:
        return 'border-yellow-200 bg-yellow-50'
    }
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Google Maps API Test</h1>
        <p className="text-gray-600">Test your Google Maps API configuration</p>
      </div>

      {/* API Key Status */}
      <Card className={getStatusColor()}>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            {getStatusIcon()}
            <span>API Key Status</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div>
              <strong>Environment Variable:</strong> NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
            </div>
            <div>
              <strong>Value:</strong> {apiKeyValue ? `${apiKeyValue.slice(0, 10)}...${apiKeyValue.slice(-4)}` : 'Not set'}
            </div>
            <div>
              <strong>Length:</strong> {apiKeyValue.length} characters
            </div>
            <div className="p-3 bg-white rounded border">
              {testResult}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Test Buttons */}
      <Card>
        <CardHeader>
          <CardTitle>API Tests</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex space-x-4">
              <Button onClick={testDirectApiCall} variant="outline">
                Test Geocoding API
              </Button>
              <Button onClick={testMapsJSAPI} variant="outline">
                Test Maps JavaScript API
              </Button>
              <Button onClick={checkApiKey} variant="outline">
                Recheck API Key
              </Button>
            </div>
            
            <div className="text-sm text-gray-600">
              <p><strong>Geocoding Test:</strong> Tests if the API key works with Google's REST APIs</p>
              <p><strong>Maps JS Test:</strong> Tests if the API key works with the Maps JavaScript API</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Troubleshooting */}
      <Card>
        <CardHeader>
          <CardTitle>Troubleshooting</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div>
              <strong>If API key is missing:</strong>
              <ul className="list-disc ml-5 mt-1 space-y-1">
                <li>Check that .env.local file exists in the project root</li>
                <li>Verify the variable name is exactly: NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</li>
                <li>Restart your development server after adding the key</li>
              </ul>
            </div>
            
            <div>
              <strong>If API key is invalid:</strong>
              <ul className="list-disc ml-5 mt-1 space-y-1">
                <li>Go to <a href="https://console.cloud.google.com/google/maps-apis" target="_blank" className="text-blue-600 underline">Google Cloud Console</a></li>
                <li>Enable the "Maps JavaScript API"</li>
                <li>Check API key restrictions (HTTP referrers)</li>
                <li>Verify billing is enabled on your Google Cloud project</li>
              </ul>
            </div>
            
            <div>
              <strong>Required API restrictions setup:</strong>
              <ul className="list-disc ml-5 mt-1 space-y-1">
                <li>Application restrictions: HTTP referrers</li>
                <li>Add: localhost:3000/* (for development)</li>
                <li>Add: your-domain.com/* (for production)</li>
                <li>API restrictions: Select only enabled APIs</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}