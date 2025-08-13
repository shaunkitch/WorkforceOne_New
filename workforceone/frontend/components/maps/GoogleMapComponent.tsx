'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import simpleGoogleMapsService from '@/lib/google-maps-simple'
import { OptimizedRoute } from '@/lib/routeOptimization'

interface MapMarker {
  id: string
  position: { lat: number; lng: number }
  title: string
  icon?: {
    color: string
    scale?: number
  }
  infoContent?: string
  onClick?: () => void
}

interface GoogleMapComponentProps {
  center: { lat: number; lng: number }
  zoom: number
  markers: MapMarker[]
  className?: string
  style?: React.CSSProperties
  onMapLoad?: (map: google.maps.Map) => void
  onMarkerClick?: (marker: MapMarker) => void
  optimizedRoute?: OptimizedRoute
  showRoutePolyline?: boolean
}

export default function GoogleMapComponent({
  center,
  zoom,
  markers,
  className = '',
  style = { width: '100%', height: '400px' },
  onMapLoad,
  onMarkerClick,
  optimizedRoute,
  showRoutePolyline = false
}: GoogleMapComponentProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<google.maps.Map | null>(null)
  const markersRef = useRef<google.maps.Marker[]>([])
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null)
  const directionsRendererRef = useRef<google.maps.DirectionsRenderer | null>(null)
  const polylineRef = useRef<google.maps.Polyline | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Cleanup function to run when component unmounts
  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        try {
          google.maps.event.clearInstanceListeners(mapInstanceRef.current)
        } catch (e) {
          console.error('Error clearing map instance listeners:', e)
        }
        mapInstanceRef.current = null
      }
      
      // Clean up directions renderer
      if (directionsRendererRef.current) {
        directionsRendererRef.current.setMap(null)
        directionsRendererRef.current = null
      }
      
      // Clean up polyline
      if (polylineRef.current) {
        polylineRef.current.setMap(null)
        polylineRef.current = null
      }
    }
  }, [])

  const initializeMap = useCallback(async (mapContainer: HTMLDivElement) => {
    try {
      setIsLoading(true)
      setError(null)
      
      await simpleGoogleMapsService.loadGoogleMaps()
      const map = await simpleGoogleMapsService.createMap(mapContainer, {
        center,
        zoom,
        styles: [
          { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] }
        ],
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: true,
        zoomControl: true,
      })

      mapInstanceRef.current = map
      console.log('Map instance set, ready for markers')
      
      const infoWindow = await simpleGoogleMapsService.createInfoWindow()
      infoWindowRef.current = infoWindow
      console.log('InfoWindow created, map fully ready')

      onMapLoad?.(map)
      setIsLoading(false)
      
      // Trigger marker update now that map is ready
      setTimeout(() => {
        if (markers.length > 0) {
          console.log('Map ready, updating markers with', markers.length, 'markers')
          // Call updateMarkers directly without depending on the callback
          if (mapInstanceRef.current && infoWindowRef.current) {
            console.log('Updating markers directly after map initialization')
            // Clear existing markers
            markersRef.current.forEach(marker => marker.setMap(null))
            markersRef.current = []

            // Add new markers
            markers.forEach(async (markerData) => {
              const marker = await simpleGoogleMapsService.createMarker({
                position: markerData.position,
                map: mapInstanceRef.current,
                title: markerData.title,
                icon: markerData.icon ? {
                  path: google.maps.SymbolPath.CIRCLE,
                  scale: markerData.icon.scale || 12,
                  fillColor: markerData.icon.color,
                  fillOpacity: 0.8,
                  strokeColor: '#ffffff',
                  strokeWeight: 2,
                } : undefined
              })

              marker.addListener('click', () => {
                if (markerData.infoContent && infoWindowRef.current) {
                  infoWindowRef.current.setContent(markerData.infoContent)
                  infoWindowRef.current.open(mapInstanceRef.current, marker)
                }
                markerData.onClick?.()
                onMarkerClick?.(markerData)
              })

              markersRef.current.push(marker)
            })
          }
        }
        
        // Route display will be handled by the separate useEffect
      }, 100)
    } catch (err) {
      console.error('Failed to initialize Google Maps:', err)
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(`Failed to load Google Maps: ${errorMessage}`)
      setIsLoading(false)
    }
  }, [center, zoom, onMapLoad, markers, optimizedRoute, showRoutePolyline, onMarkerClick])

  // Initialize map
  useEffect(() => {
    if (mapContainerRef.current && !mapInstanceRef.current) {
      initializeMap(mapContainerRef.current)
    }
  }, [initializeMap])

  // This useEffect will be moved after displayRoute is defined

  const updateMarkers = useCallback(async () => {
    if (!mapInstanceRef.current || !infoWindowRef.current) {
      console.log('Map not ready for markers:', { 
        mapReady: !!mapInstanceRef.current, 
        infoWindowReady: !!infoWindowRef.current 
      })
      return
    }

    try {
      console.log('Updating markers, received', markers.length, 'markers')
      
      // Clear existing markers
      markersRef.current.forEach(marker => marker.setMap(null))
      markersRef.current = []

      for (const markerData of markers) {
        const marker = await simpleGoogleMapsService.createMarker({
          position: markerData.position,
          map: mapInstanceRef.current,
          title: markerData.title,
          icon: markerData.icon ? {
            path: google.maps.SymbolPath.CIRCLE,
            scale: markerData.icon.scale || 12,
            fillColor: markerData.icon.color,
            fillOpacity: 0.8,
            strokeColor: '#ffffff',
            strokeWeight: 2,
          } : undefined
        })

        marker.addListener('click', () => {
          if (markerData.infoContent && infoWindowRef.current) {
            infoWindowRef.current.setContent(markerData.infoContent)
            infoWindowRef.current.open(mapInstanceRef.current, marker)
          }
          markerData.onClick?.()
          onMarkerClick?.(markerData)
        })

        markersRef.current.push(marker)
      }

      if (markers.length > 1 && mapInstanceRef.current) {
        const bounds = new google.maps.LatLngBounds()
        markers.forEach(marker => bounds.extend(marker.position))
        mapInstanceRef.current.fitBounds(bounds)
        
        const listener = google.maps.event.addListener(mapInstanceRef.current, 'idle', () => {
          if (mapInstanceRef.current!.getZoom()! > 15) {
            mapInstanceRef.current!.setZoom(15)
          }
          google.maps.event.removeListener(listener)
        })
      } else if (markers.length === 1) {
        mapInstanceRef.current.setCenter(markers[0].position)
        mapInstanceRef.current.setZoom(15)
      }

    } catch (err) {
      console.error('Failed to update markers:', err)
    }
  }, [markers, onMarkerClick])

  // Function to display route polyline on map
  const displayRoute = useCallback(async () => {
    console.log('displayRoute called with:', {
      mapReady: !!mapInstanceRef.current,
      optimizedRoute: !!optimizedRoute,
      showRoutePolyline,
      routeStops: optimizedRoute?.stops?.length || 0
    })
    
    if (!mapInstanceRef.current || !optimizedRoute || !showRoutePolyline) {
      console.log('Route display conditions not met - skipping display')
      return
    }

    console.log('=== ROUTE VISUALIZATION DEBUG ===')
    console.log('Displaying route on map:', optimizedRoute)
    console.log('Route stops:', optimizedRoute.stops)
    console.log('Number of stops:', optimizedRoute.stops.length)
    console.log('Google Maps available:', typeof google !== 'undefined')
    console.log('Maps API key:', process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ? 'Present' : 'Missing')

    // If we have less than 2 stops, just center on the stops
    if (optimizedRoute.stops.length < 2) {
      console.log('Not enough stops for route display')
      return
    }

    try {
      // Clear existing route display
      if (directionsRendererRef.current) {
        directionsRendererRef.current.setMap(null)
        directionsRendererRef.current = null
      }
      if (polylineRef.current) {
        polylineRef.current.setMap(null)
        polylineRef.current = null
      }

      // Create directions service if not exists
      const directionsService = new google.maps.DirectionsService()
      
      // Prepare waypoints (exclude first and last stops)
      const waypoints: google.maps.DirectionsWaypoint[] = []
      for (let i = 1; i < optimizedRoute.stops.length - 1; i++) {
        waypoints.push({
          location: new google.maps.LatLng(
            optimizedRoute.stops[i].latitude,
            optimizedRoute.stops[i].longitude
          ),
          stopover: true
        })
      }

      const origin = optimizedRoute.stops[0]
      const destination = optimizedRoute.stops[optimizedRoute.stops.length - 1]

      // Get directions from Google Maps
      console.log('Making directions request:', {
        origin: `${origin.latitude}, ${origin.longitude}`,
        destination: `${destination.latitude}, ${destination.longitude}`,
        waypointsCount: waypoints.length
      })
      
      const result = await new Promise<google.maps.DirectionsResult>((resolve, reject) => {
        directionsService.route({
          origin: new google.maps.LatLng(origin.latitude, origin.longitude),
          destination: new google.maps.LatLng(destination.latitude, destination.longitude),
          waypoints: waypoints,
          optimizeWaypoints: false, // Don't re-optimize, use our order
          travelMode: google.maps.TravelMode.DRIVING,
          unitSystem: google.maps.UnitSystem.METRIC
        }, (result, status) => {
          console.log('Directions API response:', status, result)
          if (status === google.maps.DirectionsStatus.OK && result) {
            resolve(result)
          } else {
            console.error('Directions API error:', status)
            reject(new Error(`Directions request failed: ${status}`))
          }
        })
      })

      // Create and configure directions renderer
      const directionsRenderer = new google.maps.DirectionsRenderer({
        suppressMarkers: true, // We'll show our own markers
        polylineOptions: {
          strokeColor: '#2563eb', // Blue color
          strokeWeight: 4,
          strokeOpacity: 0.8,
          icons: [{
            icon: {
              path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
              scale: 3,
              fillColor: '#2563eb',
              fillOpacity: 0.8,
              strokeColor: '#ffffff',
              strokeWeight: 1
            },
            offset: '50px',
            repeat: '200px'
          }]
        }
      })

      directionsRenderer.setDirections(result)
      directionsRenderer.setMap(mapInstanceRef.current)
      directionsRendererRef.current = directionsRenderer

      // Fit map to show entire route
      const bounds = new google.maps.LatLngBounds()
      optimizedRoute.stops.forEach(stop => {
        bounds.extend(new google.maps.LatLng(stop.latitude, stop.longitude))
      })
      mapInstanceRef.current.fitBounds(bounds)

      console.log('Route displayed successfully with Directions API')
    } catch (err) {
      console.error('Failed to display route using Directions API:', err)
      console.log('Attempting fallback simple polyline...')
      
      // Fallback: Create simple polyline connecting stops
      try {
        console.log('Creating fallback polyline with stops:', optimizedRoute.stops)
        const path = optimizedRoute.stops.map(stop => 
          new google.maps.LatLng(stop.latitude, stop.longitude)
        )
        
        console.log('Polyline path created with', path.length, 'points')
        
        const polyline = new google.maps.Polyline({
          path: path,
          geodesic: true,
          strokeColor: '#2563eb',
          strokeOpacity: 0.8,
          strokeWeight: 6,
        })
        
        polyline.setMap(mapInstanceRef.current)
        polylineRef.current = polyline
        
        console.log('Fallback polyline set on map')
        
        // Fit map to show all points
        const bounds = new google.maps.LatLngBounds()
        path.forEach(point => bounds.extend(point))
        mapInstanceRef.current.fitBounds(bounds)
        
        console.log('Fallback polyline displayed successfully')
      } catch (fallbackErr) {
        console.error('Failed to display fallback polyline:', fallbackErr)
      }
    }
  }, [optimizedRoute, showRoutePolyline])

  // Separate effect to trigger route display when map becomes ready (after displayRoute is defined)
  useEffect(() => {
    if (mapInstanceRef.current && !isLoading && optimizedRoute && showRoutePolyline) {
      console.log('Map is ready and we have route data - triggering route display')
      setTimeout(() => {
        if (mapInstanceRef.current && optimizedRoute && showRoutePolyline) {
          console.log('Delayed route display call')
          displayRoute()
        }
      }, 300)
    }
  }, [isLoading, optimizedRoute, showRoutePolyline, displayRoute])

  // Update markers, center, and zoom
  useEffect(() => {
    console.log('GoogleMapComponent useEffect triggered', { 
      mapReady: !!mapInstanceRef.current, 
      markersCount: markers.length,
      center,
      zoom 
    })
    if (mapInstanceRef.current) {
      updateMarkers()
      mapInstanceRef.current.setCenter(center)
      mapInstanceRef.current.setZoom(zoom)
    }
  }, [markers, center, zoom, updateMarkers])

  // Update route display when route changes
  useEffect(() => {
    console.log('Route display useEffect triggered:', {
      mapReady: !!mapInstanceRef.current,
      showRoutePolyline,
      hasOptimizedRoute: !!optimizedRoute,
      routeStopsCount: optimizedRoute?.stops?.length || 0
    })
    
    if (mapInstanceRef.current && showRoutePolyline && optimizedRoute) {
      console.log('Calling displayRoute function...')
      displayRoute()
    } else {
      console.log('Clearing route display')
      // Clear route display when not showing
      if (directionsRendererRef.current) {
        directionsRendererRef.current.setMap(null)
        directionsRendererRef.current = null
      }
      if (polylineRef.current) {
        polylineRef.current.setMap(null)
        polylineRef.current = null
      }
    }
  }, [optimizedRoute, showRoutePolyline, displayRoute])

  return (
    <div className={`relative rounded-lg border ${className}`} style={style}>
      <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 bg-opacity-75 z-10">
          <div className="text-center text-gray-600">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <div>Loading Google Maps...</div>
          </div>
        </div>
      )}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-red-100 bg-opacity-75 z-10">
          <div className="text-center text-red-600">
            <div className="text-lg font-semibold mb-2">Map Error</div>
            <div>{error}</div>
          </div>
        </div>
      )}
    </div>
  )
}
