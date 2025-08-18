'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GoogleMap, useLoadScript, Marker, InfoWindow, Circle, Polyline } from '@react-google-maps/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  MapPin, 
  Shield, 
  AlertTriangle, 
  Users, 
  Battery,
  Clock,
  Navigation,
  RefreshCw
} from 'lucide-react';

// Google Maps configuration
const libraries: ('places' | 'geometry' | 'drawing')[] = ['places', 'geometry'];

const mapContainerStyle = {
  width: '100%',
  height: '600px',
};

// Default center (Johannesburg, South Africa)
const defaultCenter = {
  lat: -26.2041,
  lng: 28.0473,
};

// Custom map styles for security operations
const securityMapStyles = [
  {
    featureType: 'poi',
    elementType: 'labels',
    stylers: [{ visibility: 'off' }],
  },
  {
    featureType: 'transit',
    elementType: 'labels',
    stylers: [{ visibility: 'off' }],
  },
  {
    featureType: 'road',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#4a5568' }],
  },
  {
    featureType: 'water',
    elementType: 'geometry.fill',
    stylers: [{ color: '#bee3f8' }],
  },
  {
    featureType: 'landscape',
    elementType: 'geometry.fill',
    stylers: [{ color: '#f7fafc' }],
  },
];

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

interface SecurityMapProps {
  guardLocations: GuardLocation[];
  patrolRoutes: PatrolRoute[];
  incidents: SecurityIncident[];
  onGuardClick?: (guard: GuardLocation) => void;
  onIncidentClick?: (incident: SecurityIncident) => void;
  showRoutes?: boolean;
  showIncidents?: boolean;
  selectedRouteFilter?: string;
  autoCenter?: boolean;
  className?: string;
}

