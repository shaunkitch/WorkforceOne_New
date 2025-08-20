'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GoogleMap, useLoadScript, Marker, InfoWindow, Circle, Polygon, DrawingManager } from '@react-google-maps/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  MapPin, 
  Plus, 
  Edit, 
  Trash2, 
  Save,
  X,
  Target,
  Route as RouteIcon,
  AlertCircle
} from 'lucide-react';

// Google Maps configuration for route management
const libraries: ('places' | 'geometry' | 'drawing')[] = ['places', 'geometry', 'drawing'];

const mapContainerStyle = {
  width: '100%',
  height: '600px',
};

const defaultCenter = {
  lat: -26.2041,
  lng: 28.0473,
};

interface Checkpoint {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  radius_meters: number;
  order_sequence: number;
  is_mandatory: boolean;
  requires_photo: boolean;
}

interface PatrolRoute {
  id: string;
  name: string;
  description: string;
  color_code: string;
  checkpoints: Checkpoint[];
  boundary_coords?: Array<{ lat: number; lng: number }>;
}

interface RouteManagementMapProps {
  route?: PatrolRoute;
  editMode?: boolean;
  onRouteUpdate?: (route: Partial<PatrolRoute>) => void;
  onCheckpointAdd?: (checkpoint: Omit<Checkpoint, 'id' | 'order_sequence'>) => void;
  onCheckpointUpdate?: (checkpointId: string, updates: Partial<Checkpoint>) => void;
  onCheckpointDelete?: (checkpointId: string) => void;
  className?: string;
}

