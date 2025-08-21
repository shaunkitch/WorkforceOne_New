import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SupabaseClient } from '@supabase/supabase-js';

// Background task name for location tracking
const BACKGROUND_LOCATION_TASK = 'background-location-task';
const LOCATION_STORAGE_KEY = 'patrol_locations_queue';
const CURRENT_SESSION_KEY = 'current_patrol_session';

export interface PatrolSession {
  id: string;
  guard_id: string;
  organization_id: string;
  route_id: string;
  assignment_id?: string;
  start_time: string;
  status: 'active' | 'paused' | 'completed';
  current_latitude?: number;
  current_longitude?: number;
}

export interface LocationUpdate {
  session_id: string;
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: string;
  battery_level?: number;
  is_checkpoint_scan?: boolean;
  checkpoint_id?: string;
}

export interface PatrolRoute {
  id: string;
  name: string;
  description: string;
  estimated_duration: string;
  checkpoints: PatrolCheckpoint[];
  boundary_coords?: Array<{ lat: number; lng: number }>;
}

export interface PatrolCheckpoint {
  id: string;
  route_id: string;
  name: string;
  latitude: number;
  longitude: number;
  radius_meters: number;
  qr_code: string;
  order_sequence: number;
  is_mandatory: boolean;
  requires_photo: boolean;
  photo_instructions?: string;
}

class PatrolService {
  private supabase: SupabaseClient | null = null;
  private currentSession: PatrolSession | null = null;
  private locationSubscription: any = null;
  private lastLocationUpdate: Date | null = null;
  private isInitialized = false;

  // Initialize the service
  async initialize(supabaseClient: SupabaseClient) {
    this.supabase = supabaseClient;
    
    // Request location permissions
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      throw new Error('Location permission not granted');
    }

    // Request background permissions for GPS tracking
    const backgroundStatus = await Location.requestBackgroundPermissionsAsync();
    if (backgroundStatus.status !== 'granted') {
      console.warn('Background location permission not granted - limited functionality');
    }

    // Load any existing session
    await this.loadCurrentSession();

    // Note: Background location tracking would require expo-task-manager
    console.log('⚠️ Background location tracking not available - requires expo-task-manager');

