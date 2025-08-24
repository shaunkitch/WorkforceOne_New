// Simple Google Maps loader without external dependencies
import { devLog } from './utils/logger';

class SimpleGoogleMapsService {
  private static instance: SimpleGoogleMapsService
  private isLoaded: boolean = false
  private loadPromise: Promise<typeof google> | null = null

  private constructor() {}

  public static getInstance(): SimpleGoogleMapsService {
    if (!SimpleGoogleMapsService.instance) {
      SimpleGoogleMapsService.instance = new SimpleGoogleMapsService()
    }
    return SimpleGoogleMapsService.instance
  }

  public async loadGoogleMaps(): Promise<typeof google> {
    if (this.isLoaded && window.google) {
      return Promise.resolve(window.google)
    }

    if (this.loadPromise) {
      return this.loadPromise
    }

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

    if (!apiKey) {
      throw new Error('Google Maps API key is not configured')
    }

    this.loadPromise = new Promise((resolve, reject) => {
      // Check if already loaded
      if (window.google) {
        this.isLoaded = true
        resolve(window.google)
        return
      }

      // Create callback function
      const callbackName = `googleMapsCallback_${Date.now()}`
      ;(window as any)[callbackName] = () => {
        devLog('Google Maps loaded via callback');
        this.isLoaded = true
        delete (window as any)[callbackName]
        resolve(window.google)
      }

      // Create script element
      const script = document.createElement('script')
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&callback=${callbackName}&v=weekly&libraries=geometry`
      script.async = true
      script.defer = true
      
      script.onerror = () => {
        console.error('Failed to load Google Maps script')
        delete (window as any)[callbackName]
        this.loadPromise = null
        reject(new Error('Failed to load Google Maps API'))
      }

      // Add timeout
      const timeout = setTimeout(() => {
        console.error('Google Maps loading timeout')
        delete (window as any)[callbackName]
        document.head.removeChild(script)
        this.loadPromise = null
        reject(new Error('Google Maps API loading timeout'))
      }, 15000)

      // Clear timeout on success
      ;(window as any)[callbackName + '_original'] = (window as any)[callbackName]
      ;(window as any)[callbackName] = () => {
        clearTimeout(timeout)
        ;(window as any)[callbackName + '_original']()
      }

      devLog('Loading Google Maps script', { src: script.src });
      document.head.appendChild(script)
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
}

export const simpleGoogleMapsService = SimpleGoogleMapsService.getInstance()
export default simpleGoogleMapsService