export default function SecurityMap({
  guardLocations = [],
  patrolRoutes = [],
  incidents = [],
  onGuardClick,
  onIncidentClick,
  showRoutes = true,
  showIncidents = true,
  selectedRouteFilter = 'all',
  autoCenter = false,
  className = '',
}: SecurityMapProps) {
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    libraries,
  });

  const [selectedGuard, setSelectedGuard] = useState<GuardLocation | null>(null);
  const [selectedIncident, setSelectedIncident] = useState<SecurityIncident | null>(null);
  const [mapCenter, setMapCenter] = useState(defaultCenter);
  const [mapZoom, setMapZoom] = useState(12);
  
  const mapRef = useRef<google.maps.Map>();

  // Filter guards by selected route
  const filteredGuards = selectedRouteFilter === 'all' 
    ? guardLocations 
    : guardLocations.filter(guard => guard.route_name === selectedRouteFilter);

  // Auto-center map on guards
  useEffect(() => {
    if (autoCenter && filteredGuards.length > 0) {
      const bounds = new google.maps.LatLngBounds();
      filteredGuards.forEach(guard => {
        bounds.extend(new google.maps.LatLng(guard.latitude, guard.longitude));
      });
      
      if (mapRef.current) {
        mapRef.current.fitBounds(bounds);
      }
    }
  }, [filteredGuards, autoCenter]);

  const onMapLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
  }, []);

  const handleGuardClick = (guard: GuardLocation) => {
    setSelectedGuard(guard);
    setSelectedIncident(null);
    onGuardClick?.(guard);
  };

  const handleIncidentClick = (incident: SecurityIncident) => {
    setSelectedIncident(incident);
    setSelectedGuard(null);
    onIncidentClick?.(incident);
  };

  const getGuardMarkerIcon = (guard: GuardLocation) => {
    let fillColor = '#6b7280'; // Default gray
    
    if (guard.panic_button_pressed) {
      fillColor = '#dc2626'; // Red for panic
    } else if (guard.status === 'active') {
      fillColor = '#10b981'; // Green for active
    } else if (guard.status === 'paused') {
      fillColor = '#f59e0b'; // Yellow for paused
    } else if (guard.status === 'completed') {
      fillColor = '#3b82f6'; // Blue for completed
    }

    return {
      path: google.maps.SymbolPath.CIRCLE,
      fillColor,
      fillOpacity: 0.9,
      strokeColor: '#ffffff',
      strokeWeight: 3,
      scale: guard.panic_button_pressed ? 12 : 10,
    };
  };

  const getIncidentMarkerIcon = (incident: SecurityIncident) => {
    const severityColors = {
      low: '#10b981',
      medium: '#f59e0b', 
      high: '#f97316',
      critical: '#dc2626',
    };

    return {
      path: google.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
      fillColor: severityColors[incident.severity],
      fillOpacity: 0.9,
      strokeColor: '#ffffff',
      strokeWeight: 2,
      scale: incident.severity === 'critical' ? 10 : 8,
      rotation: 180,
    };
  };

  const formatTimeSince = (timestamp: string) => {
    const now = new Date();
    const updateTime = new Date(timestamp);
    const diffMs = now.getTime() - updateTime.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h ago`;
    return `${Math.floor(diffMinutes / 1440)}d ago`;
  };

  const getBatteryIcon = (level?: number) => {
    if (!level) return null;
    if (level > 50) return '🔋';
    if (level > 20) return '🪫';
    return '🔴';
  };

  if (loadError) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center h-96">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-red-500" />
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
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p>Loading Security Map...</p>
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
            <Shield className="h-5 w-5 mr-2" />
            Security Operations Map
          </CardTitle>
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <span className="flex items-center">
              <div className="w-3 h-3 bg-green-500 rounded-full mr-1"></div>
              Active ({filteredGuards.filter(g => g.status === 'active').length})
            </span>
            <span className="flex items-center">
              <div className="w-3 h-3 bg-yellow-500 rounded-full mr-1"></div>
              Paused ({filteredGuards.filter(g => g.status === 'paused').length})
            </span>
            {incidents.length > 0 && (
              <span className="flex items-center">
                <AlertTriangle className="w-3 h-3 text-orange-500 mr-1" />
                Incidents ({incidents.length})
              </span>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          zoom={mapZoom}
          center={mapCenter}
          onLoad={onMapLoad}
          options={{
            styles: securityMapStyles,
            mapTypeControl: true,
            streetViewControl: false,
            fullscreenControl: true,
            zoomControl: true,
            mapTypeControlOptions: {
              style: google.maps.MapTypeControlStyle.COMPACT,
            },
          }}
        >
          {/* Guard Markers */}
          {filteredGuards.map((guard) => (
            <Marker
              key={`guard-${guard.guard_id}`}
              position={{ lat: guard.latitude, lng: guard.longitude }}
              onClick={() => handleGuardClick(guard)}
              icon={getGuardMarkerIcon(guard)}
              title={`${guard.guard_name} - ${guard.status}`}
            />
          ))}

          {/* Patrol Route Checkpoints */}
          {showRoutes && patrolRoutes.map((route) => 
            route.checkpoints.map((checkpoint) => (
              <React.Fragment key={`checkpoint-${checkpoint.id}`}>
                <Marker
                  position={{ lat: checkpoint.latitude, lng: checkpoint.longitude }}
                  icon={{
                    path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
                    fillColor: route.color_code,
                    fillOpacity: 0.7,
                    strokeColor: '#ffffff',
                    strokeWeight: 2,
                    scale: 6,
                    rotation: 0,
                  }}
                  title={`${checkpoint.name} (${route.name})`}
                />
                <Circle
                  center={{ lat: checkpoint.latitude, lng: checkpoint.longitude }}
                  radius={checkpoint.radius_meters}
                  options={{
                    fillColor: route.color_code,
                    fillOpacity: 0.1,
                    strokeColor: route.color_code,
                    strokeOpacity: 0.4,
                    strokeWeight: 2,
                  }}
                />
              </React.Fragment>
            ))
          )}

          {/* Route Boundaries */}
          {showRoutes && patrolRoutes.map((route) => 
            route.boundary_coords && route.boundary_coords.length > 0 && (
              <Polyline
                key={`boundary-${route.id}`}
                path={route.boundary_coords}
                options={{
                  strokeColor: route.color_code,
                  strokeOpacity: 0.6,
                  strokeWeight: 3,
                  geodesic: true,
                }}
              />
            )
          )}

          {/* Incident Markers */}
          {showIncidents && incidents.map((incident) => (
            <Marker
              key={`incident-${incident.id}`}
              position={{ lat: incident.latitude, lng: incident.longitude }}
              onClick={() => handleIncidentClick(incident)}
              icon={getIncidentMarkerIcon(incident)}
              title={`${incident.title} - ${incident.severity.toUpperCase()}`}
            />
          ))}

          {/* Guard Info Window */}
          {selectedGuard && (
            <InfoWindow
              position={{ lat: selectedGuard.latitude, lng: selectedGuard.longitude }}
              onCloseClick={() => setSelectedGuard(null)}
              options={{
                pixelOffset: new google.maps.Size(0, -10),
              }}
            >
              <div className="p-3 min-w-[250px]">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-lg">{selectedGuard.guard_name}</h3>
                  {selectedGuard.panic_button_pressed && (
                    <Badge className="bg-red-100 text-red-800">EMERGENCY</Badge>
                  )}
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex items-center">
                    <Navigation className="h-4 w-4 mr-2 text-gray-500" />
                    <span>{selectedGuard.route_name}</span>
                  </div>
                  
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 mr-2 text-gray-500" />
                    <span>{selectedGuard.checkpoints_completed}/{selectedGuard.checkpoints_total} checkpoints</span>
                  </div>
                  
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-2 text-gray-500" />
                    <span>{formatTimeSince(selectedGuard.last_update)}</span>
                  </div>
                  
                  {selectedGuard.battery_level && (
                    <div className="flex items-center">
                      <Battery className="h-4 w-4 mr-2 text-gray-500" />
                      <span>{selectedGuard.battery_level}% {getBatteryIcon(selectedGuard.battery_level)}</span>
                    </div>
                  )}
                  
                  <div className="pt-2">
                    <Badge 
                      className={
                        selectedGuard.status === 'active' ? 'bg-green-100 text-green-800' :
                        selectedGuard.status === 'paused' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-blue-100 text-blue-800'
                      }
                    >
                      {selectedGuard.status.toUpperCase()}
                    </Badge>
                  </div>
                </div>
              </div>
            </InfoWindow>
          )}

          {/* Incident Info Window */}
          {selectedIncident && (
            <InfoWindow
              position={{ lat: selectedIncident.latitude, lng: selectedIncident.longitude }}
              onCloseClick={() => setSelectedIncident(null)}
              options={{
                pixelOffset: new google.maps.Size(0, -10),
              }}
            >
              <div className="p-3 min-w-[250px]">
                <h3 className="font-semibold text-lg mb-2">{selectedIncident.title}</h3>
                
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Category:</span>
                    <span className="capitalize">{selectedIncident.category.replace('_', ' ')}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Reported by:</span>
                    <span>{selectedIncident.guard_name}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Time:</span>
                    <span>{formatTimeSince(selectedIncident.created_at)}</span>
                  </div>
                  
                  <div className="pt-2 flex space-x-2">
                    <Badge 
                      className={
                        selectedIncident.severity === 'critical' ? 'bg-red-100 text-red-800' :
                        selectedIncident.severity === 'high' ? 'bg-orange-100 text-orange-800' :
                        selectedIncident.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }
                    >
                      {selectedIncident.severity.toUpperCase()}
                    </Badge>
                    <Badge variant="outline" className="capitalize">
                      {selectedIncident.status}
                    </Badge>
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