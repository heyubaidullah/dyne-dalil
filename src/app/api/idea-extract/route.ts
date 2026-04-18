import { z } from "zod";
import { AIWrapperError, generateStructuredOutput } from "@/lib/ai/wrapper";

const transcriptSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1),
});

const requestSchema = z.object({
  transcript: z.array(transcriptSchema).min(1),
});

const ideaExtractionSchema = z.object({
  chat_transcript_summary: z.string().min(1),
  approved_idea: z.string().min(1),
  audience: z.string().min(1),
  problem_statement: z.string().min(1),
  convert_to_workspace_flag: z.boolean(),
});

type IdeaExtractionResult = z.infer<typeof ideaExtractionSchema>;

const SYSTEM_INSTRUCTION = `You are an expert product strategist. Analyze the provided chat transcript between a founder and an AI assistant. Extract the finalized startup concept into the exact JSON schema provided. Ensure the problem statement and audience are narrowly defined based on the conversation.`;

export async function POST(request: Request) {
  const parsedRequest = requestSchema.safeParse(await request.json());

  if (!parsedRequest.success) {
    return Response.json(
      {
        success: false,
        error: "Invalid request payload",
        details: parsedRequest.error.flatten(),
      },
      { status: 400 },
    );
  }

  const transcriptText = parsedRequest.data.transcript
    .map((turn) => `${turn.role.toUpperCase()}: ${turn.content}`)
    .join("\n");

  const userPrompt = [
    "Extract and return only the required JSON object.",
    "Schema fields:",
    "- chat_transcript_summary (string)",
    "- approved_idea (string)",
    "- audience (string)",
    "- problem_statement (string)",
    "- convert_to_workspace_flag (boolean)",
    "",
    "Chat transcript:",
    transcriptText,
  ].join("\n");

  try {
    const data: IdeaExtractionResult = await generateStructuredOutput({
      provider: "gemini",
      model: "gemini-2.5-flash",
      systemInstruction: SYSTEM_INSTRUCTION,
      userPrompt,
      schema: ideaExtractionSchema,
      temperature: 0.1,
    });

    return Response.json({ success: true, data });
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
          error: "Idea extraction failed",
          code: error.code,
          message: error.message,
        },
        { status: statusByCode[error.code] ?? 500 },
      );
    }

    return Response.json(
      { success: false, error: "Idea extraction failed" },
      { status: 500 },
    );
  }
}
