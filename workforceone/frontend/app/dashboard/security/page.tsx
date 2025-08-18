'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Users, 
  Shield, 
  AlertTriangle, 
  CheckCircle,
  RefreshCw,
  Navigation,
  Route,
  UserCheck,
  ClipboardList
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import SecurityMap from '@/components/security/SecurityMap';

// Interfaces for type safety

interface GuardLocation {
  guard_id: string;
  guard_name: string;
  session_id: string;
  route_name: string;
  latitude: number;
  longitude: number;
  last_update: string;
  status: 'active' | 'paused' | 'completed';
  battery_level?: number;
  checkpoints_completed: number;
  checkpoints_total: number;
}

interface PatrolRoute {
  id: string;
  name: string;
  color_code: string;
  checkpoints: Array<{
    id: string;
    name: string;
    latitude: number;
    longitude: number;
    radius_meters: number;
  }>;
  boundary_coords?: Array<{ lat: number; lng: number }>;
}

interface SecurityIncident {
  id: string;
  title: string;
  category: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  latitude: number;
  longitude: number;
  guard_name: string;
  created_at: string;
  status: string;
}

export default function SecurityDashboard() {
  // Initialize Supabase client
  const supabase = createClient();

  // State management
  const [guardLocations, setGuardLocations] = useState<GuardLocation[]>([]);
  const [patrolRoutes, setPatrolRoutes] = useState<PatrolRoute[]>([]);
  const [incidents, setIncidents] = useState<SecurityIncident[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<string>('all');
  const [showRoutes, setShowRoutes] = useState(true);
  const [showIncidents, setShowIncidents] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedGuard, setSelectedGuard] = useState<GuardLocation | null>(null);
  const [selectedIncident, setSelectedIncident] = useState<SecurityIncident | null>(null);

  // Refs
  const refreshInterval = useRef<NodeJS.Timeout | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);

  // Load initial data
  useEffect(() => {
    loadDashboardData();
    
    // Set up auto-refresh
    if (autoRefresh) {
      refreshInterval.current = setInterval(loadDashboardData, 30000); // 30 seconds
    }

    return () => {
      if (refreshInterval.current) {
        clearInterval(refreshInterval.current);
      }
    };
  }, [autoRefresh]);

  // Load dashboard data
  const loadDashboardData = async () => {
    try {
      setError(null);
      
      // Load active guard locations
      await loadGuardLocations();
      
      // Load patrol routes
      await loadPatrolRoutes();
      
      // Load recent incidents
      await loadRecentIncidents();
      
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  // Load active guard locations
  const loadGuardLocations = async () => {
    const { data, error } = await supabase
      .from('active_patrol_sessions')
      .select('*');

    if (error) {
      console.error('Error loading guard locations:', error);
      return;
    }

    setGuardLocations(data || []);
  };

  // Load patrol routes
  const loadPatrolRoutes = async () => {
    const { data: routes, error } = await supabase
      .from('patrol_routes')
      .select(`
        id,
        name,
        color_code,
        boundary_coords,
        patrol_checkpoints (
          id, name, latitude, longitude, radius_meters
        )
      `)
      .eq('is_active', true);

    if (error) {
      console.error('Error loading patrol routes:', error);
      return;
    }

    setPatrolRoutes((routes || []).map(route => ({
      id: route.id,
      name: route.name,
      color_code: route.color_code || '#3b82f6',
      boundary_coords: route.boundary_coords,
      checkpoints: route.patrol_checkpoints || []
    })));
  };

  // Load recent incidents
  const loadRecentIncidents = async () => {
    const { data, error } = await supabase
      .from('recent_incidents_summary')
      .select('*')
      .limit(50);

    if (error) {
      console.error('Error loading incidents:', error);
      return;
    }

    setIncidents(data || []);
  };

  // Map event handlers
  const onMapLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
  }, []);

  const onMarkerClick = (guard: GuardLocation) => {
    setSelectedGuard(guard);
  };

  const onIncidentClick = (incident: Incident) => {
    setSelectedIncident(incident);
  };

  const centerMapOnGuard = (guard: GuardLocation) => {
    if (mapRef.current) {
      mapRef.current.panTo({ lat: guard.latitude, lng: guard.longitude });
      mapRef.current.setZoom(16);
    }
  };

  // Get guard status badge
  const getGuardStatusBadge = (status: string) => {
    const statusConfig = {
      active: { label: 'Active', color: 'bg-green-100 text-green-800' },
      paused: { label: 'Paused', color: 'bg-yellow-100 text-yellow-800' },
      completed: { label: 'Completed', color: 'bg-blue-100 text-blue-800' },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.active;
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  // Get incident severity badge
  const getIncidentSeverityBadge = (severity: string) => {
    const severityConfig = {
      low: { color: 'bg-green-100 text-green-800' },
      medium: { color: 'bg-yellow-100 text-yellow-800' },
      high: { color: 'bg-orange-100 text-orange-800' },
      critical: { color: 'bg-red-100 text-red-800' },
    };

    const config = severityConfig[severity as keyof typeof severityConfig] || severityConfig.medium;
    return <Badge className={config.color}>{severity.toUpperCase()}</Badge>;
  };

  // Get time since last update
  const getTimeSinceUpdate = (timestamp: string) => {
    const now = new Date();
    const updateTime = new Date(timestamp);
    const diffMs = now.getTime() - updateTime.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h ago`;
    return `${Math.floor(diffMinutes / 1440)}d ago`;
  };

  // Filter guards by route
  const filteredGuards = selectedRoute === 'all' 
    ? guardLocations 
    : guardLocations.filter(guard => guard.route_name === selectedRoute);

  // Handle guard and incident clicks
  const handleGuardClick = (guard: GuardLocation) => {
    console.log('Guard clicked:', guard);
  };

  const handleIncidentClick = (incident: SecurityIncident) => {
    console.log('Incident clicked:', incident);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Security Operations Center</h1>
          <p className="text-muted-foreground">
            Real-time monitoring and management of security patrol activities
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          <Button
            variant={autoRefresh ? "default" : "outline"}
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
            {autoRefresh ? 'Auto Refresh On' : 'Auto Refresh Off'}
          </Button>
          
          <Button variant="outline" size="sm" onClick={loadDashboardData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Now
          </Button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-4">
        <Button variant="outline" className="h-20 flex flex-col">
          <Route className="h-5 w-5 mb-2" />
          <span>Manage Routes</span>
        </Button>
        
        <Button variant="outline" className="h-20 flex flex-col">
          <UserCheck className="h-5 w-5 mb-2" />
          <span>Assign Guards</span>
        </Button>
        
        <Button variant="outline" className="h-20 flex flex-col">
          <ClipboardList className="h-5 w-5 mb-2" />
          <span>View Reports</span>
        </Button>
        
        <Button variant="outline" className="h-20 flex flex-col">
          <AlertTriangle className="h-5 w-5 mb-2" />
          <span>Emergency Panel</span>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Guards</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{guardLocations.length}</div>
            <p className="text-xs text-muted-foreground">
              Currently patrolling
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Routes</CardTitle>
            <Navigation className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{patrolRoutes.length}</div>
            <p className="text-xs text-muted-foreground">
              Patrol routes configured
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Incidents</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{incidents.length}</div>
            <p className="text-xs text-muted-foreground">
              Last 30 days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Status</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">Online</div>
            <p className="text-xs text-muted-foreground">
              All systems operational
            </p>
          </CardContent>
        </Card>
      </div>

      {error && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Main Content Tabs */}
      <Tabs defaultValue="live-map" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="live-map">Live Map</TabsTrigger>
          <TabsTrigger value="patrol-management">Patrol Management</TabsTrigger>
          <TabsTrigger value="incident-management">Incidents</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Live Map Tab */}
        <TabsContent value="live-map" className="space-y-4">
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Map Controls */}
            <div className="lg:col-span-3 mb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <Select value={selectedRoute} onValueChange={setSelectedRoute}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Filter by route" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Routes</SelectItem>
                      {patrolRoutes.map(route => (
                        <SelectItem key={route.id} value={route.name}>
                          {route.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <Button
                    variant={showRoutes ? "default" : "outline"}
                    size="sm"
                    onClick={() => setShowRoutes(!showRoutes)}
                  >
                    Routes
                  </Button>
                  
                  <Button
                    variant={showIncidents ? "default" : "outline"}
                    size="sm"
                    onClick={() => setShowIncidents(!showIncidents)}
                  >
                    Incidents
                  </Button>
                </div>
              </div>
            </div>

            {/* Security Map */}
            <div className="lg:col-span-2">
              <SecurityMap
                guardLocations={filteredGuards}
                patrolRoutes={patrolRoutes}
                incidents={incidents}
                onGuardClick={handleGuardClick}
                onIncidentClick={handleIncidentClick}
                showRoutes={showRoutes}
                showIncidents={showIncidents}
                selectedRouteFilter={selectedRoute}
                autoCenter={true}
              />
            </div>

            {/* Side Panel */}
            <div className="space-y-6">
              {/* Active Guards List */}
              <Card>
                <CardHeader>
                  <CardTitle>Active Guards ({filteredGuards.length})</CardTitle>
                  <CardDescription>
                    Guards currently on patrol
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {filteredGuards.map((guard) => (
                      <div
                        key={guard.guard_id}
                        className="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-gray-50"
                        onClick={() => {
                          setSelectedGuard(guard);
                          centerMapOnGuard(guard);
                        }}
                      >
                        <div className="flex-1">
                          <h4 className="font-medium">{guard.guard_name}</h4>
                          <p className="text-sm text-gray-600">{guard.route_name}</p>
                          <div className="flex items-center space-x-2 mt-1">
                            {getGuardStatusBadge(guard.status)}
                            <span className="text-xs text-gray-500">
                              {getTimeSinceUpdate(guard.last_update)}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">
                            {guard.checkpoints_completed}/{guard.checkpoints_total}
                          </p>
                          <p className="text-xs text-gray-500">checkpoints</p>
                          {guard.battery_level && (
                            <p className="text-xs text-gray-500">
                              {guard.battery_level}% battery
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                    
                    {filteredGuards.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No guards currently active</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Recent Incidents */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Incidents</CardTitle>
                  <CardDescription>
                    Latest security incidents
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {incidents.slice(0, 10).map((incident) => (
                      <div
                        key={incident.id}
                        className="flex items-start space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50"
                        onClick={() => {
                          setSelectedIncident(incident);
                          if (mapRef.current) {
                            mapRef.current.panTo({ lat: incident.latitude, lng: incident.longitude });
                            mapRef.current.setZoom(16);
                          }
                        }}
                      >
                        <AlertTriangle className="h-4 w-4 mt-1 text-orange-500" />
                        <div className="flex-1">
                          <h4 className="font-medium text-sm">{incident.title}</h4>
                          <p className="text-xs text-gray-600">{incident.guard_name}</p>
                          <div className="flex items-center space-x-2 mt-1">
                            {getIncidentSeverityBadge(incident.severity)}
                            <span className="text-xs text-gray-500">
                              {getTimeSinceUpdate(incident.created_at)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {incidents.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No recent incidents</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Other tabs would be implemented here */}
        <TabsContent value="patrol-management">
          <Card>
            <CardHeader>
              <CardTitle>Patrol Management</CardTitle>
              <CardDescription>Manage patrol routes, schedules, and assignments</CardDescription>
            </CardHeader>
            <CardContent>
              <p>Patrol management interface coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="incident-management">
          <Card>
            <CardHeader>
              <CardTitle>Incident Management</CardTitle>
              <CardDescription>Review and manage security incidents</CardDescription>
            </CardHeader>
            <CardContent>
              <p>Incident management interface coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <Card>
            <CardHeader>
              <CardTitle>Security Analytics</CardTitle>
              <CardDescription>Performance metrics and insights</CardDescription>
            </CardHeader>
            <CardContent>
              <p>Analytics dashboard coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}