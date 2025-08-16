import express from 'express';
import multer from 'multer';
import { ClaudeFormAnalysisService } from '../services/claudeFormAnalysis.js';

const router = express.Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow only image files
    const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, and WebP are allowed.'));
    }
  },
});

// Initialize Claude service
const claudeService = new ClaudeFormAnalysisService();

/**
 * POST /api/forms/scan
 * Analyzes an uploaded form image using Claude AI
 */
router.post('/scan', upload.single('image'), async (req, res) => {
  try {
    // Validate that file was uploaded
    if (!req.file) {
      return res.status(400).json({
        error: 'No image file provided',
        message: 'Please upload an image file to scan',
      });
    }

    // Validate Claude service configuration
    const configValidation = claudeService.validateConfiguration();
    if (!configValidation.isValid) {
      console.error('Claude service configuration error:', configValidation.error);
      return res.status(500).json({
        error: 'Service configuration error',
        message: 'AI analysis service is not properly configured',
      });
    }

    // Validate file size
    if (req.file.size > 10 * 1024 * 1024) {
      return res.status(400).json({
        error: 'File too large',
        message: 'File size must be less than 10MB',
      });
    }

    // Validate file type
    const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedMimes.includes(req.file.mimetype)) {
      return res.status(400).json({
        error: 'Invalid file type',
        message: 'Only JPEG, PNG, and WebP images are supported',
      });
    }

    console.log(`Processing form scan for file: ${req.file.originalname} (${req.file.size} bytes)`);

    // Analyze the form image with Claude
    const analysisResult = await claudeService.analyzeFormImage(
      req.file.buffer,
      req.file.mimetype
    );

    console.log(`Form analysis completed. Found ${analysisResult.detected_fields.length} fields with ${analysisResult.confidence_score}% confidence`);

    // Return the analysis results
    res.json(analysisResult);

  } catch (error) {
    console.error('Form scan error:', error);

    // Handle specific error types
    if (error instanceof multer.MulterError) {
      if (error.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          error: 'File too large',
          message: 'File size must be less than 10MB',
        });
      }
      if (error.code === 'LIMIT_UNEXPECTED_FILE') {
        return res.status(400).json({
          error: 'Invalid file field',
          message: 'Please use the "image" field for file upload',
        });
      }
    }

    // Handle Claude API errors
    if (error.message?.includes('Claude') || error.message?.includes('Anthropic')) {
      return res.status(502).json({
        error: 'AI analysis failed',
        message: 'The AI service is temporarily unavailable. Please try again later.',
      });
    }

    // Generic error response
    res.status(500).json({
      error: 'Internal server error',
      message: 'An unexpected error occurred while processing your request',
    });
  }
});

/**
 * GET /api/forms/scan/health
 * Health check endpoint for the form scanning service
 */
router.get('/scan/health', (req, res) => {
  try {
    const configValidation = claudeService.validateConfiguration();
    
    res.json({
      status: configValidation.isValid ? 'healthy' : 'unhealthy',
      claude_configured: configValidation.isValid,
      error: configValidation.error || undefined,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      error: 'Service check failed',
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * GET /api/forms/scan/info
 * Returns information about the scanning service capabilities
 */
router.get('/scan/info', (req, res) => {
  res.json({
    service: 'Claude Form Scanner',
    version: '1.0.0',
    supported_formats: ['image/jpeg', 'image/png', 'image/webp'],
    max_file_size: '10MB',
    supported_field_types: [
      'text_field',
      'textarea', 
      'email_field',
      'number_field',
      'dropdown',
      'radio_button',
      'checkbox',
      'signature_field',
      'file_upload',
      'rating',
      'scale'
    ],
    features: [
      'AI-powered field detection',
      'Label extraction',
      'Field type identification',
      'Layout analysis',
      'Confidence scoring'
    ]
  });
});

export default router;