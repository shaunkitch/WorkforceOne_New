import express from 'express'
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { createLogger } from '../utils/logger'

// Load environment variables
dotenv.config()

const logger = createLogger('auth-middleware')

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

// Middleware to verify Supabase JWT token
export const authenticateUser = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const authHeader = req.headers.authorization
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No valid authorization token provided' })
  }

  const token = authHeader.substring(7)
  
  try {
    const { data: { user }, error } = await supabase.auth.getUser(token)
    
    if (error || !user) {
      return res.status(401).json({ error: 'Invalid token' })
    }

    // Get user profile to check permissions
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return res.status(401).json({ error: 'User profile not found' })
    }

    req.user = user
    req.userProfile = profile
    next()
  } catch (error: unknown) {
    logger.error('Authentication error', { error: error instanceof Error ? error.message : String(error) })
    return res.status(401).json({ error: 'Authentication failed' })
  }
}

// Middleware to require global admin role
export const requireGlobalAdmin = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const userProfile = req.userProfile
  
  if (!userProfile || userProfile.role !== 'admin') {
    return res.status(403).json({ error: 'Insufficient permissions. Global admin access required.' })
  }
  
  next()
}

// Middleware to require admin or manager role
export const requireAdminOrManager = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const userProfile = req.userProfile
  
  if (!userProfile || (userProfile.role !== 'admin' && userProfile.role !== 'manager')) {
    return res.status(403).json({ error: 'Insufficient permissions. Admin or manager access required.' })
  }
  
  next()
}