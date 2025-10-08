import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface DetectedEntity {
  type: 'condition' | 'impairment' | 'device' | 'medication' | 'symptom';
  name: string;
  confidence: number;
}

export interface CareNeed {
  category: 'mobility' | 'medical' | 'daily_living' | 'cognitive' | 'emotional' | 'safety';
  description: string;
  priority: 'high' | 'medium' | 'low';
}

export interface ServiceSuggestion {
  serviceId: string;
  serviceName: string;
  level: 'full' | 'hand_on' | 'occasional' | 'light_oversight';
  confidence: number;
  reasoning: string;
}

export interface AIAnalysisResult {
  detectedEntities: DetectedEntity[];
  careNeeds: CareNeed[];
  suggestedServices: ServiceSuggestion[];
  followUpQuestions: string[];
  isComplete: boolean;
  confidenceScore: number;
}

export class PatientAIService {
  private static readonly SYSTEM_PROMPT = `You are a medical AI assistant helping families describe their loved ones' care needs. Your role is to:

1. Analyze medical descriptions and extract key information
2. Identify care needs and required services
3. Ask targeted follow-up questions to gather missing information
4. Suggest appropriate care services with confidence levels

Guidelines:
- Be empathetic and supportive in your responses
- Focus on practical care needs, not medical diagnosis
- Ask specific, actionable questions
- Consider safety, mobility, medical, daily living, cognitive, and emotional needs
- Provide confidence scores (0-1) for your suggestions
- Limit follow-up questions to 2-3 at a time
- Mark analysis as complete when you have enough information for care planning

When suggesting services, use the exact service names from the list above.`;

  static async analyzeInput(text: string, availableServices: Array<{id: string, name: string, slug: string}> = []): Promise<AIAnalysisResult> {
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: `${this.SYSTEM_PROMPT}

Available care services include:
${availableServices.map(s => `- ${s.name} (slug: ${s.slug})`).join('\n')}

When suggesting services, use the exact service names from the list above.`
          },
          {
            role: "user",
            content: `Analyze this medical description and provide a structured response:

"${text}"

Please respond with a JSON object containing:
{
  "detectedEntities": [{"type": "condition|impairment|device|medication|symptom", "name": "entity name", "confidence": 0.0-1.0}],
  "careNeeds": [{"category": "mobility|medical|daily_living|cognitive|emotional|safety", "description": "need description", "priority": "high|medium|low"}],
  "suggestedServices": [{"serviceName": "exact service name from list", "level": "full|hand_on|occasional|light_oversight", "confidence": 0.0-1.0, "reasoning": "why this service is needed"}],
  "followUpQuestions": ["question 1", "question 2", "question 3"],
  "isComplete": true/false,
  "confidenceScore": 0.0-1.0
}`
          }
        ],
        temperature: 0.3,
        max_tokens: 1500,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response from OpenAI');
      }

      // Parse JSON response
      const result = JSON.parse(content);
      
      // Map service names to UUIDs
      const mappedServices = (result.suggestedServices || []).map((service: any) => {
        const matchingService = availableServices.find(s => 
          s.name.toLowerCase() === service.serviceName.toLowerCase()
        );
        
        return {
          serviceId: matchingService?.id || service.serviceName, // Fallback to name if no match
          serviceName: service.serviceName,
          level: service.level,
          confidence: service.confidence,
          reasoning: service.reasoning,
        };
      });
      
      // Validate and structure the response
      return {
        detectedEntities: result.detectedEntities || [],
        careNeeds: result.careNeeds || [],
        suggestedServices: mappedServices,
        followUpQuestions: result.followUpQuestions || [],
        isComplete: result.isComplete || false,
        confidenceScore: result.confidenceScore || 0.5,
      };
    } catch (error) {
      console.error('Error in AI analysis:', error);
      throw new Error('Failed to analyze input with AI');
    }
  }

  static async generateFollowUp(condition: string, previousContext: string): Promise<string[]> {
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: `You are a medical AI assistant. Generate 2-3 specific, actionable follow-up questions about "${condition}" to help determine care needs. Be empathetic and practical.`
          },
          {
            role: "user",
            content: `Previous context: "${previousContext}"

Generate 2-3 follow-up questions specifically about ${condition} to help determine care requirements. Focus on practical care needs, not medical diagnosis.`
          }
        ],
        temperature: 0.4,
        max_tokens: 300,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response from OpenAI');
      }

      // Extract questions from the response
      const questions = content
        .split('\n')
        .filter(line => line.trim().length > 0)
        .map(line => line.replace(/^\d+\.\s*/, '').replace(/^[-*]\s*/, '').trim())
        .filter(q => q.length > 10)
        .slice(0, 3);

      return questions;
    } catch (error) {
      console.error('Error generating follow-up questions:', error);
      return [`Can you tell me more about how ${condition} affects daily activities?`];
    }
  }

  static async suggestServices(analysis: Partial<AIAnalysisResult>): Promise<ServiceSuggestion[]> {
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: `You are a care service recommendation AI. Based on detected conditions and care needs, suggest appropriate care services with confidence levels.

Available services:
- Personal Care (bathing, dressing, grooming)
- Medication Management  
- Meal Preparation & Nutrition
- Mobility Assistance & Transfers
- Housekeeping & Laundry
- Transportation
- Companionship & Social Support
- Memory Care & Cognitive Support
- Physical Therapy Support
- Medical Appointment Assistance
- Safety Monitoring
- Respite Care

Respond with JSON array of service suggestions.`
          },
          {
            role: "user",
            content: `Based on this analysis, suggest appropriate care services:

Detected Entities: ${JSON.stringify(analysis.detectedEntities || [])}
Care Needs: ${JSON.stringify(analysis.careNeeds || [])}

Respond with JSON array:
[{"serviceId": "service_id", "serviceName": "service name", "level": "full|hand_on|occasional|light_oversight", "confidence": 0.0-1.0, "reasoning": "why this service is needed"}]`
          }
        ],
        temperature: 0.3,
        max_tokens: 800,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response from OpenAI');
      }

      const suggestions = JSON.parse(content);
      return Array.isArray(suggestions) ? suggestions : [];
    } catch (error) {
      console.error('Error suggesting services:', error);
      return [];
    }
  }
}
