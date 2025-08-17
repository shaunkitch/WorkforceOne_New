import { Router } from 'express'
import { monitoringService } from '../services/monitoring'
import { authenticateUser, requireGlobalAdmin } from '../middleware/auth'

const router = Router()

// Get current system status
router.get('/status', authenticateUser, requireGlobalAdmin, async (req, res) => {
  try {
    const status = await monitoringService.getSystemStatus()
    res.json({
      success: true,
      data: status
    })
  } catch (error) {
    console.error('Error getting system status:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to get system status'
    })
  }
})

// Get active alerts
router.get('/alerts', authenticateUser, requireGlobalAdmin, async (req, res) => {
  try {
    const alerts = await monitoringService.getActiveAlerts()
    res.json({
      success: true,
      data: alerts
    })
  } catch (error) {
    console.error('Error getting alerts:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to get alerts'
    })
  }
})

// Acknowledge alert
router.post('/alerts/:alertId/acknowledge', authenticateUser, requireGlobalAdmin, async (req, res) => {
  try {
    const { alertId } = req.params
    const { acknowledgedBy } = req.body

    const success = await monitoringService.acknowledgeAlert(alertId, acknowledgedBy)
    
    if (success) {
      res.json({
        success: true,
        message: 'Alert acknowledged successfully'
      })
    } else {
      res.status(400).json({
        success: false,
        error: 'Failed to acknowledge alert'
      })
    }
  } catch (error) {
    console.error('Error acknowledging alert:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to acknowledge alert'
    })
  }
})

// Resolve alert
router.post('/alerts/:alertId/resolve', authenticateUser, requireGlobalAdmin, async (req, res) => {
  try {
    const { alertId } = req.params

    const success = await monitoringService.resolveAlert(alertId)
    
    if (success) {
      res.json({
        success: true,
        message: 'Alert resolved successfully'
      })
    } else {
      res.status(400).json({
        success: false,
        error: 'Failed to resolve alert'
      })
    }
  } catch (error) {
    console.error('Error resolving alert:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to resolve alert'
    })
  }
})

// Get health score
router.get('/health', authenticateUser, requireGlobalAdmin, async (req, res) => {
  try {
    const healthScore = await monitoringService.calculateHealthScore()
    res.json({
      success: true,
      data: healthScore
    })
  } catch (error) {
    console.error('Error getting health score:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to get health score'
    })
  }
})

// Get metrics history
router.get('/metrics', authenticateUser, requireGlobalAdmin, async (req, res) => {
  try {
    const { metricType, source, hours } = req.query
    
    const metrics = await monitoringService.getMetricsHistory(
      metricType as string,
      source as string,
      hours ? parseInt(hours as string) : 24
    )
    
    res.json({
      success: true,
      data: metrics
    })
  } catch (error) {
    console.error('Error getting metrics history:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to get metrics history'
    })
  }
})

// Record custom metric (for testing or manual entry)
router.post('/metrics', authenticateUser, requireGlobalAdmin, async (req, res) => {
  try {
    const { metricType, value, unit, source, metadata } = req.body

    if (!metricType || value === undefined || !unit || !source) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: metricType, value, unit, source'
      })
    }

    const metricId = await monitoringService.recordMetric({
      metricType,
      value: parseFloat(value),
      unit,
      source,
      metadata
    })

    if (metricId) {
      res.json({
        success: true,
        data: { metricId },
        message: 'Metric recorded successfully'
      })
    } else {
      res.status(400).json({
        success: false,
        error: 'Failed to record metric'
      })
    }
  } catch (error) {
    console.error('Error recording metric:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to record metric'
    })
  }
})

// Force collect metrics now
router.post('/collect', authenticateUser, requireGlobalAdmin, async (req, res) => {
  try {
    await monitoringService.collectAllMetrics()
    res.json({
      success: true,
      message: 'Metrics collection triggered successfully'
    })
  } catch (error) {
    console.error('Error collecting metrics:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to collect metrics'
    })
  }
})

// Start monitoring
router.post('/start', authenticateUser, requireGlobalAdmin, async (req, res) => {
  try {
    const { intervalMinutes } = req.body
    monitoringService.startMonitoring(intervalMinutes || 5)
    res.json({
      success: true,
      message: 'Monitoring started successfully'
    })
  } catch (error) {
    console.error('Error starting monitoring:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to start monitoring'
    })
  }
})

// Stop monitoring
router.post('/stop', authenticateUser, requireGlobalAdmin, async (req, res) => {
  try {
    monitoringService.stopMonitoring()
    res.json({
      success: true,
      message: 'Monitoring stopped successfully'
    })
  } catch (error) {
    console.error('Error stopping monitoring:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to stop monitoring'
    })
  }
})

export default router