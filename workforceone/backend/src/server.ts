import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import compression from 'compression'
import rateLimit from 'express-rate-limit'
import dotenv from 'dotenv'
import { createLogger } from './utils/logger'

// Import routes
import invitationRoutes from './routes/simple-invitations'
import emailIntegrationRoutes from './routes/email-integrations'
import formScanRoutes from './routes/formScan'
import securityRoutes from './routes/security'

// Load environment variables
dotenv.config()

const app = express()
const PORT = process.env.PORT || 5000
const logger = createLogger('server')

// Security middleware
app.use(helmet())

// Enable CORS
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}))

// Request logging
app.use(morgan('combined'))

// Compression middleware
app.use(compression())

// Body parsing middleware
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
})
app.use(limiter)

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'WorkforceOne Backend'
  })
})

// API routes
app.use('/api/invitations', invitationRoutes)
app.use('/api/email-integrations', emailIntegrationRoutes)
app.use('/api/forms', formScanRoutes)
app.use('/api/security', securityRoutes)

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Route not found',
    path: req.originalUrl 
  })
})

// Global error handler
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Global error handler', { 
    error: error instanceof Error ? error.message : String(error),
    stack: error.stack,
    path: req.originalUrl,
    method: req.method
  })
  
  res.status(error.status || 500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : 'Something went wrong',
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  })
})

// Start server
app.listen(PORT, () => {
  logger.info('Server started', { 
    port: PORT, 
    environment: process.env.NODE_ENV || 'development',
    frontendUrl: process.env.NODE_ENV !== 'production' ? (process.env.FRONTEND_URL || 'http://localhost:3000') : undefined
  })
})

export default app