'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  MapPin,
  Shield, 
  AlertTriangle, 
  Users,
  RefreshCw,
  Navigation,
  Route,
  Settings,
  Eye,
  EyeOff,
  Layers,
  Target,
  Activity
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import SecurityMap from '@/components/security/SecurityMap';
import RouteManagementMap from '@/components/security/RouteManagementMap';

import { devLog } from '@/lib/utils/logger';
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
  panic_button_pressed?: boolean;
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
    is_mandatory: boolean;
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

export default function SecurityMapPage() {
  const supabase = createClient();

  // State management
  const [guardLocations, setGuardLocations] = useState<GuardLocation[]>([]);
  const [patrolRoutes, setPatrolRoutes] = useState<PatrolRoute[]>([]);
  const [incidents, setIncidents] = useState<SecurityIncident[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<string>('all');
  const [showRoutes, setShowRoutes] = useState(true);
  const [showIncidents, setShowIncidents] = useState(true);
  const [showCheckpoints, setShowCheckpoints] = useState(true);
  const [showGuards, setShowGuards] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mapMode, setMapMode] = useState<'operations' | 'planning'>('operations');

  const refreshInterval = useRef<NodeJS.Timeout | null>(null);

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
          id, name, latitude, longitude, radius_meters, is_mandatory
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

  // Filter guards by route
  const filteredGuards = selectedRoute === 'all' 
    ? guardLocations 
    : guardLocations.filter(guard => guard.route_name === selectedRoute);

  // Handle guard and incident clicks
  const handleGuardClick = (guard: GuardLocation) => {
    devLog('Guard clicked:', guard);
  };

  const handleIncidentClick = (incident: SecurityIncident) => {
    devLog('Incident clicked:', incident);
  };

  // Handle route update for planning mode
  const handleRouteUpdate = async (routeId: string, updates: any) => {
    devLog('Route update:', routeId, updates);
    // Implementation for route updates
  };

  const handleCheckpointAdd = async (routeId: string, checkpoint: any) => {
    devLog('Checkpoint add:', routeId, checkpoint);
    // Implementation for adding checkpoints
  };

  const handleCheckpointUpdate = async (checkpointId: string, updates: any) => {
    devLog('Checkpoint update:', checkpointId, updates);
    // Implementation for checkpoint updates
  };

  const handleCheckpointDelete = async (checkpointId: string) => {
    devLog('Checkpoint delete:', checkpointId);
    // Implementation for checkpoint deletion
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Security Operations Map</h1>
          <p className="text-muted-foreground">
            Real-time security monitoring and route planning interface
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

      {/* Map Mode Selection */}
      <div className="flex items-center justify-between">
        <Tabs value={mapMode} onValueChange={(value) => setMapMode(value as 'operations' | 'planning')}>
          <TabsList>
            <TabsTrigger value="operations">
              <Activity className="h-4 w-4 mr-2" />
              Operations View
            </TabsTrigger>
            <TabsTrigger value="planning">
              <Route className="h-4 w-4 mr-2" />
              Route Planning
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Layer Controls */}
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1 text-sm">
            <Button
              variant={showGuards ? "default" : "outline"}
              size="sm"
              onClick={() => setShowGuards(!showGuards)}
            >
              <Users className="h-4 w-4 mr-1" />
              Guards ({filteredGuards.length})
            </Button>
            
            <Button
              variant={showRoutes ? "default" : "outline"}
              size="sm"
              onClick={() => setShowRoutes(!showRoutes)}
            >
              <Route className="h-4 w-4 mr-1" />
              Routes ({patrolRoutes.length})
            </Button>
            
            <Button
              variant={showCheckpoints ? "default" : "outline"}
              size="sm"
              onClick={() => setShowCheckpoints(!showCheckpoints)}
            >
              <Target className="h-4 w-4 mr-1" />
              Checkpoints
            </Button>
            
            <Button
              variant={showIncidents ? "default" : "outline"}
              size="sm"
              onClick={() => setShowIncidents(!showIncidents)}
            >
              <AlertTriangle className="h-4 w-4 mr-1" />
              Incidents ({incidents.length})
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Guards</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{guardLocations.length}</div>
            <p className="text-xs text-muted-foreground">
              {guardLocations.filter(g => g.status === 'active').length} patrolling
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
              {patrolRoutes.reduce((sum, route) => sum + route.checkpoints.length, 0)} total checkpoints
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
              {incidents.filter(i => i.severity === 'critical' || i.severity === 'high').length} high priority
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

      {/* Route Filter */}
      {mapMode === 'operations' && (
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
        </div>
      )}

      {/* Main Map Interface */}
      <div className="grid gap-6 lg:grid-cols-4">
        {/* Map Display */}
        <div className="lg:col-span-3">
          {mapMode === 'operations' ? (
            <SecurityMap
              guardLocations={showGuards ? filteredGuards : []}
              patrolRoutes={showRoutes ? patrolRoutes : []}
              incidents={showIncidents ? incidents : []}
              onGuardClick={handleGuardClick}
              onIncidentClick={handleIncidentClick}
              showRoutes={showRoutes && showCheckpoints}
              showIncidents={showIncidents}
              selectedRouteFilter={selectedRoute}
              autoCenter={true}
              className="h-[600px]"
            />
          ) : (
            <RouteManagementMap
              route={patrolRoutes.find(r => r.id === selectedRoute)}
              editMode={true}
              onRouteUpdate={handleRouteUpdate}
              onCheckpointAdd={handleCheckpointAdd}
              onCheckpointUpdate={handleCheckpointUpdate}
              onCheckpointDelete={handleCheckpointDelete}
              className="h-[600px]"
            />
          )}
        </div>

        {/* Side Panel */}
        <div className="space-y-6">
          {mapMode === 'operations' ? (
            <>
              {/* Active Guards Panel */}
              {showGuards && (
                <Card>
                  <CardHeader>
                    <CardTitle>Active Guards ({filteredGuards.length})</CardTitle>
                    <CardDescription>
                      Guards currently on patrol
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 max-h-64 overflow-y-auto">
                      {filteredGuards.map((guard) => (
                        <div
                          key={guard.guard_id}
                          className="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-gray-50"
                          onClick={() => handleGuardClick(guard)}
                        >
                          <div className="flex-1">
                            <h4 className="font-medium text-sm">{guard.guard_name}</h4>
                            <p className="text-xs text-gray-600">{guard.route_name}</p>
                            <div className="flex items-center space-x-1 mt-1">
                              <Badge 
                                className={
                                  guard.status === 'active' ? 'bg-green-100 text-green-800' :
                                  guard.status === 'paused' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-blue-100 text-blue-800'
                                }
                              >
                                {guard.status}
                              </Badge>
                              {guard.panic_button_pressed && (
                                <Badge className="bg-red-100 text-red-800">EMERGENCY</Badge>
                              )}
                            </div>
                          </div>
                          <div className="text-right text-xs">
                            <p>{guard.checkpoints_completed}/{guard.checkpoints_total}</p>
                            {guard.battery_level && (
                              <p className="text-gray-500">{guard.battery_level}%</p>
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
              )}

              {/* Recent Incidents Panel */}
              {showIncidents && incidents.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Incidents</CardTitle>
                    <CardDescription>
                      Latest security incidents
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 max-h-64 overflow-y-auto">
                      {incidents.slice(0, 8).map((incident) => (
                        <div
                          key={incident.id}
                          className="flex items-start space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50"
                          onClick={() => handleIncidentClick(incident)}
                        >
                          <AlertTriangle className="h-4 w-4 mt-1 text-orange-500" />
                          <div className="flex-1">
                            <h4 className="font-medium text-sm">{incident.title}</h4>
                            <p className="text-xs text-gray-600">{incident.guard_name}</p>
                            <div className="flex items-center space-x-2 mt-1">
                              <Badge 
                                className={
                                  incident.severity === 'critical' ? 'bg-red-100 text-red-800' :
                                  incident.severity === 'high' ? 'bg-orange-100 text-orange-800' :
                                  incident.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-green-100 text-green-800'
                                }
                              >
                                {incident.severity}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            /* Route Planning Panel */
            <Card>
              <CardHeader>
                <CardTitle>Route Planning</CardTitle>
                <CardDescription>
                  Design and modify patrol routes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <p className="text-sm text-gray-600">
                    Use the map tools to:
                  </p>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Click to add checkpoints</li>
                    <li>• Draw patrol boundaries</li>
                    <li>• Edit existing routes</li>
                    <li>• Preview route coverage</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}