import { Loader } from '@googlemaps/js-api-loader'

class GoogleMapsService {
  private static instance: GoogleMapsService
  private loader: Loader
  private isLoaded: boolean = false
  private loadPromise: Promise<typeof google> | null = null

  private constructor() {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''
    
    if (!apiKey) {
      console.error('NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is not set!')
    }
    
    this.loader = new Loader({
      apiKey,
      version: 'weekly',
      libraries: ['geometry'] // Simplified - removed 'places' which might be causing issues
    })
  }

  public static getInstance(): GoogleMapsService {
    if (!GoogleMapsService.instance) {
      GoogleMapsService.instance = new GoogleMapsService()
    }
    return GoogleMapsService.instance
  }

  public async loadGoogleMaps(): Promise<typeof google> {
    console.log('Loading Google Maps...')
    
    if (this.isLoaded && window.google) {
      console.log('Google Maps already loaded')
      return Promise.resolve(window.google)
    }

    if (this.loadPromise) {
      console.log('Google Maps loading in progress, waiting...')
      return this.loadPromise
    }

    console.log('Starting Google Maps API load...')
    
    // Add timeout to the loading
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error('Google Maps API loading timeout (30 seconds)'))
      }, 30000)
    })
    
    this.loadPromise = Promise.race([
      this.loader.load(),
      timeoutPromise
    ]).then((google) => {
      console.log('Google Maps loaded successfully')
      this.isLoaded = true
      return google
    }).catch((error) => {
      console.error('Failed to load Google Maps:', error)
      console.error('Error details:', error.message)
      
      // Log additional debugging info
      console.error('API Key being used:', process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.slice(0, 10) + '...')
      console.error('Current URL:', window.location.href)
      
      this.loadPromise = null
      throw error
    })

    return this.loadPromise
  }

  public isGoogleMapsLoaded(): boolean {
    return this.isLoaded && typeof window !== 'undefined' && !!window.google
  }

  public async createMap(element: HTMLElement, options: google.maps.MapOptions): Promise<google.maps.Map> {
    const google = await this.loadGoogleMaps()
    return new google.maps.Map(element, options)
  }

  public async createMarker(options: google.maps.MarkerOptions): Promise<google.maps.Marker> {
    const google = await this.loadGoogleMaps()
    return new google.maps.Marker(options)
  }

  public async createInfoWindow(options?: google.maps.InfoWindowOptions): Promise<google.maps.InfoWindow> {
    const google = await this.loadGoogleMaps()
    return new google.maps.InfoWindow(options)
  }

  public async geocodeAddress(address: string): Promise<google.maps.GeocoderResult[]> {
    const google = await this.loadGoogleMaps()
    const geocoder = new google.maps.Geocoder()
    
    return new Promise((resolve, reject) => {
      geocoder.geocode({ address }, (results, status) => {
        if (status === 'OK' && results) {
          resolve(results)
        } else {
          reject(new Error(`Geocoding failed: ${status}`))
        }
      })
    })
  }

  public async reverseGeocode(lat: number, lng: number): Promise<google.maps.GeocoderResult[]> {
    const google = await this.loadGoogleMaps()
    const geocoder = new google.maps.Geocoder()
    
    return new Promise((resolve, reject) => {
      geocoder.geocode({ location: { lat, lng } }, (results, status) => {
        if (status === 'OK' && results) {
          resolve(results)
        } else {
          reject(new Error(`Reverse geocoding failed: ${status}`))
        }
      })
    })
  }

  public calculateDistance(
    origin: google.maps.LatLngLiteral,
    destination: google.maps.LatLngLiteral
  ): number {
    if (!this.isGoogleMapsLoaded()) {
      throw new Error('Google Maps not loaded')
    }

    const originLatLng = new google.maps.LatLng(origin.lat, origin.lng)
    const destLatLng = new google.maps.LatLng(destination.lat, destination.lng)
    
    return google.maps.geometry.spherical.computeDistanceBetween(originLatLng, destLatLng)
  }
}

export const googleMapsService = GoogleMapsService.getInstance()
export default googleMapsService