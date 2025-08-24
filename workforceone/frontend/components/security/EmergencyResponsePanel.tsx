'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import {
  AlertTriangle,
  Phone,
  Radio,
  MapPin,
  Users,
  Shield,
  Siren,
  Navigation,
  Clock,
  MessageSquare,
  Send,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  Zap,
  PhoneCall
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface EmergencyContact {
  id: string;
  name: string;
  role: string;
  phone: string;
  type: 'police' | 'medical' | 'fire' | 'internal';
  priority: number;
}

interface ActiveEmergency {
  id: string;
  type: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  location: string;
  description: string;
  reported_by: string;
  status: 'active' | 'responding' | 'resolved';
  created_at: string;
  response_units: string[];
  coordinates?: { lat: number; lng: number };
}

interface GuardUnit {
  id: string;
  name: string;
  status: 'available' | 'busy' | 'responding' | 'offline';
  location: string;
  distance?: number;
  eta?: string;
}

export default function EmergencyResponsePanel() {
  const supabase = createClient();
  
  // State management
  const [activeEmergency, setActiveEmergency] = useState<ActiveEmergency | null>(null);
  const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContact[]>([]);
  const [availableGuards, setAvailableGuards] = useState<GuardUnit[]>([]);
  const [selectedGuards, setSelectedGuards] = useState<string[]>([]);
  const [emergencyType, setEmergencyType] = useState<string>('security_breach');
  const [emergencySeverity, setEmergencySeverity] = useState<string>('high');
  const [emergencyDescription, setEmergencyDescription] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [isActivating, setIsActivating] = useState(false);
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [responseLog, setResponseLog] = useState<string[]>([]);

  useEffect(() => {
    loadEmergencyData();
    // Set up real-time subscriptions
    const subscription = supabase
      .channel('emergency-updates')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'emergency_alerts'
      }, handleEmergencyUpdate)
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const loadEmergencyData = async () => {
    // Load emergency contacts
    const contacts: EmergencyContact[] = [
      { id: '1', name: 'Police Emergency', role: 'Law Enforcement', phone: '911', type: 'police', priority: 1 },
      { id: '2', name: 'Medical Emergency', role: 'Ambulance Service', phone: '911', type: 'medical', priority: 1 },
      { id: '3', name: 'Fire Department', role: 'Fire & Rescue', phone: '911', type: 'fire', priority: 1 },
      { id: '4', name: 'Site Manager', role: 'Management', phone: '+1-555-0100', type: 'internal', priority: 2 },
      { id: '5', name: 'Security Supervisor', role: 'Security Lead', phone: '+1-555-0101', type: 'internal', priority: 2 },
    ];
    setEmergencyContacts(contacts);

    // Load available guard units
    const guards: GuardUnit[] = [
      { id: 'g1', name: 'Alpha Unit', status: 'available', location: 'North Gate', distance: 0.5, eta: '2 min' },
      { id: 'g2', name: 'Bravo Unit', status: 'available', location: 'East Patrol', distance: 1.2, eta: '5 min' },
      { id: 'g3', name: 'Charlie Unit', status: 'busy', location: 'Main Building', distance: 0.8, eta: '3 min' },
      { id: 'g4', name: 'Delta Unit', status: 'available', location: 'South Perimeter', distance: 2.1, eta: '8 min' },
      { id: 'g5', name: 'Mobile Response', status: 'available', location: 'Parking Area', distance: 0.3, eta: '1 min' },
    ];
    setAvailableGuards(guards);
  };

  const handleEmergencyUpdate = (payload: any) => {
    console.log('Emergency update received:', payload);
    // Handle real-time updates
    if (payload.eventType === 'INSERT' && payload.new) {
      setActiveEmergency(payload.new);
    }
  };

  const activateEmergencyResponse = async () => {
    if (!emergencyDescription.trim()) {
      alert('Please provide emergency details');
      return;
    }

    setIsActivating(true);
    try {
      // Create emergency alert
      const emergencyId = `EMRG-${Date.now()}`;
      const newEmergency: ActiveEmergency = {
        id: emergencyId,
        type: emergencyType,
        severity: emergencySeverity as any,
        location: 'Main Facility', // Would be dynamic based on actual location
        description: emergencyDescription,
        reported_by: 'Command Center',
        status: 'active',
        created_at: new Date().toISOString(),
        response_units: selectedGuards,
        coordinates: { lat: -26.2041, lng: 28.0473 } // Example coordinates
      };

      setActiveEmergency(newEmergency);
      addToResponseLog(`🚨 EMERGENCY ACTIVATED: ${emergencyType.toUpperCase()}`);
      addToResponseLog(`Severity: ${emergencySeverity.toUpperCase()}`);
      
      // Dispatch selected guards
      if (selectedGuards.length > 0) {
        addToResponseLog(`Dispatching ${selectedGuards.length} units...`);
        selectedGuards.forEach(guardId => {
          const guard = availableGuards.find(g => g.id === guardId);
          if (guard) {
            addToResponseLog(`✓ ${guard.name} dispatched - ETA: ${guard.eta}`);
          }
        });
      }

      // Auto-notify emergency contacts based on severity
      if (emergencySeverity === 'critical') {
        addToResponseLog('📞 Notifying emergency contacts...');
        emergencyContacts
          .filter(c => c.priority === 1)
          .forEach(contact => {
            addToResponseLog(`✓ ${contact.name} notified`);
          });
      }

      // Clear form
      setEmergencyDescription('');
      setSelectedGuards([]);
      
    } catch (error) {
      console.error('Failed to activate emergency:', error);
      alert('Failed to activate emergency response');
    } finally {
      setIsActivating(false);
    }
  };

  const broadcastAlert = async () => {
    if (!broadcastMessage.trim()) {
      alert('Please enter a broadcast message');
      return;
    }

    setIsBroadcasting(true);
    try {
      addToResponseLog(`📢 BROADCAST: ${broadcastMessage}`);
      // Here would implement actual broadcast logic
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      setBroadcastMessage('');
      addToResponseLog('✓ Broadcast sent to all units');
    } catch (error) {
      console.error('Broadcast failed:', error);
      alert('Failed to send broadcast');
    } finally {
      setIsBroadcasting(false);
    }
  };

  const resolveEmergency = () => {
    if (activeEmergency) {
      setActiveEmergency({
        ...activeEmergency,
        status: 'resolved'
      });
      addToResponseLog('✅ EMERGENCY RESOLVED');
      addToResponseLog(`Resolution time: ${new Date().toLocaleTimeString()}`);
    }
  };

  const addToResponseLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setResponseLog(prev => [`[${timestamp}] ${message}`, ...prev]);
  };

  const toggleGuardSelection = (guardId: string) => {
    setSelectedGuards(prev =>
      prev.includes(guardId)
        ? prev.filter(id => id !== guardId)
        : [...prev, guardId]
    );
  };

  const callEmergencyContact = (contact: EmergencyContact) => {
    addToResponseLog(`📞 Calling ${contact.name} at ${contact.phone}`);
    // Would implement actual calling functionality
    window.open(`tel:${contact.phone}`);
  };

  return (
    <div className="space-y-6">
      {/* Emergency Status Banner */}
      {activeEmergency && activeEmergency.status !== 'resolved' && (
        <Alert className="border-red-500 bg-red-50">
          <Siren className="h-4 w-4 text-red-600 animate-pulse" />
          <AlertDescription className="flex items-center justify-between">
            <div>
              <span className="font-bold text-red-800">EMERGENCY ACTIVE: </span>
              <span className="text-red-700">{activeEmergency.type.replace('_', ' ').toUpperCase()}</span>
              <Badge className="ml-2 bg-red-600 text-white">{activeEmergency.severity}</Badge>
            </div>
            <Button
              size="sm"
              variant="destructive"
              onClick={resolveEmergency}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Resolve Emergency
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Quick Emergency Activation */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Emergency Activation
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label>Emergency Type</Label>
                <Select value={emergencyType} onValueChange={setEmergencyType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="security_breach">Security Breach</SelectItem>
                    <SelectItem value="fire_alarm">Fire Alarm</SelectItem>
                    <SelectItem value="medical_emergency">Medical Emergency</SelectItem>
                    <SelectItem value="evacuation">Evacuation Required</SelectItem>
                    <SelectItem value="active_threat">Active Threat</SelectItem>
                    <SelectItem value="natural_disaster">Natural Disaster</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>Severity Level</Label>
                <Select value={emergencySeverity} onValueChange={setEmergencySeverity}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low - Monitor</SelectItem>
                    <SelectItem value="medium">Medium - Respond</SelectItem>
                    <SelectItem value="high">High - Urgent</SelectItem>
                    <SelectItem value="critical">Critical - All Units</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Emergency Description</Label>
              <Textarea
                placeholder="Describe the emergency situation..."
                value={emergencyDescription}
                onChange={(e) => setEmergencyDescription(e.target.value)}
                className="min-h-[80px]"
              />
            </div>

            {/* Guard Selection */}
            <div>
              <Label>Dispatch Units</Label>
              <div className="grid gap-2 mt-2">
                {availableGuards.map(guard => (
                  <div
                    key={guard.id}
                    className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedGuards.includes(guard.id) 
                        ? 'bg-blue-50 border-blue-500' 
                        : 'hover:bg-gray-50'
                    } ${guard.status !== 'available' ? 'opacity-50' : ''}`}
                    onClick={() => guard.status === 'available' && toggleGuardSelection(guard.id)}
                  >
                    <div className="flex items-center gap-3">
                      <Radio className={`h-4 w-4 ${
                        guard.status === 'available' ? 'text-green-500' : 'text-gray-400'
                      }`} />
                      <div>
                        <div className="font-medium">{guard.name}</div>
                        <div className="text-sm text-gray-600">{guard.location}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant={guard.status === 'available' ? 'default' : 'secondary'}>
                        {guard.status}
                      </Badge>
                      {guard.eta && (
                        <div className="text-xs text-gray-500 mt-1">ETA: {guard.eta}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Button 
              className="w-full" 
              size="lg"
              variant="destructive"
              onClick={activateEmergencyResponse}
              disabled={isActivating || !emergencyDescription.trim()}
            >
              {isActivating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Activating...
                </>
              ) : (
                <>
                  <Siren className="h-4 w-4 mr-2" />
                  Activate Emergency Response
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Emergency Contacts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5" />
              Emergency Contacts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {emergencyContacts.map(contact => (
                <div
                  key={contact.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex-1">
                    <div className="font-medium">{contact.name}</div>
                    <div className="text-sm text-gray-600">{contact.role}</div>
                    <div className="text-xs text-gray-500">{contact.phone}</div>
                  </div>
                  <Button
                    size="sm"
                    variant={contact.type === 'police' || contact.type === 'medical' ? 'destructive' : 'outline'}
                    onClick={() => callEmergencyContact(contact)}
                  >
                    <PhoneCall className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Broadcast System & Response Log */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Broadcast Alert */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Broadcast Alert
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Textarea
                placeholder="Enter message to broadcast to all units..."
                value={broadcastMessage}
                onChange={(e) => setBroadcastMessage(e.target.value)}
                className="min-h-[100px]"
              />
              <Button
                className="w-full"
                onClick={broadcastAlert}
                disabled={isBroadcasting || !broadcastMessage.trim()}
              >
                {isBroadcasting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Broadcasting...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Send Broadcast
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Response Activity Log */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Response Activity Log
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1 max-h-[200px] overflow-y-auto">
              {responseLog.length > 0 ? (
                responseLog.map((log, index) => (
                  <div key={index} className="text-sm text-gray-600 py-1 border-b">
                    {log}
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-gray-500">
                  No activity logged
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Action Buttons */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-4">
            <Button variant="outline" className="h-16 flex flex-col">
              <Shield className="h-5 w-5 mb-1" />
              <span className="text-xs">Lockdown</span>
            </Button>
            <Button variant="outline" className="h-16 flex flex-col">
              <Users className="h-5 w-5 mb-1" />
              <span className="text-xs">Evacuate</span>
            </Button>
            <Button variant="outline" className="h-16 flex flex-col">
              <AlertCircle className="h-5 w-5 mb-1" />
              <span className="text-xs">All Clear</span>
            </Button>
            <Button variant="outline" className="h-16 flex flex-col">
              <Zap className="h-5 w-5 mb-1" />
              <span className="text-xs">Test Alarm</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}