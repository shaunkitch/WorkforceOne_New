'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Badge } from '@/components/ui/badge'
import Navbar from '@/components/navigation/Navbar'
import { 
  Settings, Shield, Brain, Fingerprint, Camera, Radar, 
  Smartphone, Globe, Wifi, Bell, Lock, Eye, Zap,
  Database, Cloud, AlertTriangle, CheckCircle, Cpu,
  Radio, Satellite, Map, Timer, Battery, Activity
} from 'lucide-react'

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    // AI & Machine Learning
    aiThreatDetection: true,
    predictiveAnalytics: true,
    autoIncidentClassification: true,
    behaviorAnalysis: true,
    faceRecognition: true,
    
    // Biometric Security
    fingerprintAuth: true,
    faceIdAuth: true,
    voiceRecognition: false,
    retinaScanning: false,
    
    // IoT & Devices
    smartCameras: true,
    motionSensors: true,
    doorSensors: true,
    environmentalSensors: false,
    droneIntegration: false,
    
    // Real-time Features
    liveTracking: true,
    geofencing: true,
    instantAlerts: true,
    voiceCommands: false,
    
    // Analytics & Reporting
    realTimeAnalytics: true,
    predictiveReports: true,
    performanceMetrics: true,
    complianceReporting: true,
    
    // Notification Settings
    pushNotifications: true,
    emailAlerts: true,
    smsAlerts: false,
    slackIntegration: false,
    
    // Security Levels
    threatSensitivity: [75],
    aiConfidenceThreshold: [85],
    responseTimeTarget: [5], // minutes
    patrolFrequency: [30] // minutes
  })

  const handleToggle = (key: string) => {
    setSettings(prev => ({
      ...prev,
      [key]: !prev[key as keyof typeof prev]
    }))
  }

  const handleSliderChange = (key: string, value: number[]) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <Settings className="h-8 w-8 text-purple-600 mr-3" />
              System Configuration
            </h1>
            <p className="text-gray-600 mt-1">Advanced security system settings and AI configuration</p>
          </div>
          <div className="flex space-x-3">
            <Button variant="outline">
              <Database className="h-4 w-4 mr-2" />
              Export Config
            </Button>
            <Button className="bg-purple-600 hover:bg-purple-700">
              <CheckCircle className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* AI & Machine Learning */}
          <Card className="border-l-4 border-purple-500">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Brain className="h-6 w-6 mr-3 text-purple-600" />
                AI & Machine Learning
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">AI Threat Detection</Label>
                  <p className="text-xs text-gray-500">Automatically detect and classify threats</p>
                </div>
                <Switch 
                  checked={settings.aiThreatDetection}
                  onCheckedChange={() => handleToggle('aiThreatDetection')}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">Predictive Analytics</Label>
                  <p className="text-xs text-gray-500">Predict incidents before they occur</p>
                </div>
                <Switch 
                  checked={settings.predictiveAnalytics}
                  onCheckedChange={() => handleToggle('predictiveAnalytics')}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">Auto Incident Classification</Label>
                  <p className="text-xs text-gray-500">ML-powered incident categorization</p>
                </div>
                <Switch 
                  checked={settings.autoIncidentClassification}
                  onCheckedChange={() => handleToggle('autoIncidentClassification')}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">Behavior Analysis</Label>
                  <p className="text-xs text-gray-500">Analyze patterns in guard and visitor behavior</p>
                </div>
                <Switch 
                  checked={settings.behaviorAnalysis}
                  onCheckedChange={() => handleToggle('behaviorAnalysis')}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">AI Confidence Threshold</Label>
                <Slider
                  value={settings.aiConfidenceThreshold}
                  onValueChange={(value) => handleSliderChange('aiConfidenceThreshold', value)}
                  max={100}
                  min={50}
                  step={5}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>50%</span>
                  <span>{settings.aiConfidenceThreshold[0]}%</span>
                  <span>100%</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Biometric Security */}
          <Card className="border-l-4 border-green-500">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Fingerprint className="h-6 w-6 mr-3 text-green-600" />
                Biometric Security
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">Fingerprint Authentication</Label>
                  <p className="text-xs text-gray-500">Secure guard check-ins with fingerprints</p>
                </div>
                <Switch 
                  checked={settings.fingerprintAuth}
                  onCheckedChange={() => handleToggle('fingerprintAuth')}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">Face ID Authentication</Label>
                  <p className="text-xs text-gray-500">Facial recognition for access control</p>
                </div>
                <Switch 
                  checked={settings.faceIdAuth}
                  onCheckedChange={() => handleToggle('faceIdAuth')}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">Voice Recognition</Label>
                  <p className="text-xs text-gray-500">Voice-based identity verification</p>
                </div>
                <Switch 
                  checked={settings.voiceRecognition}
                  onCheckedChange={() => handleToggle('voiceRecognition')}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">Retina Scanning</Label>
                  <p className="text-xs text-gray-500">Advanced biometric security</p>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="secondary" className="text-xs">Premium</Badge>
                  <Switch 
                    checked={settings.retinaScanning}
                    onCheckedChange={() => handleToggle('retinaScanning')}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* IoT & Smart Devices */}
          <Card className="border-l-4 border-blue-500">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Wifi className="h-6 w-6 mr-3 text-blue-600" />
                IoT & Smart Devices
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">Smart Cameras</Label>
                  <p className="text-xs text-gray-500">AI-powered surveillance cameras</p>
                </div>
                <Switch 
                  checked={settings.smartCameras}
                  onCheckedChange={() => handleToggle('smartCameras')}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">Motion Sensors</Label>
                  <p className="text-xs text-gray-500">Detect movement in restricted areas</p>
                </div>
                <Switch 
                  checked={settings.motionSensors}
                  onCheckedChange={() => handleToggle('motionSensors')}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">Door Sensors</Label>
                  <p className="text-xs text-gray-500">Monitor access points</p>
                </div>
                <Switch 
                  checked={settings.doorSensors}
                  onCheckedChange={() => handleToggle('doorSensors')}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">Environmental Sensors</Label>
                  <p className="text-xs text-gray-500">Temperature, humidity, air quality</p>
                </div>
                <Switch 
                  checked={settings.environmentalSensors}
                  onCheckedChange={() => handleToggle('environmentalSensors')}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">Drone Integration</Label>
                  <p className="text-xs text-gray-500">Autonomous patrol drones</p>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="secondary" className="text-xs">Beta</Badge>
                  <Switch 
                    checked={settings.droneIntegration}
                    onCheckedChange={() => handleToggle('droneIntegration')}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Real-time Features */}
          <Card className="border-l-4 border-orange-500">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Zap className="h-6 w-6 mr-3 text-orange-600" />
                Real-time Features
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">Live Guard Tracking</Label>
                  <p className="text-xs text-gray-500">Real-time GPS location monitoring</p>
                </div>
                <Switch 
                  checked={settings.liveTracking}
                  onCheckedChange={() => handleToggle('liveTracking')}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">Geofencing</Label>
                  <p className="text-xs text-gray-500">Virtual boundaries and alerts</p>
                </div>
                <Switch 
                  checked={settings.geofencing}
                  onCheckedChange={() => handleToggle('geofencing')}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">Instant Alerts</Label>
                  <p className="text-xs text-gray-500">Real-time incident notifications</p>
                </div>
                <Switch 
                  checked={settings.instantAlerts}
                  onCheckedChange={() => handleToggle('instantAlerts')}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Response Time Target (minutes)</Label>
                <Slider
                  value={settings.responseTimeTarget}
                  onValueChange={(value) => handleSliderChange('responseTimeTarget', value)}
                  max={30}
                  min={1}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>1 min</span>
                  <span>{settings.responseTimeTarget[0]} min</span>
                  <span>30 min</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Advanced Configuration */}
        <Card className="bg-gradient-to-r from-purple-900 to-indigo-900 text-white">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Cpu className="h-6 w-6 mr-3" />
              Advanced System Configuration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-4">
                <h3 className="font-semibold flex items-center">
                  <Radio className="h-5 w-5 mr-2" />
                  Communication
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Push Notifications</span>
                    <Switch 
                      checked={settings.pushNotifications}
                      onCheckedChange={() => handleToggle('pushNotifications')}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Email Alerts</span>
                    <Switch 
                      checked={settings.emailAlerts}
                      onCheckedChange={() => handleToggle('emailAlerts')}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">SMS Alerts</span>
                    <Switch 
                      checked={settings.smsAlerts}
                      onCheckedChange={() => handleToggle('smsAlerts')}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold flex items-center">
                  <Satellite className="h-5 w-5 mr-2" />
                  Monitoring
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Real-time Analytics</span>
                    <Switch 
                      checked={settings.realTimeAnalytics}
                      onCheckedChange={() => handleToggle('realTimeAnalytics')}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Performance Metrics</span>
                    <Switch 
                      checked={settings.performanceMetrics}
                      onCheckedChange={() => handleToggle('performanceMetrics')}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Compliance Reporting</span>
                    <Switch 
                      checked={settings.complianceReporting}
                      onCheckedChange={() => handleToggle('complianceReporting')}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold flex items-center">
                  <Shield className="h-5 w-5 mr-2" />
                  Security
                </h3>
                <div className="space-y-3">
                  <div>
                    <Label className="text-sm">Threat Sensitivity</Label>
                    <Slider
                      value={settings.threatSensitivity}
                      onValueChange={(value) => handleSliderChange('threatSensitivity', value)}
                      max={100}
                      min={10}
                      step={5}
                      className="mt-2"
                    />
                    <span className="text-xs">{settings.threatSensitivity[0]}%</span>
                  </div>
                  <div>
                    <Label className="text-sm">Patrol Frequency</Label>
                    <Slider
                      value={settings.patrolFrequency}
                      onValueChange={(value) => handleSliderChange('patrolFrequency', value)}
                      max={120}
                      min={5}
                      step={5}
                      className="mt-2"
                    />
                    <span className="text-xs">{settings.patrolFrequency[0]} min</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* System Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Activity className="h-6 w-6 mr-3 text-green-600" />
              System Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="h-12 w-12 bg-green-100 rounded-full mx-auto mb-2 flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <div className="text-sm font-medium">AI Engine</div>
                <div className="text-xs text-green-600">Operational</div>
              </div>
              <div className="text-center">
                <div className="h-12 w-12 bg-green-100 rounded-full mx-auto mb-2 flex items-center justify-center">
                  <Wifi className="h-6 w-6 text-green-600" />
                </div>
                <div className="text-sm font-medium">IoT Network</div>
                <div className="text-xs text-green-600">Connected</div>
              </div>
              <div className="text-center">
                <div className="h-12 w-12 bg-green-100 rounded-full mx-auto mb-2 flex items-center justify-center">
                  <Cloud className="h-6 w-6 text-green-600" />
                </div>
                <div className="text-sm font-medium">Cloud Services</div>
                <div className="text-xs text-green-600">Synced</div>
              </div>
              <div className="text-center">
                <div className="h-12 w-12 bg-yellow-100 rounded-full mx-auto mb-2 flex items-center justify-center">
                  <Battery className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="text-sm font-medium">Device Battery</div>
                <div className="text-xs text-yellow-600">87% Avg</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}