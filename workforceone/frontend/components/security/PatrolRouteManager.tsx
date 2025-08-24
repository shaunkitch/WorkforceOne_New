'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import {
  Route,
  MapPin,
  Clock,
  Users,
  Edit,
  Trash2,
  Plus,
  Save,
  Navigation,
  Target,
  AlertTriangle,
  CheckCircle,
  Copy,
  Calendar,
  BarChart,
  Shield,
  Loader2,
  ChevronRight,
  Flag,
  Timer,
  Activity
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface Checkpoint {
  id: string;
  name: string;
  description?: string;
  latitude: number;
  longitude: number;
  order: number;
  radius_meters: number;
  dwell_time_seconds: number;
  scan_required: boolean;
  qr_code?: string;
  tasks?: string[];
}

interface PatrolRoute {
  id: string;
  name: string;
  description?: string;
  color_code: string;
  status: 'active' | 'inactive' | 'maintenance';
  route_type: 'fixed' | 'random' | 'flexible';
  estimated_duration_minutes: number;
  distance_km: number;
  priority: 'low' | 'medium' | 'high';
  checkpoints: Checkpoint[];
  assigned_guards: string[];
  schedule?: {
    frequency: 'hourly' | 'daily' | 'weekly';
    times: string[];
    days?: string[];
  };
  created_at: string;
  updated_at: string;
  compliance_rate?: number;
}

interface RouteStatistics {
  total_patrols: number;
  completed_patrols: number;
  missed_checkpoints: number;
  average_duration: number;
  compliance_rate: number;
  last_patrol: string;
}

