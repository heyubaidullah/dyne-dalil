import { z } from "zod";
import { AIWrapperError, generateStructuredOutput } from "@/lib/ai/wrapper";

const extractionSchema = z.object({
  summary: z.string(),
  painPoints: z.array(z.string()),
  objections: z.array(z.string()),
  requests: z.array(z.string()),
  urgency: z.enum(["low", "medium", "high"]),
  likelySegment: z.string(),
  quotes: z.array(z.string()),
  confidenceScore: z.number().min(0).max(100),
});

type ExtractionResult = z.infer<typeof extractionSchema>;

const requestSchema = z.object({
  transcript: z.string().min(1),
});

const SYSTEM_PROMPT = `You are an expert product manager analyzing raw customer conversation transcripts.\nExtract the core data points strictly following the requested JSON schema.`;

export async function POST(request: Request) {
  const parsed = requestSchema.safeParse(await request.json());

  if (!parsed.success) {
    return Response.json(
      {
        success: false,
        error: "Invalid request payload",
        details: parsed.error.flatten(),
      },
      { status: 400 },
    );
  }

  try {
    const result: ExtractionResult = await generateStructuredOutput({
      provider: "gemini",
      model: "gemini-2.5-flash",
      systemInstruction: SYSTEM_PROMPT,
      userPrompt: `Extract insights from the following transcript:\n\n${parsed.data.transcript}`,
      schema: extractionSchema,
      temperature: 0.1,
    });

    return Response.json({ success: true, data: result });
  } catch (error) {
    if (error instanceof AIWrapperError) {
      const statusByCode: Partial<Record<AIWrapperError["code"], number>> = {
        MISSING_API_KEY: 500,
        PROVIDER_HTTP_ERROR: 502,
        EMPTY_PROVIDER_RESPONSE: 502,
        INVALID_JSON: 502,
        SCHEMA_VALIDATION_FAILED: 422,
        UNSUPPORTED_PROVIDER: 400,
      };

      return Response.json(
        {
          success: false,
          error: "Extraction failed",
          code: error.code,
          message: error.message,
        },
        { status: statusByCode[error.code] ?? 500 },
      );
    }

    return Response.json(
      { success: false, error: "Extraction failed" },
      { status: 500 },
    );
  }
}
