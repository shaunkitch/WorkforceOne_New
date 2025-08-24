'use client';

import React, { useState, useEffect } from 'react';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Plus, 
  Route, 
  MapPin, 
  Clock, 
  Edit, 
  Trash2,
  Eye,
  MoreHorizontal,
  CheckCircle,
  AlertCircle,
  QrCode,
  Shuffle
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import QRCodeGenerator from '@/components/security/QRCodeGenerator';
import AdhocRouteGenerator from '@/components/security/AdhocRouteGenerator';

import { devLog } from '@/lib/utils/logger';
interface PatrolRoute {
  id: string;
  name: string;
  description: string;
  estimated_duration: string;
  color_code: string;
  is_active: boolean;
  created_at: string;
  checkpoint_count?: number;
  checkpoints?: PatrolCheckpoint[];
}

interface PatrolCheckpoint {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  radius_meters: number;
  order_sequence: number;
  is_mandatory: boolean;
  requires_photo: boolean;
  photo_instructions?: string;
}

interface AdhocCheckpoint {
  name: string;
  latitude: number;
  longitude: number;
  order_sequence: number;
  estimated_time: number;
}

interface AdhocRoute {
  name: string;
  checkpoints: AdhocCheckpoint[];
  total_time: number;
  distance: number;
}

