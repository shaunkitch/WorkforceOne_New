'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { 
  UserPlus, Shield, FileText, CheckCircle, Clock, MapPin,
  Phone, Mail, Calendar, Award, AlertTriangle, Camera,
  Fingerprint, Radio, IdCard, Upload
} from 'lucide-react'

interface GuardFormData {
  // Personal Information
  firstName: string
  lastName: string
  email: string
  phone: string
  emergencyContact: string
  emergencyPhone: string
  address: string
  
  // Professional Details
  licenseNumber: string
  licenseExpiry: string
  experience: string
  previousEmployer: string
  
  // Certifications & Training
  certifications: string[]
  languages: string[]
  specialSkills: string[]
  
  // Availability & Preferences
  shiftPreferences: string[]
  maxHoursPerWeek: number
  startDate: string
  
  // Background & References
  backgroundCheckStatus: string
  references: Array<{name: string, phone: string, relationship: string}>
  
  // Equipment & Access
  uniformSize: string
  equipmentIssued: string[]
  accessLevel: string
}

export default function GuardOnboardingPage() {
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState<GuardFormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    emergencyContact: '',
    emergencyPhone: '',
    address: '',
    licenseNumber: '',
    licenseExpiry: '',
    experience: '',
    previousEmployer: '',
    certifications: [],
    languages: ['English'],
    specialSkills: [],
    shiftPreferences: [],
    maxHoursPerWeek: 40,
    startDate: '',
    backgroundCheckStatus: 'pending',
    references: [
      {name: '', phone: '', relationship: ''},
      {name: '', phone: '', relationship: ''}
    ],
    uniformSize: '',
    equipmentIssued: [],
    accessLevel: 'basic'
  })

  const totalSteps = 6

  const availableCertifications = [
    'Security License', 'CPR Certified', 'First Aid', 'Fire Safety',
    'Armed Security', 'K9 Handler', 'Crisis Management', 'De-escalation Training'
  ]

  const availableSkills = [
    'Crowd Control', 'Emergency Response', 'Report Writing', 'Surveillance',
    'Access Control', 'Patrol Operations', 'Customer Service', 'Technology Proficient'
  ]

  const shiftOptions = [
    'Day Shift (6 AM - 2 PM)',
    'Evening Shift (2 PM - 10 PM)', 
    'Night Shift (10 PM - 6 AM)',
    'Weekend Available',
    'Holiday Available',
    'On-call Available'
  ]

  const accessLevels = [
    {value: 'basic', label: 'Basic Access - Standard patrol areas'},
    {value: 'elevated', label: 'Elevated Access - Restricted areas'},
    {value: 'high', label: 'High Security - Sensitive zones'},
    {value: 'executive', label: 'Executive Protection - VIP areas'}
  ]

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSubmit = () => {
    // In real implementation, this would submit to API and trigger background processes
    console.log('Submitting guard profile:', formData)
    alert('Guard profile created! Onboarding process initiated.')
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <UserPlus className="h-6 w-6 mr-3" />
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                    placeholder="Enter first name"
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                    placeholder="Enter last name"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    placeholder="guard@email.com"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="address">Address *</Label>
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                  placeholder="Enter full address"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="emergencyContact">Emergency Contact Name *</Label>
                  <Input
                    id="emergencyContact"
                    value={formData.emergencyContact}
                    onChange={(e) => setFormData({...formData, emergencyContact: e.target.value})}
                    placeholder="Contact name"
                  />
                </div>
                <div>
                  <Label htmlFor="emergencyPhone">Emergency Contact Phone *</Label>
                  <Input
                    id="emergencyPhone"
                    value={formData.emergencyPhone}
                    onChange={(e) => setFormData({...formData, emergencyPhone: e.target.value})}
                    placeholder="+1 (555) 987-6543"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )

      case 2:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="h-6 w-6 mr-3" />
                Professional Credentials
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="licenseNumber">Security License Number *</Label>
                  <Input
                    id="licenseNumber"
                    value={formData.licenseNumber}
                    onChange={(e) => setFormData({...formData, licenseNumber: e.target.value})}
                    placeholder="SEC-12345"
                  />
                </div>
                <div>
                  <Label htmlFor="licenseExpiry">License Expiry Date *</Label>
                  <Input
                    id="licenseExpiry"
                    type="date"
                    value={formData.licenseExpiry}
                    onChange={(e) => setFormData({...formData, licenseExpiry: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="experience">Years of Security Experience *</Label>
                <Select value={formData.experience} onValueChange={(value) => setFormData({...formData, experience: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select experience level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0-1">0-1 years</SelectItem>
                    <SelectItem value="1-3">1-3 years</SelectItem>
                    <SelectItem value="3-5">3-5 years</SelectItem>
                    <SelectItem value="5-10">5-10 years</SelectItem>
                    <SelectItem value="10+">10+ years</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="previousEmployer">Previous Security Employer</Label>
                <Input
                  id="previousEmployer"
                  value={formData.previousEmployer}
                  onChange={(e) => setFormData({...formData, previousEmployer: e.target.value})}
                  placeholder="Company name"
                />
              </div>

              <div>
                <Label>Certifications *</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {availableCertifications.map((cert) => (
                    <div key={cert} className="flex items-center space-x-2">
                      <Checkbox
                        id={cert}
                        checked={formData.certifications.includes(cert)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setFormData({...formData, certifications: [...formData.certifications, cert]})
                          } else {
                            setFormData({...formData, certifications: formData.certifications.filter(c => c !== cert)})
                          }
                        }}
                      />
                      <Label htmlFor={cert} className="text-sm">{cert}</Label>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Label>Upload Documents</Label>
                <div className="mt-2 space-y-2">
                  <Button variant="outline" className="w-full">
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Security License
                  </Button>
                  <Button variant="outline" className="w-full">
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Certifications
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )

      case 3:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Award className="h-6 w-6 mr-3" />
                Skills & Capabilities
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Special Skills</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {availableSkills.map((skill) => (
                    <div key={skill} className="flex items-center space-x-2">
                      <Checkbox
                        id={skill}
                        checked={formData.specialSkills.includes(skill)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setFormData({...formData, specialSkills: [...formData.specialSkills, skill]})
                          } else {
                            setFormData({...formData, specialSkills: formData.specialSkills.filter(s => s !== skill)})
                          }
                        }}
                      />
                      <Label htmlFor={skill} className="text-sm">{skill}</Label>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Label>Languages Spoken</Label>
                <div className="mt-2 space-y-2">
                  <div className="flex flex-wrap gap-2">
                    {formData.languages.map((lang, idx) => (
                      <Badge key={idx} variant="outline">{lang}</Badge>
                    ))}
                  </div>
                  <Input placeholder="Add additional language" />
                </div>
              </div>

              <div>
                <Label htmlFor="accessLevel">Requested Access Level</Label>
                <Select value={formData.accessLevel} onValueChange={(value) => setFormData({...formData, accessLevel: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {accessLevels.map((level) => (
                      <SelectItem key={level.value} value={level.value}>
                        {level.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500 mt-1">Access level subject to background check approval</p>
              </div>
            </CardContent>
          </Card>
        )

      default:
        return <div>Step {currentStep}</div>
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-50">
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Guard Onboarding</h1>
          <p className="text-gray-600 mt-2">Complete security personnel registration and credentialing</p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {Array.from({length: totalSteps}, (_, i) => (
              <div key={i} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  i + 1 <= currentStep ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-600'
                }`}>
                  {i + 1 <= currentStep ? <CheckCircle className="h-4 w-4" /> : i + 1}
                </div>
                {i < totalSteps - 1 && (
                  <div className={`w-12 h-1 mx-2 ${
                    i + 1 < currentStep ? 'bg-purple-600' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
          <div className="mt-2 text-center">
            <span className="text-sm text-gray-600">Step {currentStep} of {totalSteps}</span>
          </div>
        </div>

        {/* Step Content */}
        <div className="mb-8">
          {renderStepContent()}
        </div>

        {/* Navigation */}
        <div className="flex justify-between">
          <Button 
            variant="outline" 
            onClick={handlePrevious}
            disabled={currentStep === 1}
          >
            Previous
          </Button>
          
          {currentStep < totalSteps ? (
            <Button onClick={handleNext} className="bg-purple-600 hover:bg-purple-700">
              Next Step
            </Button>
          ) : (
            <Button onClick={handleSubmit} className="bg-green-600 hover:bg-green-700">
              <CheckCircle className="h-4 w-4 mr-2" />
              Complete Onboarding
            </Button>
          )}
        </div>

        {/* Status Summary */}
        <Card className="mt-8 bg-gradient-to-r from-blue-50 to-indigo-50">
          <CardContent className="p-6">
            <h3 className="font-semibold text-blue-900 mb-2">Onboarding Checklist</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center">
                <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                <span>Personal Information</span>
              </div>
              <div className="flex items-center">
                <Clock className="h-4 w-4 text-yellow-600 mr-2" />
                <span>Background Check</span>
              </div>
              <div className="flex items-center">
                <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                <span>Document Upload</span>
              </div>
              <div className="flex items-center">
                <Clock className="h-4 w-4 text-yellow-600 mr-2" />
                <span>Equipment Assignment</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}