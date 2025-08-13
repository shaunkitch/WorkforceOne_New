// Route Optimization Service
// Integrates with Google Maps APIs for real route optimization

interface RouteStop {
  id: string
  name: string
  address: string
  latitude: number
  longitude: number
  estimatedDuration?: number // minutes to spend at stop
  priority?: number // 1=high, 2=medium, 3=low
}

interface OptimizationSettings {
  optimizationType: 'distance' | 'time' | 'balanced' | 'custom'
  avoidTolls: boolean
  avoidHighways: boolean
  preferMainRoads: boolean
  maxRouteDistance?: number // km
  maxRouteDuration?: number // minutes
  travelMode: 'DRIVING' | 'WALKING' | 'TRANSIT' | 'BICYCLING'
}

interface OptimizedRoute {
  stops: RouteStop[]
  totalDistance: number // km
  totalDuration: number // minutes
  estimatedFuel?: number // liters
  estimatedCost?: number // currency
  polyline?: string // encoded polyline for map display
  waypoints: google.maps.LatLng[]
}

interface RouteSegment {
  from: RouteStop
  to: RouteStop
  distance: number // km
  duration: number // minutes
  polyline: string
}

class RouteOptimizationService {
  private directionsService: google.maps.DirectionsService | null = null
  private distanceMatrixService: google.maps.DistanceMatrixService | null = null

  constructor() {
    // Initialize Google Maps services when available
    if (typeof google !== 'undefined' && google.maps) {
      this.initializeServices()
    }
  }

  private initializeServices() {
    this.directionsService = new google.maps.DirectionsService()
    this.distanceMatrixService = new google.maps.DistanceMatrixService()
  }

  // Main optimization method
  async optimizeRoute(
    stops: RouteStop[], 
    startLocation?: RouteStop, 
    endLocation?: RouteStop,
    settings: OptimizationSettings = {
      optimizationType: 'balanced',
      avoidTolls: false,
      avoidHighways: false,
      preferMainRoads: true,
      travelMode: 'DRIVING'
    }
  ): Promise<OptimizedRoute> {
    console.log('=== ROUTE OPTIMIZATION START ===')
    console.log('Google Maps available:', typeof google !== 'undefined')
    console.log('Services initialized:', !!this.directionsService, !!this.distanceMatrixService)
    
    // Check if Google Maps is loaded
    if (typeof google === 'undefined' || !google.maps) {
      throw new Error('Google Maps API not loaded. Please ensure the Google Maps script is loaded before calling optimization.')
    }
    
    if (!this.directionsService || !this.distanceMatrixService) {
      console.log('Reinitializing Google Maps services...')
      this.initializeServices()
      if (!this.directionsService || !this.distanceMatrixService) {
        throw new Error('Failed to initialize Google Maps services')
      }
    }

    try {
      console.log('Optimizing route for', stops.length, 'stops with settings:', settings)
      console.log('Google Maps API Key available:', !!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY)
      console.log('Google Maps services initialized:', !!this.directionsService && !!this.distanceMatrixService)

      // Step 1: Calculate distance matrix between all points
      const distanceMatrix = await this.calculateDistanceMatrix(stops, settings)
      
      // Step 2: Apply optimization algorithm based on type
      let optimizedOrder: RouteStop[]
      
      switch (settings.optimizationType) {
        case 'distance':
          optimizedOrder = await this.optimizeForDistance(stops, distanceMatrix, startLocation)
          break
        case 'time':
          optimizedOrder = await this.optimizeForTime(stops, distanceMatrix, startLocation)
          break
        case 'balanced':
          optimizedOrder = await this.optimizeBalanced(stops, distanceMatrix, startLocation)
          break
        default:
          optimizedOrder = await this.optimizeBalanced(stops, distanceMatrix, startLocation)
      }

      // Step 3: Get detailed route with Google Directions API
      const detailedRoute = await this.getDetailedRoute(
        optimizedOrder, 
        startLocation, 
        endLocation, 
        settings
      )

      return detailedRoute

    } catch (error) {
      console.error('Route optimization failed:', error)
      throw new Error(`Route optimization failed: ${error}`)
    }
  }

