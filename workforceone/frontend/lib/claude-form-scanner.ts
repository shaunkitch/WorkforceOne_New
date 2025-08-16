import Anthropic from '@anthropic-ai/sdk'

export interface DetectedField {
  id: string
  type: string
  label: string
  placeholder?: string
  required: boolean
  options?: string[]
  validation?: any
  settings?: any
  position?: {
    x: number
    y: number
    width: number
    height: number
  }
  confidence: number
}

export interface FormAnalysisResult {
  success: boolean
  title: string
  description: string
  fields: DetectedField[]
  layoutType: 'single-column' | 'multi-column' | 'grid' | 'complex'
  confidence: number
  error?: string
}

export class ClaudeFormScanner {
  private anthropic: Anthropic | null = null

  constructor() {
    // Initialize only if API key is available
    if (typeof window === 'undefined' && process.env.ANTHROPIC_API_KEY) {
      this.anthropic = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY,
      })
    }
  }

  async analyzeFormImage(imageBuffer: Buffer, mimeType: string): Promise<FormAnalysisResult> {
    if (!this.anthropic) {
      throw new Error('Claude API not available. Please configure ANTHROPIC_API_KEY.')
    }

    try {
      // Convert buffer to base64
      const base64Image = imageBuffer.toString('base64')
      
      const response = await this.anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4000,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: mimeType as any,
                  data: base64Image,
                }
              },
              {
                type: 'text',
                text: this.getFormAnalysisPrompt()
              }
            ]
          }
        ]
      })

      const result = this.parseClaudeResponse(response.content[0]?.text || '')
      return result

    } catch (error) {
      console.error('Claude API Error:', error)
      return {
        success: false,
        title: '',
        description: '',
        fields: [],
        layoutType: 'single-column',
        confidence: 0,
        error: error instanceof Error ? error.message : 'Analysis failed'
      }
    }
  }

  private getFormAnalysisPrompt(): string {
    return `
Analyze this form image and extract its structure to create a digital form. Please provide a detailed JSON response with the following format:

{
  "title": "Form title (extract from header or create descriptive title)",
  "description": "Brief description of the form's purpose",
  "layoutType": "single-column|multi-column|grid|complex",
  "confidence": 0.95,
  "fields": [
    {
      "id": "unique_field_id",
      "type": "text|textarea|email|number|select|multiselect|radio|checkbox|signature|file|rating|section",
      "label": "Field label text",
      "placeholder": "Placeholder or hint text if visible",
      "required": true/false,
      "options": ["option1", "option2"] // for select, radio, checkbox fields only
      "position": {"x": 10, "y": 50, "width": 200, "height": 30},
      "confidence": 0.90,
      "settings": {
        // Field-specific settings based on type
        "maxLength": 100, // for text fields
        "rows": 4, // for textarea
        "max": 5, // for rating
        "accept": "image/*" // for file upload
      }
    }
  ]
}

FIELD TYPE MAPPING GUIDELINES:
- "text": Single-line text inputs, name fields, short answers
- "textarea": Multi-line text areas, comments, descriptions
- "email": Email address fields
- "number": Numeric inputs, quantities, ages
- "select": Dropdown menus with single selection
- "multiselect": Dropdowns allowing multiple selections
- "radio": Radio button groups (single choice)
- "checkbox": Checkbox groups (multiple choice) or single checkboxes
- "signature": Signature lines or signature boxes
- "file": File upload areas or attachment fields
- "rating": Star ratings or numerical scales
- "section": Section headers, titles, or dividers

DETECTION RULES:
1. Look for form elements like boxes, lines, checkboxes, radio buttons
2. Identify field labels and associate them with nearby input areas
3. Detect if fields are required (look for asterisks, "required" text)
4. For choice fields, extract all visible options
5. Estimate field positions relative to image dimensions
6. Assign confidence scores based on clarity and certainty
7. Group related fields logically
8. Identify the overall layout pattern

IMPORTANT:
- Return valid JSON only, no additional text
- Be thorough but accurate
- Use high confidence scores only when certain
- Create meaningful field IDs (lowercase, underscores)
- Preserve the logical order of fields as they appear on the form
- If you see signature lines, always map them to "signature" type
- For unclear elements, use lower confidence scores
    `
  }

  private parseClaudeResponse(response: string): FormAnalysisResult {
    try {
      // Clean the response to extract JSON
      const jsonMatch = response.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error('No valid JSON found in response')
      }

      const parsed = JSON.parse(jsonMatch[0])
      
      // Validate and process the response
      const fields: DetectedField[] = (parsed.fields || []).map((field: any, index: number) => ({
        id: field.id || `field_${index + 1}`,
        type: this.validateFieldType(field.type),
        label: field.label || `Field ${index + 1}`,
        placeholder: field.placeholder,
        required: Boolean(field.required),
        options: Array.isArray(field.options) ? field.options : undefined,
        position: field.position,
        confidence: Math.min(Math.max(field.confidence || 0.5, 0), 1),
        settings: field.settings || {},
        validation: this.generateValidation(field.type)
      }))

      return {
        success: true,
        title: parsed.title || 'Scanned Form',
        description: parsed.description || 'Form created from image scan',
        fields,
        layoutType: parsed.layoutType || 'single-column',
        confidence: Math.min(Math.max(parsed.confidence || 0.7, 0), 1)
      }

    } catch (error) {
      console.error('Failed to parse Claude response:', error)
      return {
        success: false,
        title: 'Parse Error',
        description: 'Failed to parse form analysis',
        fields: [],
        layoutType: 'single-column',
        confidence: 0,
        error: error instanceof Error ? error.message : 'Parse failed'
      }
    }
  }

  private validateFieldType(type: string): string {
    const validTypes = [
      'text', 'textarea', 'email', 'number', 'select', 'multiselect',
      'radio', 'checkbox', 'signature', 'file', 'rating', 'section'
    ]
    
    return validTypes.includes(type) ? type : 'text'
  }

  private generateValidation(type: string): any {
    switch (type) {
      case 'email':
        return { pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ }
      case 'number':
        return { type: 'number' }
      default:
        return {}
    }
  }

  // Helper method to optimize image for analysis
  async optimizeImageForAnalysis(file: File): Promise<{ buffer: Buffer; mimeType: string }> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      const img = new Image()

      img.onload = () => {
        // Optimize size while maintaining aspect ratio
        const maxDimension = 1024
        let { width, height } = img
        
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = (height * maxDimension) / width
            width = maxDimension
          } else {
            width = (width * maxDimension) / height
            height = maxDimension
          }
        }

        canvas.width = width
        canvas.height = height
        
        // Draw optimized image
        ctx?.drawImage(img, 0, 0, width, height)
        
        canvas.toBlob((blob) => {
          if (!blob) {
            reject(new Error('Failed to optimize image'))
            return
          }

          const reader = new FileReader()
          reader.onload = () => {
            const arrayBuffer = reader.result as ArrayBuffer
            const buffer = Buffer.from(arrayBuffer)
            resolve({
              buffer,
              mimeType: blob.type
            })
          }
          reader.onerror = () => reject(new Error('Failed to read optimized image'))
          reader.readAsArrayBuffer(blob)
        }, 'image/jpeg', 0.8)
      }

      img.onerror = () => reject(new Error('Failed to load image'))
      img.src = URL.createObjectURL(file)
    })
  }
}

export const claudeFormScanner = new ClaudeFormScanner()