'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  Shuffle, 
  MapPin, 
  Clock, 
  Navigation,
  Plus,
  Target,
  RefreshCw
} from 'lucide-react';

interface AdhocCheckpoint {
  name: string;
  latitude: number;
  longitude: number;
  order_sequence: number;
  estimated_time: number; // minutes
}

interface AdhocNavigation {
  name: string;
  checkpoints: AdhocCheckpoint[];
  total_time: number;
  distance: number;
}

interface AdhocNavigationGeneratorProps {
  onRouteGenerated: (route: AdhocRoute) => void;
  className?: string;
}

// Predefined location patterns for common security scenarios
const ROUTE_PATTERNS = {
  perimeter: {
    name: 'Perimeter Patrol',
    description: 'Standard building perimeter check',
    checkpoints: [
      { name: 'Main Entrance', time: 5 },
      { name: 'East Side', time: 8 },
      { name: 'Back Entrance', time: 7 },
      { name: 'West Side', time: 8 },
      { name: 'Loading Dock', time: 6 },
      { name: 'Parking Area', time: 10 }
    ]
  },
  interior: {
    name: 'Interior Sweep',
    description: 'Internal building security check',
    checkpoints: [
      { name: 'Lobby', time: 3 },
      { name: 'Elevator Banks', time: 4 },
      { name: 'Stairwells', time: 12 },
      { name: 'Storage Areas', time: 8 },
      { name: 'Emergency Exits', time: 10 },
      { name: 'Parking Garage', time: 15 }
    ]
  },
  mixed: {
    name: 'Complete Security Round',
    description: 'Comprehensive interior and exterior check',
    checkpoints: [
      { name: 'Reception Desk', time: 3 },
      { name: 'Main Entrance', time: 5 },
      { name: 'Perimeter North', time: 12 },
      { name: 'Perimeter East', time: 10 },
      { name: 'Perimeter South', time: 12 },
      { name: 'Perimeter West', time: 10 },
      { name: 'Loading Area', time: 8 },
      { name: 'Parking Check', time: 15 }
    ]
  }
};

