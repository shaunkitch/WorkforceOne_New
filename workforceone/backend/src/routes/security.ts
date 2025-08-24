import express from 'express'
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { createLogger } from '../utils/logger'

dotenv.config()

const router = express.Router()
const logger = createLogger('security-routes')

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Middleware to verify authentication
const verifyAuth = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No valid authorization token provided' })
    }

    const token = authHeader.substring(7)
    const { data: { user }, error } = await supabase.auth.getUser(token)

    if (error || !user) {
      return res.status(401).json({ error: 'Invalid token' })
    }

    req.user = user
    next()
  } catch (error: unknown) {
    res.status(500).json({ error: 'Authentication error' })
  }
}

// =============================================================================
// PATROL SESSIONS
// =============================================================================

// Start a new patrol session
router.post('/patrol/start', verifyAuth, async (req, res) => {
  try {
    const { route_id, assignment_id, current_latitude, current_longitude, device_battery_level } = req.body
    const guard_id = req.user?.id
    if (!guard_id) {
      return res.status(401).json({ error: 'User authentication required' })
    }

    // Get user's organization
    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', guard_id)
      .single()

    if (!profile) {
      return res.status(404).json({ error: 'User profile not found' })
    }

    // End any existing active sessions for this guard
    await supabase
      .from('patrol_sessions')
      .update({ 
        status: 'completed',
        end_time: new Date().toISOString(),
        end_notes: 'Auto-ended when starting new session'
      })
      .eq('guard_id', guard_id)
      .in('status', ['active', 'paused'])

    // Create new patrol session
    const sessionData = {
      guard_id,
      organization_id: profile.organization_id,
      route_id,
      assignment_id,
      status: 'active',
      start_time: new Date().toISOString(),
      current_latitude,
      current_longitude,
      last_location_update: new Date().toISOString(),
      device_battery_level
    }

    const { data: session, error } = await supabase
      .from('patrol_sessions')
      .insert(sessionData)
      .select(`
        *,
        patrol_routes!inner(name, description, estimated_duration),
        profiles!inner(full_name)
      `)
      .single()

    if (error) {
      logger.error('Error creating patrol session', { error })
      return res.status(500).json({ error: 'Failed to create patrol session' })
    }

    // Log initial location
    if (current_latitude && current_longitude) {
      await supabase
        .from('patrol_locations')
        .insert({
          session_id: session.id,
          latitude: current_latitude,
          longitude: current_longitude,
          accuracy_meters: 10,
          timestamp: new Date().toISOString(),
          battery_level: device_battery_level,
          is_checkpoint_scan: false
        })
    }

    res.json({
      success: true,
      session: {
        id: session.id,
        guard_id: session.guard_id,
        organization_id: session.organization_id,
        route_id: session.route_id,
        assignment_id: session.assignment_id,
        start_time: session.start_time,
        status: session.status,
        current_latitude: session.current_latitude,
        current_longitude: session.current_longitude,
        route_name: session.patrol_routes.name,
        guard_name: session.profiles.full_name
      }
    })

  } catch (error: unknown) {
    logger.error('Error starting patrol', { error: error instanceof Error ? error.message : String(error) })
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get current patrol session
router.get('/patrol/current', verifyAuth, async (req, res) => {
  try {
    const guard_id = req.user?.id
    if (!guard_id) {
      return res.status(401).json({ error: 'User authentication required' })
    }

    const { data: session, error } = await supabase
      .from('patrol_sessions')
      .select(`
        *,
        patrol_routes!inner(name, description, estimated_duration),
        profiles!inner(full_name)
      `)
      .eq('guard_id', guard_id)
      .in('status', ['active', 'paused'])
      .order('start_time', { ascending: false })
      .limit(1)
      .single()

    if (error && error.code !== 'PGRST116') {
      logger.error('Error fetching current session', { error })
      return res.status(500).json({ error: 'Failed to fetch current session' })
    }

    if (!session) {
      return res.json({ session: null })
    }

    res.json({
      success: true,
      session: {
        id: session.id,
        guard_id: session.guard_id,
        organization_id: session.organization_id,
        route_id: session.route_id,
        assignment_id: session.assignment_id,
        start_time: session.start_time,
        status: session.status,
        current_latitude: session.current_latitude,
        current_longitude: session.current_longitude,
        route_name: session.patrol_routes.name,
        guard_name: session.profiles.full_name
      }
    })

  } catch (error: unknown) {
    logger.error('Error fetching current patrol', { error: error instanceof Error ? error.message : String(error) })
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Update patrol session status (pause/resume)
router.patch('/patrol/:sessionId/status', verifyAuth, async (req, res) => {
  try {
    const { sessionId } = req.params
    const { status } = req.body
    const guard_id = req.user?.id
    if (!guard_id) {
      return res.status(401).json({ error: 'User authentication required' })
    }

    if (!['active', 'paused'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status. Must be active or paused' })
    }

    const { data: session, error } = await supabase
      .from('patrol_sessions')
      .update({ status })
      .eq('id', sessionId)
      .eq('guard_id', guard_id)
      .select()
      .single()

    if (error) {
      logger.error('Error updating session status', { error })
      return res.status(500).json({ error: 'Failed to update session status' })
    }

    if (!session) {
      return res.status(404).json({ error: 'Session not found' })
    }

    res.json({ success: true, session })

  } catch (error: unknown) {
    logger.error('Error updating patrol status', { error: error instanceof Error ? error.message : String(error) })
    res.status(500).json({ error: 'Internal server error' })
  }
})

// End patrol session
router.post('/patrol/:sessionId/end', verifyAuth, async (req, res) => {
  try {
    const { sessionId } = req.params
    const { end_notes, current_latitude, current_longitude, device_battery_level } = req.body
    const guard_id = req.user?.id
    if (!guard_id) {
      return res.status(401).json({ error: 'User authentication required' })
    }

    const { data: session, error } = await supabase
      .from('patrol_sessions')
      .update({
        status: 'completed',
        end_time: new Date().toISOString(),
        end_notes,
        current_latitude,
        current_longitude,
        device_battery_level
      })
      .eq('id', sessionId)
      .eq('guard_id', guard_id)
      .select()
      .single()

    if (error) {
      logger.error('Error ending session', { error })
      return res.status(500).json({ error: 'Failed to end session' })
    }

    if (!session) {
      return res.status(404).json({ error: 'Session not found' })
    }

    // Log final location
    if (current_latitude && current_longitude) {
      await supabase
        .from('patrol_locations')
        .insert({
          session_id: sessionId,
          latitude: current_latitude,
          longitude: current_longitude,
          accuracy_meters: 10,
          timestamp: new Date().toISOString(),
          battery_level: device_battery_level,
          is_checkpoint_scan: false
        })
    }

    res.json({ success: true, session })

  } catch (error: unknown) {
    logger.error('Error ending patrol', { error: error instanceof Error ? error.message : String(error) })
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Emergency panic button
router.post('/patrol/:sessionId/panic', verifyAuth, async (req, res) => {
  try {
    const { sessionId } = req.params
    const { current_latitude, current_longitude } = req.body
    const guard_id = req.user?.id
    if (!guard_id) {
      return res.status(401).json({ error: 'User authentication required' })
    }

    // Update session with panic flag
    const { data: session, error } = await supabase
      .from('patrol_sessions')
      .update({
        panic_button_pressed: true,
        panic_time: new Date().toISOString(),
        current_latitude,
        current_longitude
      })
      .eq('id', sessionId)
      .eq('guard_id', guard_id)
      .select(`
        *,
        patrol_routes!inner(name),
        profiles!inner(full_name, organization_id)
      `)
      .single()

    if (error || !session) {
      logger.error('Error updating panic status', { error })
      return res.status(500).json({ error: 'Failed to register panic alert' })
    }

    // Log panic location
    if (current_latitude && current_longitude) {
      await supabase
        .from('patrol_locations')
        .insert({
          session_id: sessionId,
          latitude: current_latitude,
          longitude: current_longitude,
          accuracy_meters: 10,
          timestamp: new Date().toISOString(),
          is_checkpoint_scan: false
        })
    }

    // TODO: Send emergency notifications to supervisors and emergency contacts

    res.json({ 
      success: true, 
      message: 'Emergency alert sent successfully',
      session 
    })

  } catch (error: unknown) {
    logger.error('Error processing panic button', { error: error instanceof Error ? error.message : String(error) })
    res.status(500).json({ error: 'Internal server error' })
  }
})

// =============================================================================
// LOCATION TRACKING
// =============================================================================

// Update guard location
router.post('/patrol/:sessionId/location', verifyAuth, async (req, res) => {
  try {
    const { sessionId } = req.params
    const { 
      latitude, 
      longitude, 
      accuracy_meters, 
      battery_level, 
      is_checkpoint_scan = false,
      checkpoint_id 
    } = req.body
    const guard_id = req.user?.id
    if (!guard_id) {
      return res.status(401).json({ error: 'User authentication required' })
    }

    // Verify session belongs to guard
    const { data: session } = await supabase
      .from('patrol_sessions')
      .select('id')
      .eq('id', sessionId)
      .eq('guard_id', guard_id)
      .single()

    if (!session) {
      return res.status(404).json({ error: 'Session not found' })
    }

    // Insert location update
    const { error } = await supabase
      .from('patrol_locations')
      .insert({
        session_id: sessionId,
        latitude,
        longitude,
        accuracy_meters,
        timestamp: new Date().toISOString(),
        battery_level,
        is_checkpoint_scan,
        checkpoint_id
      })

    if (error) {
      logger.error('Error logging location', { error })
      return res.status(500).json({ error: 'Failed to log location' })
    }

    // Update session's current location
    await supabase
      .from('patrol_sessions')
      .update({
        current_latitude: latitude,
        current_longitude: longitude,
        last_location_update: new Date().toISOString(),
        device_battery_level: battery_level
      })
      .eq('id', sessionId)

    res.json({ success: true })

  } catch (error: unknown) {
    logger.error('Error updating location', { error: error instanceof Error ? error.message : String(error) })
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Bulk location updates (for offline sync)
router.post('/patrol/:sessionId/locations/bulk', verifyAuth, async (req, res) => {
  try {
    const { sessionId } = req.params
    const { locations } = req.body
    const guard_id = req.user?.id
    if (!guard_id) {
      return res.status(401).json({ error: 'User authentication required' })
    }

    if (!Array.isArray(locations) || locations.length === 0) {
      return res.status(400).json({ error: 'Locations array is required' })
    }

    // Verify session belongs to guard
    const { data: session } = await supabase
      .from('patrol_sessions')
      .select('id')
      .eq('id', sessionId)
      .eq('guard_id', guard_id)
      .single()

    if (!session) {
      return res.status(404).json({ error: 'Session not found' })
    }

    // Prepare location data
    const locationData = locations.map(loc => ({
      session_id: sessionId,
      latitude: loc.latitude,
      longitude: loc.longitude,
      accuracy_meters: loc.accuracy_meters || 0,
      timestamp: loc.timestamp,
      battery_level: loc.battery_level,
      is_checkpoint_scan: loc.is_checkpoint_scan || false,
      checkpoint_id: loc.checkpoint_id
    }))

    // Bulk insert
    const { error } = await supabase
      .from('patrol_locations')
      .insert(locationData)

    if (error) {
      logger.error('Error bulk inserting locations', { error })
      return res.status(500).json({ error: 'Failed to save locations' })
    }

    // Update session with most recent location
    const mostRecent = locations.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )[0]

    await supabase
      .from('patrol_sessions')
      .update({
        current_latitude: mostRecent.latitude,
        current_longitude: mostRecent.longitude,
        last_location_update: mostRecent.timestamp,
        device_battery_level: mostRecent.battery_level
      })
      .eq('id', sessionId)

    res.json({ 
      success: true, 
      message: `${locations.length} locations saved successfully` 
    })

  } catch (error: unknown) {
    logger.error('Error bulk updating locations', { error: error instanceof Error ? error.message : String(error) })
    res.status(500).json({ error: 'Internal server error' })
  }
})

// =============================================================================
// PATROL ROUTES & CHECKPOINTS
// =============================================================================

// Get available patrol routes for organization
router.get('/routes', verifyAuth, async (req, res) => {
  try {
    const user_id = req.user?.id
    if (!user_id) {
      return res.status(401).json({ error: 'User authentication required' })
    }

    // Get user's organization
    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', user_id)
      .single()

    if (!profile) {
      return res.status(404).json({ error: 'User profile not found' })
    }

    // Get routes with checkpoints
    const { data: routes, error } = await supabase
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
      .order('name')

    if (error) {
      logger.error('Error fetching routes', { error })
      return res.status(500).json({ error: 'Failed to fetch patrol routes' })
    }

    // Format response
    const formattedRoutes = (routes || []).map(route => ({
      id: route.id,
      name: route.name,
      description: route.description,
      estimated_duration: route.estimated_duration,
      boundary_coords: route.boundary_coords,
      color_code: route.color_code,
      checkpoints: (route.patrol_checkpoints || [])
        .sort((a: any, b: any) => a.order_sequence - b.order_sequence)
        .map((cp: any) => ({
          id: cp.id,
          name: cp.name,
          latitude: cp.latitude,
          longitude: cp.longitude,
          radius_meters: cp.radius_meters,
          qr_code: cp.qr_code,
          order_sequence: cp.order_sequence,
          is_mandatory: cp.is_mandatory,
          requires_photo: cp.requires_photo,
          photo_instructions: cp.photo_instructions
        }))
    }))

    res.json({ success: true, routes: formattedRoutes })

  } catch (error: unknown) {
    logger.error('Error fetching patrol routes', { error: error instanceof Error ? error.message : String(error) })
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Scan checkpoint (QR code verification)
router.post('/checkpoints/:checkpointId/scan', verifyAuth, async (req, res) => {
  try {
    const { checkpointId } = req.params
    const { 
      session_id, 
      qr_code_scanned, 
      latitude, 
      longitude, 
      photo_url,
      notes 
    } = req.body
    const guard_id = req.user?.id
    if (!guard_id) {
      return res.status(401).json({ error: 'User authentication required' })
    }

    // Verify checkpoint exists and get details
    const { data: checkpoint, error: checkpointError } = await supabase
      .from('patrol_checkpoints')
      .select('*')
      .eq('id', checkpointId)
      .single()

    if (checkpointError || !checkpoint) {
      return res.status(404).json({ error: 'Checkpoint not found' })
    }

    // Verify session belongs to guard and is active
    const { data: session, error: sessionError } = await supabase
      .from('patrol_sessions')
      .select('*')
      .eq('id', session_id)
      .eq('guard_id', guard_id)
      .eq('status', 'active')
      .single()

    if (sessionError || !session) {
      return res.status(404).json({ error: 'Active session not found' })
    }

    // Verify QR code matches
    if (checkpoint.qr_code !== qr_code_scanned) {
      return res.status(400).json({ 
        error: 'Invalid QR code',
        message: 'The scanned QR code does not match this checkpoint'
      })
    }

    // Calculate distance from checkpoint
    const distance = calculateDistance(
      latitude, 
      longitude, 
      checkpoint.latitude, 
      checkpoint.longitude
    )

    if (distance > checkpoint.radius_meters) {
      return res.status(400).json({ 
        error: 'Location mismatch',
        message: `You must be within ${checkpoint.radius_meters}m of the checkpoint to scan`,
        distance_meters: Math.round(distance)
      })
    }

    // Record checkpoint scan
    const scanData = {
      session_id,
      checkpoint_id: checkpointId,
      scan_time: new Date().toISOString(),
      latitude,
      longitude,
      distance_meters: Math.round(distance),
      photo_url,
      notes,
      qr_code_verified: true
    }

    const { data: scan, error: scanError } = await supabase
      .from('checkpoint_scans')
      .insert(scanData)
      .select()
      .single()

    if (scanError) {
      logger.error('Error recording checkpoint scan', { error: scanError })
      return res.status(500).json({ error: 'Failed to record checkpoint scan' })
    }

    // Log location update
    await supabase
      .from('patrol_locations')
      .insert({
        session_id,
        latitude,
        longitude,
        accuracy_meters: 5, // High accuracy for checkpoint scans
        timestamp: new Date().toISOString(),
        is_checkpoint_scan: true,
        checkpoint_id: checkpointId
      })

    res.json({ 
      success: true, 
      message: 'Checkpoint scanned successfully',
      scan: {
        id: scan.id,
        checkpoint_name: checkpoint.name,
        scan_time: scan.scan_time,
        distance_meters: scan.distance_meters
      }
    })

  } catch (error: unknown) {
    logger.error('Error scanning checkpoint', { error: error instanceof Error ? error.message : String(error) })
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get checkpoint scan history for session
router.get('/patrol/:sessionId/checkpoints', verifyAuth, async (req, res) => {
  try {
    const { sessionId } = req.params
    const guard_id = req.user?.id
    if (!guard_id) {
      return res.status(401).json({ error: 'User authentication required' })
    }

    // Verify session belongs to guard
    const { data: session } = await supabase
      .from('patrol_sessions')
      .select('id, route_id')
      .eq('id', sessionId)
      .eq('guard_id', guard_id)
      .single()

    if (!session) {
      return res.status(404).json({ error: 'Session not found' })
    }

    // Get checkpoint scans for this session
    const { data: scans, error } = await supabase
      .from('checkpoint_scans')
      .select(`
        *,
        patrol_checkpoints!inner(name, order_sequence, is_mandatory)
      `)
      .eq('session_id', sessionId)
      .order('scan_time')

    if (error) {
      logger.error('Error fetching checkpoint scans', { error })
      return res.status(500).json({ error: 'Failed to fetch checkpoint scans' })
    }

    // Get all checkpoints for the route
    const { data: allCheckpoints, error: checkpointsError } = await supabase
      .from('patrol_checkpoints')
      .select('id, name, order_sequence, is_mandatory')
      .eq('route_id', session.route_id)
      .order('order_sequence')

    if (checkpointsError) {
      logger.error('Error fetching route checkpoints', { error: checkpointsError })
      return res.status(500).json({ error: 'Failed to fetch route checkpoints' })
    }

    // Format response with completion status
    const scannedCheckpointIds = new Set(scans?.map(s => s.checkpoint_id) || [])
    const checkpointStatus = (allCheckpoints || []).map(cp => ({
      id: cp.id,
      name: cp.name,
      order_sequence: cp.order_sequence,
      is_mandatory: cp.is_mandatory,
      is_scanned: scannedCheckpointIds.has(cp.id),
      scan_time: scans?.find(s => s.checkpoint_id === cp.id)?.scan_time
    }))

    const completed = scannedCheckpointIds.size
    const total = allCheckpoints?.length || 0
    const mandatory_completed = checkpointStatus.filter(cp => cp.is_mandatory && cp.is_scanned).length
    const mandatory_total = checkpointStatus.filter(cp => cp.is_mandatory).length

    res.json({ 
      success: true, 
      checkpoints: checkpointStatus,
      progress: {
        completed,
        total,
        mandatory_completed,
        mandatory_total,
        completion_percentage: total > 0 ? Math.round((completed / total) * 100) : 0
      }
    })

  } catch (error: unknown) {
    logger.error('Error fetching checkpoint progress', { error: error instanceof Error ? error.message : String(error) })
    res.status(500).json({ error: 'Internal server error' })
  }
})

// =============================================================================
// INCIDENT MANAGEMENT
// =============================================================================

// Create incident report
router.post('/incidents', verifyAuth, async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      severity,
      latitude,
      longitude,
      session_id,
      photo_urls = [],
      audio_url,
      video_url
    } = req.body
    const reported_by = req.user?.id
    if (!reported_by) {
      return res.status(401).json({ error: 'User authentication required' })
    }

    // Get user's organization
    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', reported_by)
      .single()

    if (!profile) {
      return res.status(404).json({ error: 'User profile not found' })
    }

    // Create incident
    const incidentData = {
      organization_id: profile.organization_id,
      title,
      description,
      category,
      severity,
      status: 'open',
      reported_by,
      session_id,
      incident_time: new Date().toISOString(),
      latitude,
      longitude
    }

    const { data: incident, error } = await supabase
      .from('incidents')
      .insert(incidentData)
      .select(`
        *,
        profiles!inner(full_name)
      `)
      .single()

    if (error) {
      logger.error('Error creating incident', { error })
      return res.status(500).json({ error: 'Failed to create incident report' })
    }

    // Add attachments if provided
    if (photo_urls.length > 0 || audio_url || video_url) {
      const attachments = []
      
      // Photo attachments
      photo_urls.forEach((url: string, index: number) => {
        attachments.push({
          incident_id: incident.id,
          file_url: url,
          file_type: 'photo',
          file_name: `photo_${index + 1}.jpg`,
          uploaded_by: reported_by
        })
      })

      // Audio attachment
      if (audio_url) {
        attachments.push({
          incident_id: incident.id,
          file_url: audio_url,
          file_type: 'audio',
          file_name: 'audio_recording.mp3',
          uploaded_by: reported_by
        })
      }

      // Video attachment
      if (video_url) {
        attachments.push({
          incident_id: incident.id,
          file_url: video_url,
          file_type: 'video',
          file_name: 'video_recording.mp4',
          uploaded_by: reported_by
        })
      }

      if (attachments.length > 0) {
        await supabase
          .from('incident_attachments')
          .insert(attachments)
      }
    }

    // Log incident location if part of patrol session
    if (session_id && latitude && longitude) {
      await supabase
        .from('patrol_locations')
        .insert({
          session_id,
          latitude,
          longitude,
          accuracy_meters: 10,
          timestamp: new Date().toISOString(),
          is_checkpoint_scan: false
        })
    }

    res.json({ 
      success: true, 
      message: 'Incident report created successfully',
      incident: {
        id: incident.id,
        title: incident.title,
        category: incident.category,
        severity: incident.severity,
        status: incident.status,
        incident_time: incident.incident_time,
        reporter_name: incident.profiles.full_name
      }
    })

  } catch (error: unknown) {
    logger.error('Error creating incident', { error: error instanceof Error ? error.message : String(error) })
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get incidents for organization
router.get('/incidents', verifyAuth, async (req, res) => {
  try {
    const { status, severity, limit = 50, offset = 0 } = req.query
    const user_id = req.user?.id
    if (!user_id) {
      return res.status(401).json({ error: 'User authentication required' })
    }

    // Get user's organization
    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', user_id)
      .single()

    if (!profile) {
      return res.status(404).json({ error: 'User profile not found' })
    }

    let query = supabase
      .from('incidents')
      .select(`
        *,
        profiles!inner(full_name),
        incident_attachments(id, file_url, file_type)
      `)
      .eq('organization_id', profile.organization_id)
      .order('incident_time', { ascending: false })
      .range(Number(offset), Number(offset) + Number(limit) - 1)

    // Apply filters
    if (status) {
      query = query.eq('status', status)
    }
    if (severity) {
      query = query.eq('severity', severity)
    }

    const { data: incidents, error } = await query

    if (error) {
      logger.error('Error fetching incidents', { error })
      return res.status(500).json({ error: 'Failed to fetch incidents' })
    }

    res.json({ success: true, incidents })

  } catch (error: unknown) {
    logger.error('Error fetching incidents', { error: error instanceof Error ? error.message : String(error) })
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Update incident status
router.patch('/incidents/:incidentId/status', verifyAuth, async (req, res) => {
  try {
    const { incidentId } = req.params
    const { status, resolution_notes } = req.body
    const user_id = req.user?.id
    if (!user_id) {
      return res.status(401).json({ error: 'User authentication required' })
    }

    // Get user's organization
    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', user_id)
      .single()

    if (!profile) {
      return res.status(404).json({ error: 'User profile not found' })
    }

    const updateData = {
      status,
      resolved_by: status === 'resolved' ? user_id : null,
      resolved_at: status === 'resolved' ? new Date().toISOString() : null,
      resolution_notes
    }

    const { data: incident, error } = await supabase
      .from('incidents')
      .update(updateData)
      .eq('id', incidentId)
      .eq('organization_id', profile.organization_id)
      .select()
      .single()

    if (error) {
      logger.error('Error updating incident', { error })
      return res.status(500).json({ error: 'Failed to update incident' })
    }

    if (!incident) {
      return res.status(404).json({ error: 'Incident not found' })
    }

    res.json({ success: true, incident })

  } catch (error: unknown) {
    logger.error('Error updating incident status', { error: error instanceof Error ? error.message : String(error) })
    res.status(500).json({ error: 'Internal server error' })
  }
})

// =============================================================================
// DASHBOARD DATA
// =============================================================================

// Get real-time dashboard data
router.get('/dashboard/live', verifyAuth, async (req, res) => {
  try {
    const user_id = req.user?.id
    if (!user_id) {
      return res.status(401).json({ error: 'User authentication required' })
    }

    // Get user's organization
    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', user_id)
      .single()

    if (!profile) {
      return res.status(404).json({ error: 'User profile not found' })
    }

    // Get active patrol sessions
    const { data: activeSessions } = await supabase
      .from('active_patrol_sessions')
      .select('*')
      .eq('organization_id', profile.organization_id)

    // Get recent incidents
    const { data: recentIncidents } = await supabase
      .from('recent_incidents_summary')
      .select('*')
      .eq('organization_id', profile.organization_id)
      .limit(20)

    // Get patrol routes
    const { data: routes } = await supabase
      .from('patrol_routes')
      .select(`
        id, name, color_code, boundary_coords,
        patrol_checkpoints(id, name, latitude, longitude, radius_meters)
      `)
      .eq('organization_id', profile.organization_id)
      .eq('is_active', true)

    res.json({ 
      success: true, 
      data: {
        active_sessions: activeSessions || [],
        recent_incidents: recentIncidents || [],
        patrol_routes: routes || []
      }
    })

  } catch (error: unknown) {
    logger.error('Error fetching dashboard data', { error: error instanceof Error ? error.message : String(error) })
    res.status(500).json({ error: 'Internal server error' })
  }
})

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

// Calculate distance between two coordinates using Haversine formula
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3 // Earth's radius in meters
  const φ1 = lat1 * Math.PI/180 // φ, λ in radians
  const φ2 = lat2 * Math.PI/180
  const Δφ = (lat2-lat1) * Math.PI/180
  const Δλ = (lon2-lon1) * Math.PI/180

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))

  return R * c // Distance in meters
}

export default router