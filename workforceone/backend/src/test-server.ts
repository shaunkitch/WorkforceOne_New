import dotenv from 'dotenv'
import express from 'express'
import cors from 'cors'

// Load environment variables
dotenv.config()

const app = express()
const PORT = process.env.PORT || 5000

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
    console.log('Test account created:', testAccount.user)
    
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
  } catch (error) {
    console.error('Email test failed:', error)
    res.status(500).json({ 
      success: false,
      error: error.message 
    })
  }
})

app.listen(PORT, () => {
  console.log(`🚀 Test server running on port ${PORT}`)
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`)
})

export default app