  // Calculate distance/time matrix between all stops
  private async calculateDistanceMatrix(
    stops: RouteStop[], 
    settings: OptimizationSettings
  ): Promise<number[][]> {
    const locations = stops.map(stop => new google.maps.LatLng(stop.latitude, stop.longitude))
    
    return new Promise((resolve, reject) => {
      console.log('Requesting distance matrix for', locations.length, 'locations')
      this.distanceMatrixService!.getDistanceMatrix({
        origins: locations,
        destinations: locations,
        travelMode: google.maps.TravelMode[settings.travelMode],
        avoidHighways: settings.avoidHighways,
        avoidTolls: settings.avoidTolls,
        unitSystem: google.maps.UnitSystem.METRIC
      }, (response, status) => {
        console.log('Distance Matrix API response:', status, response)
        if (status === google.maps.DistanceMatrixStatus.OK && response) {
          const matrix: number[][] = []
          
          response.rows.forEach((row, i) => {
            matrix[i] = []
            row.elements.forEach((element, j) => {
              if (element.status === 'OK') {
                // Use time for optimization (in seconds, convert to minutes)
                const value = settings.optimizationType === 'distance' 
                  ? element.distance!.value / 1000 // km
                  : element.duration!.value / 60 // minutes
                matrix[i][j] = value
              } else {
                matrix[i][j] = Infinity // Unreachable
              }
            })
          })
          
          console.log('Distance matrix calculated:', matrix)
          resolve(matrix)
        } else {
          reject(new Error(`Distance Matrix request failed: ${status}`))
        }
      })
    })
  }

  // Traveling Salesman Problem solver using nearest neighbor heuristic
  private async optimizeForDistance(
    stops: RouteStop[], 
    distanceMatrix: number[][], 
    startLocation?: RouteStop
  ): Promise<RouteStop[]> {
    if (stops.length <= 2) return stops

    // Simple nearest neighbor algorithm
    const unvisited = [...stops.map((_, i) => i)]
    const visited: number[] = []
    
    // Start from specified location or first stop
    let currentIndex = startLocation 
      ? stops.findIndex(s => s.id === startLocation.id)
      : 0
    
    if (currentIndex === -1) currentIndex = 0
    
    visited.push(currentIndex)
    unvisited.splice(unvisited.indexOf(currentIndex), 1)

    // Visit nearest unvisited stop each time
    while (unvisited.length > 0) {
      let nearestIndex = unvisited[0]
      let nearestDistance = distanceMatrix[currentIndex][nearestIndex]

      unvisited.forEach(index => {
        if (distanceMatrix[currentIndex][index] < nearestDistance) {
          nearestDistance = distanceMatrix[currentIndex][index]
          nearestIndex = index
        }
      })

      visited.push(nearestIndex)
      unvisited.splice(unvisited.indexOf(nearestIndex), 1)
      currentIndex = nearestIndex
    }

    return visited.map(index => stops[index])
  }

  // Time-optimized route (similar to distance but uses time matrix)
  private async optimizeForTime(
    stops: RouteStop[], 
    timeMatrix: number[][], 
    startLocation?: RouteStop
  ): Promise<RouteStop[]> {
    // Same algorithm as distance but using time values
    return this.optimizeForDistance(stops, timeMatrix, startLocation)
  }

  // Balanced optimization considering both time, distance, and priorities
  private async optimizeBalanced(
    stops: RouteStop[], 
    distanceMatrix: number[][], 
    startLocation?: RouteStop
  ): Promise<RouteStop[]> {
    if (stops.length <= 2) return stops

    // Enhanced algorithm considering stop priorities
    const unvisited = [...stops.map((_, i) => i)]
    const visited: number[] = []
    
    let currentIndex = startLocation 
      ? stops.findIndex(s => s.id === startLocation.id)
      : 0
    
    if (currentIndex === -1) currentIndex = 0
    
    visited.push(currentIndex)
    unvisited.splice(unvisited.indexOf(currentIndex), 1)

    while (unvisited.length > 0) {
      let bestIndex = unvisited[0]
      let bestScore = this.calculateStopScore(
        currentIndex, 
        bestIndex, 
        distanceMatrix, 
        stops
      )

      unvisited.forEach(index => {
        const score = this.calculateStopScore(
          currentIndex, 
          index, 
          distanceMatrix, 
          stops
        )
        if (score < bestScore) {
          bestScore = score
          bestIndex = index
        }
      })

      visited.push(bestIndex)
      unvisited.splice(unvisited.indexOf(bestIndex), 1)
      currentIndex = bestIndex
    }

    return visited.map(index => stops[index])
  }

  // Calculate score for balanced optimization (lower is better)
  private calculateStopScore(
    fromIndex: number, 
    toIndex: number, 
    distanceMatrix: number[][], 
    stops: RouteStop[]
  ): number {
    const distance = distanceMatrix[fromIndex][toIndex]
    const priority = stops[toIndex].priority || 2
    
    // Lower priority number = higher priority = lower score multiplier
    const priorityWeight = priority === 1 ? 0.7 : priority === 2 ? 1.0 : 1.3
    
    return distance * priorityWeight
  }

