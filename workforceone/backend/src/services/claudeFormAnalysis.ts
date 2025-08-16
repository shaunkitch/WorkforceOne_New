import Anthropic from '@anthropic-ai/sdk';

interface DetectedField {
  id: string;
  type: string;
  label: string;
  coordinates: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  confidence: number;
  options?: string[];
  suggested_type?: string;
  raw_text?: string;
}

interface FormAnalysisResult {
  detected_fields: DetectedField[];
  form_title?: string;
  form_description?: string;
  layout_type: 'single_column' | 'two_column' | 'grid' | 'complex';
  confidence_score: number;
  processing_notes?: string[];
}

export class ClaudeFormAnalysisService {
  private client: Anthropic;

  constructor() {
    this.client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }

  /**
   * Analyzes a form image using Claude's vision capabilities
   */
  async analyzeFormImage(imageBuffer: Buffer, mimeType: string): Promise<FormAnalysisResult> {
    try {
      // Convert image buffer to base64
      const base64Image = imageBuffer.toString('base64');

      // Create the system prompt for form analysis
      const systemPrompt = this.getSystemPrompt();

      // Create the user prompt with the image
      const userPrompt = this.getUserPrompt();

      const response = await this.client.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 4000,
        temperature: 0.1,
        system: systemPrompt,
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
                },
              },
              {
                type: 'text',
                text: userPrompt,
              },
            ],
          },
        ],
      });

      // Parse the response
      const content = response.content[0];
      if (content.type !== 'text') {
        throw new Error('Unexpected response type from Claude');
      }

      return this.parseClaudeResponse(content.text);
    } catch (error) {
      console.error('Error analyzing form with Claude:', error);
      throw new Error('Failed to analyze form image');
    }
  }

  /**
   * Creates the system prompt for form analysis
   */
  private getSystemPrompt(): string {
    return `You are an expert at analyzing paper forms and converting them to digital form structures. 

Your task is to analyze uploaded form images and extract:
1. Form title and description
2. All form fields with their types, labels, and positions
3. Field options for selection fields (radio, checkbox, dropdown)
4. Overall form layout and structure

Supported field types:
- text_field: Single line text input
- textarea: Multi-line text input  
- email_field: Email input
- number_field: Numeric input
- dropdown: Single selection dropdown
- radio_button: Radio button group (single selection)
- checkbox: Checkbox group (multiple selection)
- signature_field: Signature capture area
- file_upload: File upload field
- rating: Star rating or numeric rating
- scale: Likert scale or rating scale

Always respond with valid JSON in the exact format specified in the user prompt.
Be thorough but accurate - only detect fields that are clearly visible and identifiable.
Estimate coordinates as percentages of the image dimensions (0-100).
Provide confidence scores based on how clearly you can identify each element.`;
  }

  /**
   * Creates the user prompt for form analysis
   */
  private getUserPrompt(): string {
    return `Please analyze this form image and extract all form fields, labels, and structure. 

Respond with a JSON object in this exact format:

{
  "form_title": "Detected form title or null if not found",
  "form_description": "Detected form description or null if not found", 
  "layout_type": "single_column|two_column|grid|complex",
  "confidence_score": 85,
  "processing_notes": ["Any important observations or limitations"],
  "detected_fields": [
    {
      "id": "field_1",
      "type": "text_field",
      "label": "Field label text",
      "coordinates": {
        "x": 10,
        "y": 20,
        "width": 30,
        "height": 5
      },
      "confidence": 95,
      "suggested_type": "text_field",
      "raw_text": "Raw text if applicable",
      "options": ["Option 1", "Option 2"] // Only for selection fields
    }
  ]
}

Instructions:
1. Look for form titles at the top of the document
2. Identify all input fields, checkboxes, radio buttons, dropdowns, etc.
3. Extract the label text for each field
4. For selection fields (radio/checkbox), extract all available options
5. Estimate coordinates as percentages (0-100) of image dimensions
6. Assign confidence scores (0-100) based on clarity
7. Determine overall layout type based on field arrangement
8. Note any text that's hard to read or ambiguous fields

Focus on accuracy over quantity - only include fields you can clearly identify.`;
  }

  /**
   * Parses Claude's JSON response and validates the structure
   */
  private parseClaudeResponse(responseText: string): FormAnalysisResult {
    try {
      // Extract JSON from the response (Claude might include extra text)
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in Claude response');
      }

      const parsed = JSON.parse(jsonMatch[0]);

      // Validate required fields
      if (!parsed.detected_fields || !Array.isArray(parsed.detected_fields)) {
        throw new Error('Invalid detected_fields in response');
      }

      // Process and validate each detected field
      const detectedFields: DetectedField[] = parsed.detected_fields.map((field: any, index: number) => {
        return {
          id: field.id || `field_${index + 1}`,
          type: field.type || 'text_field',
          label: field.label || `Field ${index + 1}`,
          coordinates: {
            x: Math.max(0, Math.min(100, field.coordinates?.x || 0)),
            y: Math.max(0, Math.min(100, field.coordinates?.y || 0)),
            width: Math.max(1, Math.min(100, field.coordinates?.width || 20)),
            height: Math.max(1, Math.min(100, field.coordinates?.height || 5)),
          },
          confidence: Math.max(0, Math.min(100, field.confidence || 50)),
          suggested_type: field.suggested_type || field.type || 'text_field',
          raw_text: field.raw_text,
          options: Array.isArray(field.options) ? field.options : undefined,
        };
      });

      const result: FormAnalysisResult = {
        detected_fields: detectedFields,
        form_title: parsed.form_title || undefined,
        form_description: parsed.form_description || undefined,
        layout_type: this.validateLayoutType(parsed.layout_type),
        confidence_score: Math.max(0, Math.min(100, parsed.confidence_score || 50)),
        processing_notes: Array.isArray(parsed.processing_notes) ? parsed.processing_notes : [],
      };

      return result;
    } catch (error) {
      console.error('Error parsing Claude response:', error);
      
      // Return a fallback result if parsing fails
      return {
        detected_fields: [],
        layout_type: 'single_column',
        confidence_score: 0,
        processing_notes: ['Failed to parse form analysis results'],
      };
    }
  }

  /**
   * Validates and normalizes layout type
   */
  private validateLayoutType(layoutType: string): 'single_column' | 'two_column' | 'grid' | 'complex' {
    const validTypes = ['single_column', 'two_column', 'grid', 'complex'];
    return validTypes.includes(layoutType) ? layoutType as any : 'single_column';
  }

  /**
   * Validates that the service is properly configured
   */
  public validateConfiguration(): { isValid: boolean; error?: string } {
    if (!process.env.ANTHROPIC_API_KEY) {
      return {
        isValid: false,
        error: 'ANTHROPIC_API_KEY environment variable is not set',
      };
    }

    return { isValid: true };
  }
}

export default ClaudeFormAnalysisService;