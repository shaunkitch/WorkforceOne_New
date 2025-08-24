import dotenv from 'dotenv'
import express from 'express'
import cors from 'cors'
import { createLogger } from './utils/logger'

// Load environment variables
dotenv.config()

const app = express()
const PORT = process.env.PORT || 5000
const logger = createLogger('test-server')

// Basic middleware
app.use(cors())
app.use(express.json())

// Test route
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'WorkforceOne Backend Test'
  })
})

// Test email service
app.get('/test-email', async (req, res) => {
  try {
    const nodemailer = require('nodemailer')
    
    // Create test account
    const testAccount = await nodemailer.createTestAccount()
    logger.info('Test account created', { user: testAccount.user })
    
    // Create transporter
    const transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass
      }
    })
    
    res.json({ 
      success: true,
      message: 'Email service test passed',
      testAccount: testAccount.user
    })
  } catch (error: unknown) {
    logger.error('Email test failed', { error: error instanceof Error ? error.message : String(error) })
    res.status(500).json({ 
      success: false,
      error: error instanceof Error ? error.message : String(error) 
    })
  }
})

app.listen(PORT, () => {
  logger.info('Test server started', { port: PORT, environment: process.env.NODE_ENV || 'development' })
})

export default app