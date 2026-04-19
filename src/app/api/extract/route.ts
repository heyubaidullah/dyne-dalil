import { z } from "zod";
import { AIWrapperError, generateStructuredOutput } from "@/lib/ai/wrapper";

const extractionSchema = z.object({
  summary: z.string(),
  positiveFeedback: z.array(z.string()),
  negativeFeedback: z.array(z.string()),
  painPoints: z.array(z.string()),
  requests: z.array(z.string()),
  category: z.string(),
  urgency: z.enum(["low", "medium", "high"]),
  likelySegment: z.string(),
  quotes: z.array(z.string()),
  confidenceScore: z.number().min(0).max(100),
});

type ExtractionResult = z.infer<typeof extractionSchema>;

const requestSchema = z.object({
  transcript: z.string().min(1),
});

const SYSTEM_PROMPT = `You are Dalil AI's extraction engine. Turn raw customer feedback into structured, founder-readable evidence.

Rules:
- positiveFeedback: things the customer liked or praised (empty array if none).
- negativeFeedback: things the customer disliked or complained about (empty array if none).
- painPoints: the underlying problems behind the negative feedback or feature requests. Specific over abstract.
- category: a short reusable noun phrase that groups this feedback with similar future feedback (e.g. "Zipper issue", "Onboarding friction"). Under 4 words.
- Keep the customer's voice in quotes.`;

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
      provider: "claude",
      model: "claude-sonnet-4-6",
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
