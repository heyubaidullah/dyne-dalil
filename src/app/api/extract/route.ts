import { z } from 'zod';
import { AIWrapperError, generateStructuredOutput } from '@/lib/ai/wrapper';

// 1. Define the required schema for Dalil's Signal Extraction
const extractionSchema = z.object({
  summary: z.string(),
  painPoints: z.array(z.string()),
  objections: z.array(z.string()),
  requests: z.array(z.string()),
  urgency: z.enum(['low', 'medium', 'high']),
  likelySegment: z.string(),
  quotes: z.array(z.string()),
  confidenceScore: z.number().min(0).max(100)
});

// Infer the TypeScript type directly from the schema
type ExtractionResult = z.infer<typeof extractionSchema>;

export async function POST(request: Request) {
  const { transcript } = await request.json();

  const systemPrompt = `You are an expert product manager analyzing raw customer conversation transcripts. 
  Extract the core data points strictly following the requested JSON schema.`;

  try {
    const result: ExtractionResult = await generateStructuredOutput({
      provider: 'gemini', 
      model: 'gemini-1.5-pro', // Pro model recommended for complex reasoning
      systemInstruction: systemPrompt,
      userPrompt: `Extract insights from the following transcript:\n\n${transcript}`,
      schema: extractionSchema,
      temperature: 0.1,
    });

    // result is now fully typed and guaranteed to contain painPoints, objections, etc.
    return Response.json({ success: true, data: result });

  } catch (error) {
    const fallbackStatus = 500;

    if (error instanceof AIWrapperError) {
      const statusByCode: Partial<Record<AIWrapperError['code'], number>> = {
        MISSING_API_KEY: 500,
        PROVIDER_HTTP_ERROR: 502,
        EMPTY_PROVIDER_RESPONSE: 502,
        INVALID_JSON: 502,
        SCHEMA_VALIDATION_FAILED: 422,
        UNSUPPORTED_PROVIDER: 400,
      };

      const status = statusByCode[error.code] ?? fallbackStatus;

      return Response.json(
        {
          success: false,
          error: 'Extraction failed',
          code: error.code,
          message: error.message,
        },
        { status },
      );
    }

    return Response.json({ success: false, error: 'Extraction failed' }, { status: fallbackStatus });
  }
}