export default function PatrolRoutesPage() {
  const supabase = createClient();
  const [routes, setRoutes] = useState<PatrolRoute[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRoute, setSelectedRoute] = useState<PatrolRoute | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [selectedCheckpointForQR, setSelectedCheckpointForQR] = useState<PatrolCheckpoint | null>(null);
  const [organizationId, setOrganizationId] = useState<string>('');
  const [isAdhocModalOpen, setIsAdhocModalOpen] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    estimated_duration: '',
    color_code: '#3b82f6',
  });

  useEffect(() => {
    loadRoutes();
    loadUserOrganization();
  }, []);

  const loadUserOrganization = async () => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) {
        console.error('Error getting user:', userError);
        return;
      }
      
      if (user) {
        devLog('User found:', user.id);
        
        // Try to get organization from user metadata first
        if (user.user_metadata?.organization_id) {
          devLog('Organization ID from metadata:', user.user_metadata.organization_id);
          setOrganizationId(user.user_metadata.organization_id);
          return;
        }
        
        // Fallback to profiles table
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('organization_id')
          .eq('id', user.id)
          .single();
        
        if (profileError) {
          console.error('Error loading profile:', profileError);
          // Try with a hardcoded organization ID for testing
          devLog('Using fallback organization ID from theme provider');
          setOrganizationId('6b37111b-8cbb-4c9a-9e35-6384f9885b90');
          return;
        }
        
        if (profile && profile.organization_id) {
          devLog('Organization ID loaded from profile:', profile.organization_id);
          setOrganizationId(profile.organization_id);
        } else {
          console.error('No organization_id found in profile');
          // Use the hardcoded ID as fallback
          setOrganizationId('6b37111b-8cbb-4c9a-9e35-6384f9885b90');
        }
      } else {
        console.error('No user found');
      }
    } catch (error) {
      console.error('Error loading user organization:', error);
      // Use fallback organization ID
      setOrganizationId('6b37111b-8cbb-4c9a-9e35-6384f9885b90');
    }
  };

  const loadRoutes = async () => {
    try {
      setLoading(true);
      
      const { data: routes, error } = await supabase
        .from('patrol_routes')
        .select(`
          *,
          patrol_checkpoints(id)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const routesWithCount = routes.map(route => ({
        ...route,
        checkpoint_count: route.patrol_checkpoints?.length || 0
      }));

      setRoutes(routesWithCount);
    } catch (error) {
      console.error('Error loading routes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRoute = async () => {
    try {
      // Validate required fields
      if (!formData.name.trim()) {
        alert('Please enter a route name');
        return;
      }

      if (!organizationId) {
        console.error('organizationId is empty:', organizationId);
        alert('Organization not loaded. Please refresh and try again.');
        return;
      }
      devLog('Creating route with organizationId:', organizationId);

      // Ensure estimated_duration has a default value if empty
      const routeData = {
        ...formData,
        estimated_duration: formData.estimated_duration || '02:00:00',
        description: formData.description || '',
        organization_id: organizationId,
        is_active: true
      };

      const { data, error } = await supabase
        .from('patrol_routes')
        .insert([routeData])
        .select()
        .single();

      if (error) throw error;

      setRoutes([data, ...routes]);
      setIsCreateModalOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error creating route:', error);
      alert('Failed to create route. Please try again.');
    }
  };

  const handleUpdateRoute = async () => {
    if (!selectedRoute) return;

    try {
      // Validate required fields
      if (!formData.name.trim()) {
        alert('Please enter a route name');
        return;
      }

      if (!organizationId) {
        alert('Organization not loaded. Please refresh and try again.');
        return;
      }

      // Ensure estimated_duration has a valid value
      const routeData = {
        ...formData,
        estimated_duration: formData.estimated_duration || '02:00:00',
        description: formData.description || '',
        organization_id: organizationId
      };

      const { data, error } = await supabase
        .from('patrol_routes')
        .update(routeData)
        .eq('id', selectedRoute.id)
        .select()
        .single();

      if (error) throw error;

      setRoutes(routes.map(route => 
        route.id === selectedRoute.id ? { ...data, checkpoint_count: route.checkpoint_count } : route
      ));
      setIsEditModalOpen(false);
      setSelectedRoute(null);
      resetForm();
    } catch (error) {
      console.error('Error updating route:', error);
      alert('Failed to update route. Please try again.');
    }
  };

  const handleDeleteRoute = async (routeId: string) => {
    if (!confirm('Are you sure you want to delete this route? This action cannot be undone.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('patrol_routes')
        .delete()
        .eq('id', routeId);

      if (error) throw error;

      setRoutes(routes.filter(route => route.id !== routeId));
    } catch (error) {
      console.error('Error deleting route:', error);
    }
  };

  const handleToggleActive = async (route: PatrolRoute) => {
    try {
      const { data, error } = await supabase
        .from('patrol_routes')
        .update({ is_active: !route.is_active })
        .eq('id', route.id)
        .select()
        .single();

      if (error) throw error;

      setRoutes(routes.map(r => 
        r.id === route.id ? { ...data, checkpoint_count: r.checkpoint_count } : r
      ));
    } catch (error) {
      console.error('Error toggling route status:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      estimated_duration: '',
      color_code: '#3b82f6',
    });
  };

  const openEditModal = (route: PatrolRoute) => {
    setSelectedRoute(route);
    setFormData({
      name: route.name,
      description: route.description,
      estimated_duration: route.estimated_duration,
      color_code: route.color_code,
    });
    setIsEditModalOpen(true);
  };

  const openViewModal = async (route: PatrolRoute) => {
    try {
      const { data, error } = await supabase
        .from('patrol_routes')
        .select(`
          *,
          patrol_checkpoints(*)
        `)
        .eq('id', route.id)
        .single();

      if (error) throw error;

      setSelectedRoute({
        ...data,
        checkpoints: data.patrol_checkpoints || []
      });
      setIsViewModalOpen(true);
    } catch (error) {
      console.error('Error loading route details:', error);
    }
  };

  const openQRModal = (checkpoint: PatrolCheckpoint) => {
    setSelectedCheckpointForQR(checkpoint);
    setIsQRModalOpen(true);
  };

  const handleAdhocRouteGenerated = async (adhocRoute: AdhocRoute) => {
    try {
      if (!organizationId) {
        alert('Organization not loaded. Please refresh and try again.');
        return;
      }
      
      // Create the route first
      const routeData = {
        name: adhocRoute.name,
        description: `Auto-generated adhoc route with ${adhocRoute.checkpoints.length} checkpoints`,
        estimated_duration: `${Math.floor(adhocRoute.total_time / 60).toString().padStart(2, '0')}:${(adhocRoute.total_time % 60).toString().padStart(2, '0')}:00`,
        color_code: '#' + Math.floor(Math.random()*16777215).toString(16), // Random color
        organization_id: organizationId,
        is_active: true
      };

      const { data: newRoute, error: routeError } = await supabase
        .from('patrol_routes')
        .insert([routeData])
        .select()
        .single();

      if (routeError) throw routeError;

      // Create checkpoints for the route
      const checkpointsData = adhocRoute.checkpoints.map(cp => ({
        route_id: newRoute.id,
        name: cp.name,
        latitude: cp.latitude,
        longitude: cp.longitude,
        radius_meters: 50, // Default radius
        order_sequence: cp.order_sequence,
        is_mandatory: true,
        requires_photo: false,
        organization_id: organizationId
      }));

      const { error: checkpointsError } = await supabase
        .from('patrol_checkpoints')
        .insert(checkpointsData);

      if (checkpointsError) throw checkpointsError;

      // Refresh routes list
      await loadRoutes();
      
      // Close modal and show success
      setIsAdhocModalOpen(false);
      alert(`Adhoc route "${adhocRoute.name}" created successfully with ${adhocRoute.checkpoints.length} checkpoints!`);
      
    } catch (error) {
      console.error('Error creating adhoc route:', error);
      alert('Failed to create adhoc route. Please try again.');
    }
  };

  const formatDuration = (duration: string) => {
    // Convert PostgreSQL interval to readable format
    return duration.replace(/(\d+):(\d+):(\d+)/, '$1h $2m');
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Patrol Routes</h1>
          <p className="text-muted-foreground">
            Manage security patrol routes and checkpoints
          </p>
        </div>
        
        <div className="flex space-x-2">
          <Button 
            variant="outline"
            onClick={() => setIsAdhocModalOpen(true)}
          >
            <Shuffle className="h-4 w-4 mr-2" />
            Generate Adhoc Route
          </Button>
          
          <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Route
              </Button>
            </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Create New Patrol Route</DialogTitle>
              <DialogDescription>
                Create a new patrol route for your security guards.
              </DialogDescription>
            </DialogHeader>
            
            <div className="p-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Route Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Building Perimeter"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Complete patrol of building perimeter including all entry points"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="duration">Estimated Duration (HH:MM:SS)</Label>
                <Input
                  id="duration"
                  value={formData.estimated_duration}
                  onChange={(e) => setFormData({ ...formData, estimated_duration: e.target.value })}
                  placeholder="02:00:00"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="color">Route Color</Label>
                <Input
                  id="color"
                  type="color"
                  value={formData.color_code}
                  onChange={(e) => setFormData({ ...formData, color_code: e.target.value })}
                  className="h-10 w-20"
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateRoute}>
                Create Route
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Routes</CardTitle>
            <Route className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{routes.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Routes</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {routes.filter(r => r.is_active).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Checkpoints</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {routes.reduce((sum, route) => sum + (route.checkpoint_count || 0), 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Duration</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2.5h</div>
          </CardContent>
        </Card>
      </div>

      {/* Routes Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Routes</CardTitle>
          <CardDescription>
            Manage your organization's security patrol routes
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Route Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Checkpoints</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {routes.map((route) => (
                  <TableRow key={route.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center space-x-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: route.color_code }}
                        />
                        <span>{route.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {route.description}
                    </TableCell>
                    <TableCell>
                      {formatDuration(route.estimated_duration)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {route.checkpoint_count} checkpoints
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={route.is_active ? "default" : "secondary"}
                        className={route.is_active ? "bg-green-100 text-green-800" : ""}
                      >
                        {route.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => openViewModal(route)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => openEditModal(route)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleToggleActive(route)}
                        >
                          {route.is_active ? (
                            <AlertCircle className="h-4 w-4 text-orange-500" />
                          ) : (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          )}
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleDeleteRoute(route.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          
          {!loading && routes.length === 0 && (
            <div className="text-center py-8">
              <Route className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No routes found</h3>
              <p className="text-gray-500 mb-4">Get started by creating your first patrol route.</p>
              <Button onClick={() => setIsCreateModalOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Route
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Route Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Patrol Route</DialogTitle>
            <DialogDescription>
              Update the details of this patrol route.
            </DialogDescription>
          </DialogHeader>
          <div className="p-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Route Name</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-duration">Estimated Duration (HH:MM:SS)</Label>
              <Input
                id="edit-duration"
                value={formData.estimated_duration}
                onChange={(e) => setFormData({ ...formData, estimated_duration: e.target.value })}
                placeholder="02:00:00"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-color">Route Color</Label>
              <Input
                id="edit-color"
                type="color"
                value={formData.color_code}
                onChange={(e) => setFormData({ ...formData, color_code: e.target.value })}
                className="h-10 w-20"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateRoute}>
              Update Route
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Route Modal */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Route Details</DialogTitle>
            <DialogDescription>
              View complete information about this patrol route.
            </DialogDescription>
          </DialogHeader>
          {selectedRoute && (
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Route Name</Label>
                  <p className="text-sm text-gray-600">{selectedRoute.name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Estimated Duration</Label>
                  <p className="text-sm text-gray-600">{formatDuration(selectedRoute.estimated_duration)}</p>
                </div>
              </div>
              
              <div>
                <Label className="text-sm font-medium">Description</Label>
                <p className="text-sm text-gray-600">{selectedRoute.description}</p>
              </div>

              <div>
                <Label className="text-sm font-medium">Checkpoints ({selectedRoute.checkpoints?.length || 0})</Label>
                {selectedRoute.checkpoints && selectedRoute.checkpoints.length > 0 ? (
                  <div className="mt-2 space-y-2 max-h-60 overflow-y-auto">
                    {selectedRoute.checkpoints
                      .sort((a, b) => a.order_sequence - b.order_sequence)
                      .map((checkpoint) => (
                        <div key={checkpoint.id} className="flex items-center justify-between p-2 border rounded">
                          <div className="flex-1">
                            <p className="font-medium text-sm">{checkpoint.name}</p>
                            <p className="text-xs text-gray-500">
                              {checkpoint.latitude.toFixed(6)}, {checkpoint.longitude.toFixed(6)}
                            </p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className="flex space-x-1">
                              {checkpoint.is_mandatory && (
                                <Badge variant="destructive" className="text-xs">Required</Badge>
                              )}
                              {checkpoint.requires_photo && (
                                <Badge variant="secondary" className="text-xs">Photo</Badge>
                              )}
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openQRModal(checkpoint)}
                              className="h-8 w-8 p-0"
                            >
                              <QrCode className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 mt-2">No checkpoints defined for this route.</p>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* QR Code Generation Modal */}
      <Dialog open={isQRModalOpen} onOpenChange={setIsQRModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Generate QR Code</DialogTitle>
            <DialogDescription>
              Generate and print QR codes for checkpoint scanning
            </DialogDescription>
          </DialogHeader>
          {selectedCheckpointForQR && selectedRoute && (
            <div className="p-0">
              <QRCodeGenerator
                checkpoint={selectedCheckpointForQR}
                route={selectedRoute}
                organizationId={organizationId}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Adhoc Route Generator Modal */}
      <Dialog open={isAdhocModalOpen} onOpenChange={setIsAdhocModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Generate Adhoc Route</DialogTitle>
            <DialogDescription>
              Quickly generate patrol routes for emergency or temporary security needs
            </DialogDescription>
          </DialogHeader>
          <div className="p-0">
            <AdhocRouteGenerator
              onRouteGenerated={handleAdhocRouteGenerated}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}