export default function PatrolRouteManager() {
  const supabase = createClient();
  const mapRef = useRef<google.maps.Map | null>(null);
  const drawingManagerRef = useRef<google.maps.drawing.DrawingManager | null>(null);
  
  // State management
  const [routes, setRoutes] = useState<PatrolRoute[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<PatrolRoute | null>(null);
  const [routeStats, setRouteStats] = useState<Map<string, RouteStatistics>>(new Map());
  const [isCreatingRoute, setIsCreatingRoute] = useState(false);
  const [isEditingRoute, setIsEditingRoute] = useState(false);
  const [showRouteDialog, setShowRouteDialog] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Form state for new/edit route
  const [routeForm, setRouteForm] = useState({
    name: '',
    description: '',
    color_code: '#3B82F6',
    route_type: 'fixed' as const,
    priority: 'medium' as const,
    estimated_duration_minutes: 60,
    checkpoints: [] as Checkpoint[]
  });

  const [newCheckpoint, setNewCheckpoint] = useState({
    name: '',
    description: '',
    latitude: 0,
    longitude: 0,
    radius_meters: 50,
    dwell_time_seconds: 60,
    scan_required: true,
    tasks: [] as string[]
  });

  useEffect(() => {
    loadPatrolRoutes();
  }, []);

  const loadPatrolRoutes = async () => {
    try {
      setLoading(true);
      
      // Mock data for demo - would fetch from database
      const mockRoutes: PatrolRoute[] = [
        {
          id: 'route-1',
          name: 'Perimeter Patrol Alpha',
          description: 'Main perimeter security patrol covering all entry points',
          color_code: '#10B981',
          status: 'active',
          route_type: 'fixed',
          estimated_duration_minutes: 45,
          distance_km: 2.5,
          priority: 'high',
          checkpoints: [
            {
              id: 'cp-1',
              name: 'North Gate',
              latitude: -26.2041,
              longitude: 28.0473,
              order: 1,
              radius_meters: 50,
              dwell_time_seconds: 120,
              scan_required: true,
              tasks: ['Check gate lock', 'Inspect fence integrity', 'Log visitor count']
            },
            {
              id: 'cp-2',
              name: 'Loading Dock',
              latitude: -26.2051,
              longitude: 28.0483,
              order: 2,
              radius_meters: 75,
              dwell_time_seconds: 180,
              scan_required: true,
              tasks: ['Verify dock security', 'Check for unauthorized vehicles']
            },
            {
              id: 'cp-3',
              name: 'South Fence',
              latitude: -26.2061,
              longitude: 28.0463,
              order: 3,
              radius_meters: 50,
              dwell_time_seconds: 60,
              scan_required: false,
              tasks: ['Visual fence inspection', 'Check lighting']
            }
          ],
          assigned_guards: ['guard-1', 'guard-2'],
          schedule: {
            frequency: 'hourly',
            times: ['00:00', '01:00', '02:00', '03:00', '04:00', '05:00']
          },
          created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date().toISOString(),
          compliance_rate: 94
        },
        {
          id: 'route-2',
          name: 'Building Interior Sweep',
          description: 'Internal security check of all floors and sensitive areas',
          color_code: '#EF4444',
          status: 'active',
          route_type: 'flexible',
          estimated_duration_minutes: 30,
          distance_km: 1.2,
          priority: 'medium',
          checkpoints: [
            {
              id: 'cp-4',
              name: 'Server Room',
              latitude: -26.2045,
              longitude: 28.0475,
              order: 1,
              radius_meters: 20,
              dwell_time_seconds: 300,
              scan_required: true,
              tasks: ['Temperature check', 'Access log review', 'Physical security check']
            },
            {
              id: 'cp-5',
              name: 'Executive Floor',
              latitude: -26.2047,
              longitude: 28.0477,
              order: 2,
              radius_meters: 30,
              dwell_time_seconds: 240,
              scan_required: true,
              tasks: ['Office security check', 'Window inspection']
            }
          ],
          assigned_guards: ['guard-3'],
          schedule: {
            frequency: 'daily',
            times: ['09:00', '15:00', '21:00']
          },
          created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date().toISOString(),
          compliance_rate: 88
        }
      ];

      setRoutes(mockRoutes);

      // Generate mock statistics
      const stats = new Map<string, RouteStatistics>();
      mockRoutes.forEach(route => {
        stats.set(route.id, {
          total_patrols: Math.floor(Math.random() * 100) + 50,
          completed_patrols: Math.floor(Math.random() * 80) + 40,
          missed_checkpoints: Math.floor(Math.random() * 10),
          average_duration: route.estimated_duration_minutes + Math.floor(Math.random() * 10) - 5,
          compliance_rate: route.compliance_rate || 90,
          last_patrol: new Date(Date.now() - Math.random() * 3600000).toISOString()
        });
      });
      setRouteStats(stats);

    } catch (error) {
      console.error('Error loading patrol routes:', error);
    } finally {
      setLoading(false);
    }
  };

  const createRoute = async () => {
    try {
      // Validate form
      if (!routeForm.name || routeForm.checkpoints.length < 2) {
        alert('Route name and at least 2 checkpoints are required');
        return;
      }

      const newRoute: PatrolRoute = {
        id: `route-${Date.now()}`,
        ...routeForm,
        status: 'active',
        distance_km: calculateRouteDistance(routeForm.checkpoints),
        assigned_guards: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      setRoutes(prev => [...prev, newRoute]);
      setShowRouteDialog(false);
      resetRouteForm();
      
    } catch (error) {
      console.error('Error creating route:', error);
      alert('Failed to create route');
    }
  };

  const updateRoute = async () => {
    if (!selectedRoute) return;

    try {
      const updatedRoute = {
        ...selectedRoute,
        ...routeForm,
        updated_at: new Date().toISOString()
      };

      setRoutes(prev => prev.map(r => r.id === selectedRoute.id ? updatedRoute : r));
      setShowRouteDialog(false);
      setIsEditingRoute(false);
      setSelectedRoute(null);
      resetRouteForm();
      
    } catch (error) {
      console.error('Error updating route:', error);
      alert('Failed to update route');
    }
  };

  const deleteRoute = async (routeId: string) => {
    if (!confirm('Are you sure you want to delete this route?')) return;

    try {
      setRoutes(prev => prev.filter(r => r.id !== routeId));
    } catch (error) {
      console.error('Error deleting route:', error);
      alert('Failed to delete route');
    }
  };

  const addCheckpoint = () => {
    if (!newCheckpoint.name) {
      alert('Checkpoint name is required');
      return;
    }

    const checkpoint: Checkpoint = {
      id: `cp-${Date.now()}`,
      ...newCheckpoint,
      order: routeForm.checkpoints.length + 1
    };

    setRouteForm(prev => ({
      ...prev,
      checkpoints: [...prev.checkpoints, checkpoint]
    }));

    // Reset checkpoint form
    setNewCheckpoint({
      name: '',
      description: '',
      latitude: 0,
      longitude: 0,
      radius_meters: 50,
      dwell_time_seconds: 60,
      scan_required: true,
      tasks: []
    });
  };

  const removeCheckpoint = (checkpointId: string) => {
    setRouteForm(prev => ({
      ...prev,
      checkpoints: prev.checkpoints.filter(cp => cp.id !== checkpointId)
    }));
  };

  const calculateRouteDistance = (checkpoints: Checkpoint[]): number => {
    // Simple distance calculation - would use actual geo calculations
    if (checkpoints.length < 2) return 0;
    return parseFloat((Math.random() * 3 + 1).toFixed(1));
  };

  const duplicateRoute = (route: PatrolRoute) => {
    const duplicatedRoute: PatrolRoute = {
      ...route,
      id: `route-${Date.now()}`,
      name: `${route.name} (Copy)`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    setRoutes(prev => [...prev, duplicatedRoute]);
  };

  const resetRouteForm = () => {
    setRouteForm({
      name: '',
      description: '',
      color_code: '#3B82F6',
      route_type: 'fixed',
      priority: 'medium',
      estimated_duration_minutes: 60,
      checkpoints: []
    });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      inactive: { color: 'bg-gray-100 text-gray-800', icon: AlertTriangle },
      maintenance: { color: 'bg-yellow-100 text-yellow-800', icon: AlertTriangle }
    };
    const config = statusConfig[status as keyof typeof statusConfig];
    const Icon = config.icon;
    return (
      <Badge className={config.color}>
        <Icon className="h-3 w-3 mr-1" />
        {status}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const priorityConfig = {
      low: 'bg-gray-100 text-gray-800',
      medium: 'bg-blue-100 text-blue-800',
      high: 'bg-red-100 text-red-800'
    };
    return (
      <Badge className={priorityConfig[priority as keyof typeof priorityConfig]}>
        {priority.toUpperCase()}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Patrol Route Management</h2>
          <p className="text-muted-foreground">Configure and monitor security patrol routes</p>
        </div>
        <Button
          onClick={() => {
            setIsCreatingRoute(true);
            setShowRouteDialog(true);
          }}
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Route
        </Button>
      </div>

      {/* Statistics Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Routes</CardTitle>
            <Route className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{routes.length}</div>
            <p className="text-xs text-muted-foreground">
              {routes.filter(r => r.status === 'active').length} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Checkpoints</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {routes.reduce((acc, route) => acc + route.checkpoints.length, 0)}
            </div>
            <p className="text-xs text-muted-foreground">Across all routes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Compliance</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {routes.length > 0
                ? Math.round(routes.reduce((acc, r) => acc + (r.compliance_rate || 0), 0) / routes.length)
                : 0}%
            </div>
            <p className="text-xs text-muted-foreground">Last 30 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Guards Assigned</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(routes.flatMap(r => r.assigned_guards)).size}
            </div>
            <p className="text-xs text-muted-foreground">Unique assignments</p>
          </CardContent>
        </Card>
      </div>

      {/* Routes List */}
      <Card>
        <CardHeader>
          <CardTitle>Configured Routes</CardTitle>
          <CardDescription>Manage and monitor all patrol routes</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : routes.length === 0 ? (
            <div className="text-center py-8">
              <Route className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-500">No routes configured yet</p>
              <Button
                className="mt-4"
                onClick={() => {
                  setIsCreatingRoute(true);
                  setShowRouteDialog(true);
                }}
              >
                Create First Route
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {routes.map(route => {
                const stats = routeStats.get(route.id);
                return (
                  <div
                    key={route.id}
                    className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: route.color_code }}
                          />
                          <h3 className="font-semibold text-lg">{route.name}</h3>
                          {getStatusBadge(route.status)}
                          {getPriorityBadge(route.priority)}
                        </div>
                        
                        {route.description && (
                          <p className="text-sm text-gray-600 mb-3">{route.description}</p>
                        )}

                        <div className="grid gap-2 md:grid-cols-4 text-sm">
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-gray-400" />
                            <span>{route.checkpoints.length} checkpoints</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Timer className="h-4 w-4 text-gray-400" />
                            <span>{route.estimated_duration_minutes} min</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Navigation className="h-4 w-4 text-gray-400" />
                            <span>{route.distance_km} km</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-gray-400" />
                            <span>{route.assigned_guards.length} guards</span>
                          </div>
                        </div>

                        {stats && (
                          <div className="mt-3 pt-3 border-t grid gap-2 md:grid-cols-3 text-sm text-gray-600">
                            <div>
                              <span className="font-medium">Compliance:</span> {stats.compliance_rate}%
                            </div>
                            <div>
                              <span className="font-medium">Completed:</span> {stats.completed_patrols}/{stats.total_patrols}
                            </div>
                            <div>
                              <span className="font-medium">Last Patrol:</span> {new Date(stats.last_patrol).toLocaleTimeString()}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 ml-4">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedRoute(route);
                            setRouteForm({
                              name: route.name,
                              description: route.description || '',
                              color_code: route.color_code,
                              route_type: route.route_type,
                              priority: route.priority,
                              estimated_duration_minutes: route.estimated_duration_minutes,
                              checkpoints: route.checkpoints
                            });
                            setIsEditingRoute(true);
                            setShowRouteDialog(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => duplicateRoute(route)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => deleteRoute(route.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Route Dialog */}
      <Dialog open={showRouteDialog} onOpenChange={setShowRouteDialog}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isEditingRoute ? 'Edit Patrol Route' : 'Create New Patrol Route'}
            </DialogTitle>
            <DialogDescription>
              Configure route details and checkpoints
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Basic Route Info */}
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label>Route Name</Label>
                  <Input
                    value={routeForm.name}
                    onChange={(e) => setRouteForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Perimeter Patrol Alpha"
                  />
                </div>
                <div>
                  <Label>Route Type</Label>
                  <Select
                    value={routeForm.route_type}
                    onValueChange={(value: any) => setRouteForm(prev => ({ ...prev, route_type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fixed">Fixed Route</SelectItem>
                      <SelectItem value="random">Random Order</SelectItem>
                      <SelectItem value="flexible">Flexible</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Description</Label>
                <Textarea
                  value={routeForm.description}
                  onChange={(e) => setRouteForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe the route purpose and any special instructions..."
                />
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <Label>Priority Level</Label>
                  <Select
                    value={routeForm.priority}
                    onValueChange={(value: any) => setRouteForm(prev => ({ ...prev, priority: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Estimated Duration (minutes)</Label>
                  <Input
                    type="number"
                    value={routeForm.estimated_duration_minutes}
                    onChange={(e) => setRouteForm(prev => ({ 
                      ...prev, 
                      estimated_duration_minutes: parseInt(e.target.value) || 0 
                    }))}
                  />
                </div>
                <div>
                  <Label>Route Color</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="color"
                      value={routeForm.color_code}
                      onChange={(e) => setRouteForm(prev => ({ ...prev, color_code: e.target.value }))}
                      className="w-20 h-10"
                    />
                    <Input
                      value={routeForm.color_code}
                      onChange={(e) => setRouteForm(prev => ({ ...prev, color_code: e.target.value }))}
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Checkpoints */}
            <div>
              <h3 className="font-semibold mb-3">Checkpoints</h3>
              
              {/* Add Checkpoint Form */}
              <Card className="mb-4">
                <CardContent className="pt-4">
                  <div className="grid gap-3 md:grid-cols-2">
                    <div>
                      <Label>Checkpoint Name</Label>
                      <Input
                        value={newCheckpoint.name}
                        onChange={(e) => setNewCheckpoint(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="e.g., North Gate"
                      />
                    </div>
                    <div>
                      <Label>Dwell Time (seconds)</Label>
                      <Input
                        type="number"
                        value={newCheckpoint.dwell_time_seconds}
                        onChange={(e) => setNewCheckpoint(prev => ({ 
                          ...prev, 
                          dwell_time_seconds: parseInt(e.target.value) || 0 
                        }))}
                      />
                    </div>
                  </div>
                  <div className="mt-3">
                    <Label>Description/Tasks</Label>
                    <Textarea
                      value={newCheckpoint.description}
                      onChange={(e) => setNewCheckpoint(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Tasks to perform at this checkpoint..."
                      className="h-20"
                    />
                  </div>
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={newCheckpoint.scan_required}
                        onCheckedChange={(checked) => setNewCheckpoint(prev => ({ 
                          ...prev, 
                          scan_required: checked 
                        }))}
                      />
                      <Label>QR Scan Required</Label>
                    </div>
                    <Button
                      type="button"
                      onClick={addCheckpoint}
                      disabled={!newCheckpoint.name}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Checkpoint
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Checkpoints List */}
              <div className="space-y-2">
                {routeForm.checkpoints.map((checkpoint, index) => (
                  <div key={checkpoint.id} className="flex items-center gap-3 p-3 border rounded-lg">
                    <div className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-600 rounded-full font-semibold text-sm">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">{checkpoint.name}</div>
                      {checkpoint.description && (
                        <div className="text-sm text-gray-600">{checkpoint.description}</div>
                      )}
                      <div className="flex items-center gap-4 text-xs text-gray-500 mt-1">
                        <span>⏱ {checkpoint.dwell_time_seconds}s</span>
                        {checkpoint.scan_required && <span>📱 QR Required</span>}
                      </div>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => removeCheckpoint(checkpoint.id)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                ))}
                
                {routeForm.checkpoints.length === 0 && (
                  <div className="text-center py-4 text-gray-500 border-2 border-dashed rounded-lg">
                    No checkpoints added yet
                  </div>
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowRouteDialog(false);
                setIsCreatingRoute(false);
                setIsEditingRoute(false);
                setSelectedRoute(null);
                resetRouteForm();
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={isEditingRoute ? updateRoute : createRoute}
              disabled={!routeForm.name || routeForm.checkpoints.length < 2}
            >
              <Save className="h-4 w-4 mr-2" />
              {isEditingRoute ? 'Update Route' : 'Create Route'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}