export default function RouteManagementMap({
  route,
  editMode = false,
  onRouteUpdate,
  onCheckpointAdd,
  onCheckpointUpdate,
  onCheckpointDelete,
  className = '',
}: RouteManagementMapProps) {
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    libraries,
  });

  const [selectedCheckpoint, setSelectedCheckpoint] = useState<Checkpoint | null>(null);
  const [isAddingCheckpoint, setIsAddingCheckpoint] = useState(false);
  const [newCheckpoint, setNewCheckpoint] = useState<Partial<Checkpoint>>({});
  const [mapCenter, setMapCenter] = useState(defaultCenter);
  const [drawingMode, setDrawingMode] = useState<'checkpoint' | 'boundary' | null>(null);

  const mapRef = useRef<google.maps.Map>();
  const drawingManagerRef = useRef<google.maps.drawing.DrawingManager>();

  // Center map on route checkpoints when route loads
  useEffect(() => {
    if (route && route.checkpoints.length > 0 && mapRef.current) {
      const bounds = new google.maps.LatLngBounds();
      route.checkpoints.forEach(checkpoint => {
        bounds.extend(new google.maps.LatLng(checkpoint.latitude, checkpoint.longitude));
      });
      mapRef.current.fitBounds(bounds);
    }
  }, [route]);

  const onMapLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
  }, []);

  const onDrawingManagerLoad = useCallback((drawingManager: google.maps.drawing.DrawingManager) => {
    drawingManagerRef.current = drawingManager;
  }, []);

  const handleMapClick = useCallback((event: google.maps.MapMouseEvent) => {
    if (!editMode || !drawingMode) return;

    const lat = event.latLng?.lat();
    const lng = event.latLng?.lng();

    if (!lat || !lng) return;

    if (drawingMode === 'checkpoint') {
      setNewCheckpoint({
        name: `Checkpoint ${(route?.checkpoints.length || 0) + 1}`,
        latitude: lat,
        longitude: lng,
        radius_meters: 50,
        is_mandatory: true,
        requires_photo: false,
      });
      setIsAddingCheckpoint(true);
      setDrawingMode(null);
    }
  }, [editMode, drawingMode, route]);

  const handleCheckpointClick = (checkpoint: Checkpoint) => {
    setSelectedCheckpoint(checkpoint);
    setIsAddingCheckpoint(false);
  };

  const handleAddCheckpoint = () => {
    if (newCheckpoint.name && newCheckpoint.latitude && newCheckpoint.longitude) {
      onCheckpointAdd?.(newCheckpoint as Omit<Checkpoint, 'id' | 'order_sequence'>);
      setNewCheckpoint({});
      setIsAddingCheckpoint(false);
    }
  };

  const handleUpdateCheckpoint = (updates: Partial<Checkpoint>) => {
    if (selectedCheckpoint) {
      onCheckpointUpdate?.(selectedCheckpoint.id, updates);
      setSelectedCheckpoint({ ...selectedCheckpoint, ...updates });
    }
  };

  const handleDeleteCheckpoint = () => {
    if (selectedCheckpoint) {
      onCheckpointDelete?.(selectedCheckpoint.id);
      setSelectedCheckpoint(null);
    }
  };

  const getCheckpointIcon = (checkpoint: Checkpoint) => ({
    path: google.maps.SymbolPath.CIRCLE,
    fillColor: checkpoint.is_mandatory ? '#dc2626' : '#3b82f6',
    fillOpacity: 0.8,
    strokeColor: '#ffffff',
    strokeWeight: 2,
    scale: 8,
  });

  const startDrawingCheckpoints = () => {
    setDrawingMode('checkpoint');
    setSelectedCheckpoint(null);
    setIsAddingCheckpoint(false);
  };

  const startDrawingBoundary = () => {
    setDrawingMode('boundary');
    setSelectedCheckpoint(null);
    setIsAddingCheckpoint(false);
    
    if (drawingManagerRef.current) {
      drawingManagerRef.current.setDrawingMode(google.maps.drawing.OverlayType.POLYGON);
    }
  };

  const stopDrawing = () => {
    setDrawingMode(null);
    if (drawingManagerRef.current) {
      drawingManagerRef.current.setDrawingMode(null);
    }
  };

  if (loadError) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center h-96">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-500" />
            <h3 className="text-lg font-semibold mb-2">Map Loading Error</h3>
            <p className="text-gray-600">Failed to load Google Maps. Please check your API key.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!isLoaded) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
            <p>Loading Route Management Map...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center">
            <RouteIcon className="h-5 w-5 mr-2" />
            Route Management {route && `- ${route.name}`}
          </CardTitle>
          
          {editMode && (
            <div className="flex items-center space-x-2">
              <Button
                variant={drawingMode === 'checkpoint' ? 'default' : 'outline'}
                size="sm"
                onClick={drawingMode === 'checkpoint' ? stopDrawing : startDrawingCheckpoints}
              >
                <Target className="h-4 w-4 mr-1" />
                {drawingMode === 'checkpoint' ? 'Stop' : 'Add Checkpoints'}
              </Button>
              
              <Button
                variant={drawingMode === 'boundary' ? 'default' : 'outline'}
                size="sm"
                onClick={drawingMode === 'boundary' ? stopDrawing : startDrawingBoundary}
              >
                <MapPin className="h-4 w-4 mr-1" />
                {drawingMode === 'boundary' ? 'Stop' : 'Draw Boundary'}
              </Button>
            </div>
          )}
        </div>
        
        {drawingMode === 'checkpoint' && (
          <div className="text-sm text-blue-600 bg-blue-50 p-2 rounded">
            Click on the map to add checkpoints to your route
          </div>
        )}
        
        {drawingMode === 'boundary' && (
          <div className="text-sm text-green-600 bg-green-50 p-2 rounded">
            Use the drawing tools to define the patrol boundary area
          </div>
        )}
      </CardHeader>
      
      <CardContent className="p-0">
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          zoom={15}
          center={mapCenter}
          onLoad={onMapLoad}
          onClick={handleMapClick}
          options={{
            mapTypeControl: true,
            streetViewControl: false,
            fullscreenControl: true,
            zoomControl: true,
          }}
        >
          {editMode && (
            <DrawingManager
              onLoad={onDrawingManagerLoad}
              options={{
                drawingControl: drawingMode === 'boundary',
                drawingControlOptions: {
                  position: google.maps.ControlPosition.TOP_CENTER,
                  drawingModes: [google.maps.drawing.OverlayType.POLYGON],
                },
                polygonOptions: {
                  fillColor: route?.color_code || '#3b82f6',
                  fillOpacity: 0.2,
                  strokeColor: route?.color_code || '#3b82f6',
                  strokeOpacity: 0.8,
                  strokeWeight: 2,
                  clickable: false,
                  editable: true,
                  zIndex: 1,
                },
              }}
              onPolygonComplete={(polygon) => {
                const path = polygon.getPath().getArray().map(point => ({
                  lat: point.lat(),
                  lng: point.lng(),
                }));
                
                onRouteUpdate?.({ boundary_coords: path });
                polygon.setMap(null);
                setDrawingMode(null);
              }}
            />
          )}

          {/* Existing Checkpoints */}
          {route?.checkpoints.map((checkpoint) => (
            <React.Fragment key={checkpoint.id}>
              <Marker
                position={{ lat: checkpoint.latitude, lng: checkpoint.longitude }}
                onClick={() => handleCheckpointClick(checkpoint)}
                icon={getCheckpointIcon(checkpoint)}
                label={{
                  text: checkpoint.order_sequence.toString(),
                  color: 'white',
                  fontWeight: 'bold',
                }}
              />
              <Circle
                center={{ lat: checkpoint.latitude, lng: checkpoint.longitude }}
                radius={checkpoint.radius_meters}
                options={{
                  fillColor: checkpoint.is_mandatory ? '#dc2626' : '#3b82f6',
                  fillOpacity: 0.1,
                  strokeColor: checkpoint.is_mandatory ? '#dc2626' : '#3b82f6',
                  strokeOpacity: 0.4,
                  strokeWeight: 2,
                }}
              />
            </React.Fragment>
          ))}

          {/* Route Boundary */}
          {route?.boundary_coords && route.boundary_coords.length > 0 && (
            <Polygon
              paths={route.boundary_coords}
              options={{
                fillColor: route.color_code,
                fillOpacity: 0.2,
                strokeColor: route.color_code,
                strokeOpacity: 0.6,
                strokeWeight: 2,
              }}
            />
          )}

          {/* New Checkpoint Marker */}
          {isAddingCheckpoint && newCheckpoint.latitude && newCheckpoint.longitude && (
            <Marker
              position={{ lat: newCheckpoint.latitude, lng: newCheckpoint.longitude }}
              icon={{
                path: google.maps.SymbolPath.CIRCLE,
                fillColor: '#10b981',
                fillOpacity: 0.8,
                strokeColor: '#ffffff',
                strokeWeight: 2,
                scale: 10,
              }}
            />
          )}

          {/* Checkpoint Info Window */}
          {selectedCheckpoint && (
            <InfoWindow
              position={{ lat: selectedCheckpoint.latitude, lng: selectedCheckpoint.longitude }}
              onCloseClick={() => setSelectedCheckpoint(null)}
            >
              <div className="p-3 min-w-[300px]">
                <h3 className="font-semibold text-lg mb-3">{selectedCheckpoint.name}</h3>
                
                {editMode ? (
                  <div className="space-y-3">
                    <div>
                      <Label>Checkpoint Name</Label>
                      <Input
                        value={selectedCheckpoint.name}
                        onChange={(e) => handleUpdateCheckpoint({ name: e.target.value })}
                        className="mt-1"
                      />
                    </div>
                    
                    <div>
                      <Label>Radius (meters)</Label>
                      <Input
                        type="number"
                        value={selectedCheckpoint.radius_meters}
                        onChange={(e) => handleUpdateCheckpoint({ radius_meters: parseInt(e.target.value) })}
                        className="mt-1"
                      />
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={selectedCheckpoint.is_mandatory}
                          onChange={(e) => handleUpdateCheckpoint({ is_mandatory: e.target.checked })}
                          className="mr-2"
                        />
                        Mandatory
                      </label>
                      
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={selectedCheckpoint.requires_photo}
                          onChange={(e) => handleUpdateCheckpoint({ requires_photo: e.target.checked })}
                          className="mr-2"
                        />
                        Requires Photo
                      </label>
                    </div>
                    
                    <div className="flex space-x-2 pt-2">
                      <Button size="sm" onClick={() => setSelectedCheckpoint(null)}>
                        <Save className="h-4 w-4 mr-1" />
                        Save
                      </Button>
                      <Button size="sm" variant="destructive" onClick={handleDeleteCheckpoint}>
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Order:</span>
                      <span>#{selectedCheckpoint.order_sequence}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Radius:</span>
                      <span>{selectedCheckpoint.radius_meters}m</span>
                    </div>
                    <div className="flex space-x-2">
                      {selectedCheckpoint.is_mandatory && (
                        <Badge className="bg-red-100 text-red-800">Mandatory</Badge>
                      )}
                      {selectedCheckpoint.requires_photo && (
                        <Badge className="bg-blue-100 text-blue-800">Photo Required</Badge>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </InfoWindow>
          )}

          {/* New Checkpoint Form */}
          {isAddingCheckpoint && (
            <InfoWindow
              position={{ lat: newCheckpoint.latitude!, lng: newCheckpoint.longitude! }}
              onCloseClick={() => setIsAddingCheckpoint(false)}
            >
              <div className="p-3 min-w-[300px]">
                <h3 className="font-semibold text-lg mb-3">Add New Checkpoint</h3>
                
                <div className="space-y-3">
                  <div>
                    <Label>Checkpoint Name</Label>
                    <Input
                      value={newCheckpoint.name || ''}
                      onChange={(e) => setNewCheckpoint({ ...newCheckpoint, name: e.target.value })}
                      placeholder="e.g., Main Entrance"
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label>Radius (meters)</Label>
                    <Input
                      type="number"
                      value={newCheckpoint.radius_meters || 50}
                      onChange={(e) => setNewCheckpoint({ ...newCheckpoint, radius_meters: parseInt(e.target.value) })}
                      className="mt-1"
                    />
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={newCheckpoint.is_mandatory || false}
                        onChange={(e) => setNewCheckpoint({ ...newCheckpoint, is_mandatory: e.target.checked })}
                        className="mr-2"
                      />
                      Mandatory
                    </label>
                    
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={newCheckpoint.requires_photo || false}
                        onChange={(e) => setNewCheckpoint({ ...newCheckpoint, requires_photo: e.target.checked })}
                        className="mr-2"
                      />
                      Requires Photo
                    </label>
                  </div>
                  
                  <div className="flex space-x-2 pt-2">
                    <Button size="sm" onClick={handleAddCheckpoint}>
                      <Plus className="h-4 w-4 mr-1" />
                      Add Checkpoint
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setIsAddingCheckpoint(false)}>
                      <X className="h-4 w-4 mr-1" />
                      Cancel
                    </Button>
                  </div>
                </div>
              </div>
            </InfoWindow>
          )}
        </GoogleMap>
      </CardContent>
    </Card>
  );
}