  // Get detailed route using Google Directions API
  private async getDetailedRoute(
    optimizedStops: RouteStop[],
    startLocation?: RouteStop,
    endLocation?: RouteStop,
    settings: OptimizationSettings = {
      optimizationType: 'balanced',
      avoidTolls: false,
      avoidHighways: false,
      preferMainRoads: true,
      travelMode: 'DRIVING'
    }
  ): Promise<OptimizedRoute> {
    const waypoints: google.maps.DirectionsWaypoint[] = []
    
    // Add intermediate stops as waypoints (skip first and last)
    for (let i = 1; i < optimizedStops.length - 1; i++) {
      waypoints.push({
        location: new google.maps.LatLng(
          optimizedStops[i].latitude, 
          optimizedStops[i].longitude
        ),
        stopover: true
      })
    }

    const origin = startLocation || optimizedStops[0]
    const destination = endLocation || optimizedStops[optimizedStops.length - 1]

    return new Promise((resolve, reject) => {
      this.directionsService!.route({
        origin: new google.maps.LatLng(origin.latitude, origin.longitude),
        destination: new google.maps.LatLng(destination.latitude, destination.longitude),
        waypoints: waypoints,
        optimizeWaypoints: true, // Let Google optimize the waypoint order
        travelMode: google.maps.TravelMode[settings.travelMode],
        avoidHighways: settings.avoidHighways,
        avoidTolls: settings.avoidTolls,
        unitSystem: google.maps.UnitSystem.METRIC
      }, (response, status) => {
        if (status === google.maps.DirectionsStatus.OK && response) {
          const route = response.routes[0]
          let totalDistance = 0
          let totalDuration = 0

          // Calculate totals
          route.legs.forEach(leg => {
            totalDistance += leg.distance!.value / 1000 // Convert to km
            totalDuration += leg.duration!.value / 60 // Convert to minutes
          })

          // Add stop durations
          const stopDuration = optimizedStops.reduce((total, stop) => {
            return total + (stop.estimatedDuration || 30)
          }, 0)

          const optimizedRoute: OptimizedRoute = {
            stops: optimizedStops,
            totalDistance: Math.round(totalDistance * 100) / 100,
            totalDuration: Math.round((totalDuration + stopDuration) * 100) / 100,
            polyline: route.overview_polyline.points,
            waypoints: route.overview_path,
            estimatedFuel: this.calculateFuelConsumption(totalDistance),
            estimatedCost: this.calculateRouteCost(totalDistance, totalDuration)
          }

          console.log('Optimized route generated:', optimizedRoute)
          resolve(optimizedRoute)
        } else {
          reject(new Error(`Directions request failed: ${status}`))
        }
      })
    })
  }

  // Calculate estimated fuel consumption (rough estimate)
  private calculateFuelConsumption(distanceKm: number): number {
    const averageConsumption = 8.5 // liters per 100km
    return Math.round((distanceKm / 100) * averageConsumption * 100) / 100
  }

  // Calculate estimated route cost
  private calculateRouteCost(distanceKm: number, durationMinutes: number): number {
    const fuelCostPerLiter = 1.5 // example price
    const timeValuePerHour = 25 // example hourly rate
    
    const fuelCost = this.calculateFuelConsumption(distanceKm) * fuelCostPerLiter
    const timeCost = (durationMinutes / 60) * timeValuePerHour
    
    return Math.round((fuelCost + timeCost) * 100) / 100
  }

  // Utility method to display route on map
  displayRouteOnMap(
    map: google.maps.Map, 
    route: OptimizedRoute
  ): google.maps.DirectionsRenderer {
    const directionsRenderer = new google.maps.DirectionsRenderer({
      suppressMarkers: false,
      polylineOptions: {
        strokeColor: '#4285f4',
        strokeWeight: 4,
        strokeOpacity: 0.8
      }
    })

    directionsRenderer.setMap(map)

    // Re-create the directions request to display
    const waypoints = route.stops.slice(1, -1).map(stop => ({
      location: new google.maps.LatLng(stop.latitude, stop.longitude),
      stopover: true
    }))

    this.directionsService!.route({
      origin: new google.maps.LatLng(
        route.stops[0].latitude, 
        route.stops[0].longitude
      ),
      destination: new google.maps.LatLng(
        route.stops[route.stops.length - 1].latitude,
        route.stops[route.stops.length - 1].longitude
      ),
      waypoints: waypoints,
      travelMode: google.maps.TravelMode.DRIVING
    }, (response, status) => {
      if (status === google.maps.DirectionsStatus.OK && response) {
        directionsRenderer.setDirections(response)
      }
    })

    return directionsRenderer
  }
}

// Export singleton instance
export const routeOptimizationService = new RouteOptimizationService()
export type { RouteStop, OptimizationSettings, OptimizedRoute, RouteSegment }