    this.isInitialized = true;
    console.log('✅ Patrol service initialized');
  }

  // Note: Background task setup would require expo-task-manager
  private async setupBackgroundLocationTask() {
    console.log('⚠️ Background location task setup skipped - requires expo-task-manager');
  }

  // Handle location updates from background task
  private async handleBackgroundLocations(locations: Location.LocationObject[]) {
    if (!this.currentSession || locations.length === 0) {
      return;
    }

    try {
      const location = locations[locations.length - 1]; // Get most recent location
      
      // Check if 10 minutes have passed since last update
      const now = new Date();
      if (this.lastLocationUpdate) {
        const minutesSinceLastUpdate = (now.getTime() - this.lastLocationUpdate.getTime()) / (1000 * 60);
        if (minutesSinceLastUpdate < 10) {
          return; // Skip if less than 10 minutes
        }
      }

      // Get battery level
      const batteryLevel = await this.getBatteryLevel();

      // Create location update
      const locationUpdate: LocationUpdate = {
        session_id: this.currentSession.id,
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy || 0,
        timestamp: new Date(location.timestamp).toISOString(),
        battery_level: batteryLevel,
        is_checkpoint_scan: false
      };

      // Queue location for upload (handle offline scenarios)
      await this.queueLocationUpdate(locationUpdate);

      // Try to upload immediately
      await this.uploadQueuedLocations();

      this.lastLocationUpdate = now;

    } catch (error) {
      console.error('Error handling background location:', error);
    }
  }

  // Start a new patrol session
  async startPatrol(routeId: string, assignmentId?: string): Promise<PatrolSession> {
    if (!this.supabase) {
      throw new Error('Patrol service not initialized');
    }

    // End any existing session first
    if (this.currentSession) {
      await this.endPatrol();
    }

    try {
      // Get user profile
      const { data: { user } } = await this.supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data: profile } = await this.supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single();

      if (!profile) {
        throw new Error('User profile not found');
      }

      // Get initial location
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      // Create patrol session in database
      const sessionData = {
        guard_id: user.id,
        organization_id: profile.organization_id,
        route_id: routeId,
        assignment_id: assignmentId,
        start_time: new Date().toISOString(),
        status: 'active' as const,
        current_latitude: location.coords.latitude,
        current_longitude: location.coords.longitude,
        last_location_update: new Date().toISOString(),
        device_battery_level: await this.getBatteryLevel()
      };

      const { data: session, error } = await this.supabase
        .from('patrol_sessions')
        .insert(sessionData)
        .select()
        .single();

      if (error || !session) {
        throw new Error(`Failed to create patrol session: ${error?.message}`);
      }

      // Create PatrolSession object
      this.currentSession = {
        id: session.id,
        guard_id: session.guard_id,
        organization_id: session.organization_id,
        route_id: session.route_id,
        assignment_id: session.assignment_id,
        start_time: session.start_time,
        status: session.status,
        current_latitude: session.current_latitude,
        current_longitude: session.current_longitude
      };

      // Save session locally
      await AsyncStorage.setItem(CURRENT_SESSION_KEY, JSON.stringify(this.currentSession));

      // Start background location tracking
      await this.startLocationTracking();

      // Log initial location
      await this.logLocationUpdate({
        session_id: this.currentSession.id,
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy || 0,
        timestamp: new Date().toISOString(),
        battery_level: await this.getBatteryLevel()
      });

      console.log('✅ Patrol session started:', this.currentSession.id);
      return this.currentSession;

    } catch (error) {
      console.error('Error starting patrol:', error);
      throw error;
    }
  }

  // End current patrol session
  async endPatrol(notes?: string): Promise<void> {
    if (!this.currentSession || !this.supabase) {
      return;
    }

    try {
      // Stop location tracking
      await this.stopLocationTracking();

      // Get final location
      const location = await Location.getCurrentPositionAsync();

      // Update session in database
      await this.supabase
        .from('patrol_sessions')
        .update({
          end_time: new Date().toISOString(),
          status: 'completed',
          current_latitude: location.coords.latitude,
          current_longitude: location.coords.longitude,
          end_notes: notes,
          device_battery_level: await this.getBatteryLevel()
        })
        .eq('id', this.currentSession.id);

      // Log final location
      await this.logLocationUpdate({
        session_id: this.currentSession.id,
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy || 0,
        timestamp: new Date().toISOString(),
        battery_level: await this.getBatteryLevel()
      });

      // Upload any remaining queued locations
      await this.uploadQueuedLocations();

      // Clear current session
      this.currentSession = null;
      await AsyncStorage.removeItem(CURRENT_SESSION_KEY);

      console.log('✅ Patrol session ended successfully');

    } catch (error) {
      console.error('Error ending patrol:', error);
      throw error;
    }
  }

  // Pause patrol session
  async pausePatrol(): Promise<void> {
    if (!this.currentSession || !this.supabase) {
      return;
    }

    try {
      await this.stopLocationTracking();

      await this.supabase
        .from('patrol_sessions')
        .update({ status: 'paused' })
        .eq('id', this.currentSession.id);

      this.currentSession.status = 'paused';
      await AsyncStorage.setItem(CURRENT_SESSION_KEY, JSON.stringify(this.currentSession));

      console.log('⏸️ Patrol paused');
    } catch (error) {
      console.error('Error pausing patrol:', error);
      throw error;
    }
  }

  // Resume patrol session
  async resumePatrol(): Promise<void> {
    if (!this.currentSession || !this.supabase) {
      return;
    }

    try {
      await this.supabase
        .from('patrol_sessions')
        .update({ status: 'active' })
        .eq('id', this.currentSession.id);

      this.currentSession.status = 'active';
      await AsyncStorage.setItem(CURRENT_SESSION_KEY, JSON.stringify(this.currentSession));

      await this.startLocationTracking();

      console.log('▶️ Patrol resumed');
    } catch (error) {
      console.error('Error resuming patrol:', error);
      throw error;
    }
  }

  // Start location tracking (simplified version without background task)
  private async startLocationTracking() {
    try {
      console.log('📍 Location tracking started (foreground only)');
      // Note: Full background tracking would require expo-task-manager
      // For now, we'll rely on manual location updates during checkpoint scans
    } catch (error) {
      console.error('Error starting location tracking:', error);
    }
  }

  // Stop location tracking
  private async stopLocationTracking() {
    try {
      console.log('📍 Location tracking stopped');
      // Note: Would stop background task if using expo-task-manager
    } catch (error) {
      console.error('Error stopping location tracking:', error);
    }
  }

  // Log location update to database
  private async logLocationUpdate(locationUpdate: LocationUpdate) {
    if (!this.supabase) return;

    try {
      const { error } = await this.supabase
        .from('patrol_locations')
        .insert({
          session_id: locationUpdate.session_id,
          latitude: locationUpdate.latitude,
          longitude: locationUpdate.longitude,
          accuracy_meters: locationUpdate.accuracy,
          timestamp: locationUpdate.timestamp,
          battery_level: locationUpdate.battery_level,
          is_checkpoint_scan: locationUpdate.is_checkpoint_scan || false,
          checkpoint_id: locationUpdate.checkpoint_id
        });

      if (error) {
        console.error('Error logging location:', error);
        // Queue for retry if failed
        await this.queueLocationUpdate(locationUpdate);
      } else {
        console.log('📍 Location logged successfully');
      }
    } catch (error) {
      console.error('Error in logLocationUpdate:', error);
      await this.queueLocationUpdate(locationUpdate);
    }
  }

  // Queue location updates for offline scenarios
  private async queueLocationUpdate(locationUpdate: LocationUpdate) {
    try {
      const existing = await AsyncStorage.getItem(LOCATION_STORAGE_KEY);
      const queue = existing ? JSON.parse(existing) : [];
      queue.push(locationUpdate);
      
      // Keep only last 50 locations to prevent storage bloat
      const trimmed = queue.slice(-50);
      await AsyncStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify(trimmed));
    } catch (error) {
      console.error('Error queuing location:', error);
    }
  }

  // Upload queued location updates
  private async uploadQueuedLocations() {
    if (!this.supabase) return;

    try {
      const stored = await AsyncStorage.getItem(LOCATION_STORAGE_KEY);
      if (!stored) return;

      const queue: LocationUpdate[] = JSON.parse(stored);
      if (queue.length === 0) return;

      // Try to upload all queued locations
      const insertData = queue.map(loc => ({
        session_id: loc.session_id,
        latitude: loc.latitude,
        longitude: loc.longitude,
        accuracy_meters: loc.accuracy,
        timestamp: loc.timestamp,
        battery_level: loc.battery_level,
        is_checkpoint_scan: loc.is_checkpoint_scan || false,
        checkpoint_id: loc.checkpoint_id
      }));

      const { error } = await this.supabase
        .from('patrol_locations')
        .insert(insertData);

      if (!error) {
        // Clear queue on successful upload
        await AsyncStorage.removeItem(LOCATION_STORAGE_KEY);
        console.log(`📍 Uploaded ${queue.length} queued locations`);
      } else {
        console.error('Error uploading queued locations:', error);
      }
    } catch (error) {
      console.error('Error in uploadQueuedLocations:', error);
    }
  }

  // Load current session from storage
  private async loadCurrentSession() {
    try {
      const stored = await AsyncStorage.getItem(CURRENT_SESSION_KEY);
      if (stored) {
        this.currentSession = JSON.parse(stored);
        console.log('📱 Loaded existing patrol session:', this.currentSession?.id);
      }
    } catch (error) {
      console.error('Error loading current session:', error);
    }
  }

  // Get battery level
  private async getBatteryLevel(): Promise<number> {
    try {
      // Note: This would need expo-battery package
      // For now, return a placeholder
      return 85; // Placeholder battery level
    } catch (error) {
      return 0;
    }
  }

  // Get available patrol routes
  async getPatrolRoutes(): Promise<PatrolRoute[]> {
    if (!this.supabase) {
      throw new Error('Service not initialized');
    }

    try {
      const { data: { user } } = await this.supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data: profile } = await this.supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single();

      if (!profile) throw new Error('Profile not found');

      // Get routes with checkpoints
      const { data: routes, error } = await this.supabase
        .from('patrol_routes')
        .select(`
          *,
          patrol_checkpoints (
            id, name, latitude, longitude, radius_meters,
            qr_code, order_sequence, is_mandatory, requires_photo,
            photo_instructions
          )
        `)
        .eq('organization_id', profile.organization_id)
        .eq('is_active', true)
        .order('name');

      if (error) throw error;

      return (routes || []).map(route => ({
        id: route.id,
        name: route.name,
        description: route.description,
        estimated_duration: route.estimated_duration,
        boundary_coords: route.boundary_coords,
        checkpoints: (route.patrol_checkpoints || [])
          .sort((a: any, b: any) => a.order_sequence - b.order_sequence)
      }));

    } catch (error) {
      console.error('Error fetching patrol routes:', error);
      throw error;
    }
  }

  // Get current session
  getCurrentSession(): PatrolSession | null {
    return this.currentSession;
  }

  // Get current location
  async getCurrentLocation(): Promise<Location.LocationObject> {
    return await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    });
  }

  // Emergency panic button
  async triggerPanicButton(): Promise<void> {
    if (!this.currentSession || !this.supabase) {
      return;
    }

    try {
      // Get current location
      const location = await Location.getCurrentPositionAsync();

      // Update session with panic flag
      await this.supabase
        .from('patrol_sessions')
        .update({
          panic_button_pressed: true,
          panic_time: new Date().toISOString(),
          current_latitude: location.coords.latitude,
          current_longitude: location.coords.longitude
        })
        .eq('id', this.currentSession.id);

      // Log panic location
      await this.logLocationUpdate({
        session_id: this.currentSession.id,
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy || 0,
        timestamp: new Date().toISOString(),
        battery_level: await this.getBatteryLevel()
      });

      // TODO: Trigger emergency notifications and alerts

      console.log('🚨 PANIC BUTTON ACTIVATED');

    } catch (error) {
      console.error('Error triggering panic button:', error);
      throw error;
    }
  }
}

export const patrolService = new PatrolService();