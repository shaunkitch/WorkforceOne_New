'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import simpleGoogleMapsService from '@/lib/google-maps-simple'

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
}

export default function GoogleMapComponent({
  center,
  zoom,
  markers,
  className = '',
  style = { width: '100%', height: '400px' },
  onMapLoad,
  onMarkerClick
}: GoogleMapComponentProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<google.maps.Map | null>(null)
  const markersRef = useRef<google.maps.Marker[]>([])
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Cleanup function to run when component unmounts
  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        // The Google Maps library can sometimes throw errors during cleanup
        // depending on its internal state. We can wrap this in a try/catch.
        try {
          // Clear all event listeners on the map
          google.maps.event.clearInstanceListeners(mapInstanceRef.current)
        } catch (e) {
          console.error('Error clearing map instance listeners:', e)
        }
        mapInstanceRef.current = null
      }
    }
  }, [])

  const initializeMap = useCallback(async (mapContainer: HTMLDivElement) => {
    console.log('Initializing Google Map component...')
    try {
      setIsLoading(true)
      setError(null)
      
      await simpleGoogleMapsService.loadGoogleMaps()
      console.log('Google Maps API loaded, creating map...')

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
      console.log('Map created successfully')

      const infoWindow = await simpleGoogleMapsService.createInfoWindow()
      infoWindowRef.current = infoWindow
      console.log('Info window created')

      onMapLoad?.(map)
      setIsLoading(false)
      console.log('Map initialization complete')
    } catch (err) {
      console.error('Failed to initialize Google Maps:', err)
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(`Failed to load Google Maps: ${errorMessage}`)
      setIsLoading(false)
    }
  }, [center, zoom, onMapLoad])

  // Initialize map
  useEffect(() => {
    if (mapContainerRef.current && !mapInstanceRef.current) {
      initializeMap(mapContainerRef.current)
    }
  }, [initializeMap])

  const updateMarkers = useCallback(async () => {
    if (!mapInstanceRef.current || !infoWindowRef.current) return

    try {
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

  // Update markers, center, and zoom
  useEffect(() => {
    if (mapInstanceRef.current) {
      updateMarkers()
      mapInstanceRef.current.setCenter(center)
      mapInstanceRef.current.setZoom(zoom)
    }
  }, [markers, center, zoom, updateMarkers])

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
