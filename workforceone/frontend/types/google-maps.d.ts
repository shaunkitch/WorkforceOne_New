// Extend the global Window interface to include Google Maps
declare global {
  interface Window {
    google: typeof google;
  }
}

// Google Maps type definitions
declare namespace google.maps {
  interface Map {
    setCenter(latLng: LatLng | LatLngLiteral): void;
    setZoom(zoom: number): void;
    getZoom(): number | undefined;
    fitBounds(bounds: LatLngBounds | LatLngBoundsLiteral): void;
  }

  interface Marker {
    setMap(map: Map | null): void;
    addListener(eventName: string, handler: Function): void;
  }

  interface InfoWindow {
    setContent(content: string | Element): void;
    open(map?: Map, anchor?: Marker): void;
    close(): void;
  }

  interface LatLng {
    lat(): number;
    lng(): number;
  }

  interface LatLngLiteral {
    lat: number;
    lng: number;
  }

  interface LatLngBounds {
    extend(point: LatLng | LatLngLiteral): void;
  }

  interface LatLngBoundsLiteral {
    east: number;
    north: number;
    south: number;
    west: number;
  }

  const enum SymbolPath {
    CIRCLE = 0,
    FORWARD_CLOSED_ARROW = 1,
    FORWARD_OPEN_ARROW = 2,
    BACKWARD_CLOSED_ARROW = 3,
    BACKWARD_OPEN_ARROW = 4
  }

  interface MapOptions {
    center?: LatLng | LatLngLiteral;
    zoom?: number;
    styles?: any[];
    mapTypeControl?: boolean;
    streetViewControl?: boolean;
    fullscreenControl?: boolean;
    zoomControl?: boolean;
  }

  interface MarkerOptions {
    position?: LatLng | LatLngLiteral;
    map?: Map;
    title?: string;
    icon?: Symbol | string | Icon | google.maps.Symbol;
  }

  interface Symbol {
    path: SymbolPath | string;
    scale?: number;
    fillColor?: string;
    fillOpacity?: number;
    strokeColor?: string;
    strokeWeight?: number;
  }

  interface Icon {
    url: string;
    size?: Size;
    origin?: Point;
    anchor?: Point;
    scaledSize?: Size;
  }

  interface InfoWindowOptions {
    content?: string | Element;
    position?: LatLng | LatLngLiteral;
  }

  interface GeocoderRequest {
    address?: string;
    location?: LatLng | LatLngLiteral;
  }

  interface GeocoderResult {
    address_components: any[];
    formatted_address: string;
    geometry: {
      location: LatLng;
      location_type: string;
      viewport: LatLngBounds;
    };
    place_id: string;
    types: string[];
  }

  type GeocoderStatus = 'OK' | 'ZERO_RESULTS' | 'OVER_QUERY_LIMIT' | 'REQUEST_DENIED' | 'INVALID_REQUEST' | 'UNKNOWN_ERROR';

  interface Geocoder {
    geocode(request: GeocoderRequest, callback: (results: GeocoderResult[] | null, status: GeocoderStatus) => void): void;
  }

  namespace geometry {
    namespace spherical {
      function computeDistanceBetween(from: LatLng, to: LatLng): number;
    }
  }

  namespace event {
    function addListener(instance: any, eventName: string, handler: Function): void;
    function removeListener(listener: any): void;
  }
}

export {};