export default function AdhocNavigationGenerator({ 
  onRouteGenerated, 
  className = '' 
}: AdhocNavigationGeneratorProps) {
  const [selectedPattern, setSelectedPattern] = useState<string>('perimeter');
  const [centerLat, setCenterLat] = useState<number>(-26.2041);
  const [centerLng, setCenterLng] = useState<number>(28.0473);
  const [radius, setRadius] = useState<number>(200); // meters
  const [customName, setCustomName] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [generatedRoute, setGeneratedNavigation] = useState<AdhocNavigation | null>(null);

  // Generate random coordinates within radius
  const generateRandomCoordinate = (centerLat: number, centerLng: number, radiusMeters: number) => {
    // Convert radius to degrees (roughly)
    const radiusDegrees = radiusMeters / 111000; // 1 degree ≈ 111km
    
    const angle = Math.random() * 2 * Math.PI;
    const distance = Math.random() * radiusDegrees;
    
    const deltaLat = distance * Math.cos(angle);
    const deltaLng = distance * Math.sin(angle);
    
    return {
      lat: centerLat + deltaLat,
      lng: centerLng + deltaLng
    };
  };

  // Generate adhoc route based on selected pattern
  const generateAdhocNavigation = () => {
    setLoading(true);
    
    try {
      const pattern = ROUTE_PATTERNS[selectedPattern as keyof typeof ROUTE_PATTERNS];
      const routeName = customName || `${pattern.name} - ${new Date().toLocaleTimeString()}`;
      
      const checkpoints: AdhocCheckpoint[] = pattern.checkpoints.map((cp, index) => {
        const coord = generateRandomCoordinate(centerLat, centerLng, radius);
        
        return {
          name: cp.name,
          latitude: coord.lat,
          longitude: coord.lng,
          order_sequence: index + 1,
          estimated_time: cp.time
        };
      });
      
      const totalTime = checkpoints.reduce((sum, cp) => sum + cp.estimated_time, 0);
      const estimatedDistance = checkpoints.length * 0.1; // Rough estimate in km
      
      const route: AdhocNavigation = {
        name: routeName,
        checkpoints,
        total_time: totalTime,
        distance: estimatedDistance
      };
      
      setGeneratedNavigation(route);
    } catch (error) {
      console.error('Error generating route:', error);
    } finally {
      setLoading(false);
    }
  };

  // Get current location
  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCenterLat(position.coords.latitude);
          setCenterLng(position.coords.longitude);
        },
        (error) => {
          console.error('Error getting location:', error);
          alert('Could not get your current location. Using default coordinates.');
        }
      );
    } else {
      alert('Geolocation is not supported by this browser.');
    }
  };

  // Use the generated route
  const useGeneratedNavigation = () => {
    if (generatedRoute) {
      onRouteGenerated(generatedRoute);
      setGeneratedNavigation(null);
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Shuffle className="h-5 w-5 mr-2" />
          Adhoc Navigation Generator
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Navigation Pattern Selection */}
        <div className="space-y-2">
          <Label>Navigation Pattern</Label>
          <Select value={selectedPattern} onValueChange={setSelectedPattern}>
            <SelectTrigger>
              <SelectValue placeholder="Select route pattern" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(ROUTE_PATTERNS).map(([key, pattern]) => (
                <SelectItem key={key} value={key}>
                  {pattern.name} - {pattern.checkpoints.length} checkpoints
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-gray-600">
            {ROUTE_PATTERNS[selectedPattern as keyof typeof ROUTE_PATTERNS]?.description}
          </p>
        </div>

        {/* Custom Navigation Name */}
        <div className="space-y-2">
          <Label>Custom Navigation Name (Optional)</Label>
          <Input
            value={customName}
            onChange={(e) => setCustomName(e.target.value)}
            placeholder="Emergency Patrol Alpha"
          />
        </div>

        {/* Center Location */}
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-2">
            <Label>Center Latitude</Label>
            <Input
              type="number"
              step="0.000001"
              value={centerLat}
              onChange={(e) => setCenterLat(parseFloat(e.target.value))}
            />
          </div>
          <div className="space-y-2">
            <Label>Center Longitude</Label>
            <Input
              type="number"
              step="0.000001"
              value={centerLng}
              onChange={(e) => setCenterLng(parseFloat(e.target.value))}
            />
          </div>
        </div>

        {/* Radius and Location Button */}
        <div className="flex space-x-2">
          <div className="flex-1 space-y-2">
            <Label>Radius (meters)</Label>
            <Input
              type="number"
              value={radius}
              onChange={(e) => setRadius(parseInt(e.target.value))}
              min="50"
              max="2000"
            />
          </div>
          <div className="flex items-end">
            <Button
              variant="outline"
              onClick={getCurrentLocation}
              className="h-10"
            >
              <Target className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Generate Button */}
        <Button 
          onClick={generateAdhocNavigation} 
          disabled={loading}
          className="w-full"
        >
          {loading ? (
            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Shuffle className="h-4 w-4 mr-2" />
          )}
          Generate Adhoc Navigation
        </Button>

        {/* Generated Navigation Display */}
        {generatedRoute && (
          <div className="border rounded-lg p-4 bg-green-50">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold">{generatedRoute.name}</h4>
              <div className="flex space-x-2">
                <Badge variant="secondary">
                  <Clock className="h-3 w-3 mr-1" />
                  {generatedRoute.total_time}min
                </Badge>
                <Badge variant="secondary">
                  <Navigation className="h-3 w-3 mr-1" />
                  {generatedRoute.distance.toFixed(1)}km
                </Badge>
              </div>
            </div>
            
            <div className="space-y-2 mb-4">
              <div className="text-sm font-medium">Checkpoints:</div>
              <div className="max-h-32 overflow-y-auto">
                {generatedRoute.checkpoints.map((checkpoint) => (
                  <div key={checkpoint.order_sequence} className="flex items-center justify-between text-xs p-2 bg-white rounded border">
                    <div className="flex items-center">
                      <span className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs mr-2">
                        {checkpoint.order_sequence}
                      </span>
                      {checkpoint.name}
                    </div>
                    <div className="flex items-center space-x-1 text-gray-500">
                      <MapPin className="h-3 w-3" />
                      <span>{checkpoint.latitude.toFixed(4)}, {checkpoint.longitude.toFixed(4)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="flex space-x-2">
              <Button 
                onClick={useGeneratedNavigation}
                size="sm"
                className="flex-1"
              >
                <Plus className="h-4 w-4 mr-2" />
                Use This Navigation
              </Button>
              <Button 
                onClick={generateAdhocNavigation}
                variant="outline"
                size="sm"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}