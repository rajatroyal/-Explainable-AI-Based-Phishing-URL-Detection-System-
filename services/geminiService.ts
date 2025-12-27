
import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult, RiskLevel } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

const DETECTION_INSTRUCTION = `
You are a senior cybersecurity analyst specializing in NLP and real-time threat intelligence.
Your task is to analyze the provided text or URL for phishing indicators using your internal knowledge and the GOOGLE SEARCH tool.

CRITICAL INSTRUCTIONS FOR EXACT DATA:
1. When a URL is provided, use Google Search to verify its domain age, official status, and if it appears on any threat blacklists.
2. DO NOT default to a "safe" score like 85%. If a domain is 100% verified as official (e.g., google.com, amazon.com), the confidenceScore (RISK) MUST be 0-1%. 
3. If a domain is definitely a known phishing site, the confidenceScore MUST be 95-100%.
4. "confidenceScore" in this schema represents the PROBABILITY OF THREAT (Risk Level).
5. For "threatsDetected", provide specific details based on real-time findings.
Return a valid JSON object matching the requested schema.
`;

const SIMULATION_INSTRUCTION = `
You are a "Red Team" social engineering expert providing security awareness training.
Your task is to analyze a "draft" phishing message provided by a student and evaluate its effectiveness.
1. Rate the "Deception Score" (0-100) based on how likely a typical employee is to fall for it.
2. Identify "Persuasion Tactics" used, providing a severity and description.
3. Provide a "Critique" in the summary.
4. Suggest "Improvements" to make it more deceptive for training.
Return a valid JSON object matching the requested schema.
`;

export const analyzeContent = async (content: string, isSimulation: boolean = false): Promise<AnalysisResult> => {
  // Use googleSearch tool for real-time verification in detection mode
  const tools = isSimulation ? [] : [{ googleSearch: {} }];

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: content,
    config: {
      systemInstruction: isSimulation ? SIMULATION_INSTRUCTION : DETECTION_INSTRUCTION,
      tools: tools as any,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          isPhishing: { type: Type.BOOLEAN },
          confidenceScore: { type: Type.NUMBER, description: isSimulation ? 'Deception Score' : 'Risk Percentage (0-100)' },
          riskLevel: { 
            type: Type.STRING, 
            enum: Object.values(RiskLevel) 
          },
          threatsDetected: { 
            type: Type.ARRAY, 
            items: { 
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                severity: { type: Type.STRING, enum: Object.values(RiskLevel) },
                description: { type: Type.STRING }
              },
              required: ['name', 'severity', 'description']
            }
          },
          summary: { type: Type.STRING },
          recommendations: { 
            type: Type.ARRAY, 
            items: { type: Type.STRING }
          },
          extractedLinks: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                url: { type: Type.STRING },
                isSuspicious: { type: Type.BOOLEAN },
                reason: { type: Type.STRING }
              },
              required: ['url', 'isSuspicious', 'reason']
            }
          }
        },
        required: [
          'isPhishing', 
          'confidenceScore', 
          'riskLevel', 
          'threatsDetected', 
          'summary', 
          'recommendations', 
          'extractedLinks'
        ],
      },
    },
  });

  try {
    const data = JSON.parse(response.text || '{}');
    
    // Extract grounding sources if they exist
    const groundingSources = response.candidates?.[0]?.groundingMetadata?.groundingChunks?.map((chunk: any) => ({
      title: chunk.web?.title || 'External Source',
      uri: chunk.web?.uri || ''
    })).filter((s: any) => s.uri) || [];

    return {
      ...data,
      isSimulation,
      groundingSources,
      analyzedAt: new Date().toISOString()
    };
  } catch (error) {
    console.error('Failed to parse Gemini response:', error);
    throw new Error('Analysis failed. The security engine could not process the request.');
  }
};
