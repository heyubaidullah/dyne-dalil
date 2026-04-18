import { z } from "zod";
import { AIWrapperError, streamTextOutput } from "@/lib/ai/wrapper";

const SYSTEM_PROMPT = `You are the Dalil Stage-Zero startup assistant. Your objective is to help builders validate and refine raw startup ideas. The user is answering the prompt: "What do you want to do today?". Execute the following steps sequentially. Ask only one question at a time. 1. Articulate: Clarify the core idea if it is vague. 2. Audience: Narrow down the specific target user. 3. Pain Point: Define the exact problem being solved. 4. Pressure-Test: Challenge the value proposition. Tone requirements: Be highly analytical, concise, and direct. Do not use generic encouragement. Ask sharp, filtering questions. When the user has sufficiently answered all four areas, summarize the concept and ask if they are ready to save it to their Idea Vault.`;

const requestSchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().min(1),
      }),
    )
    .min(1),
});

export async function POST(request: Request) {
  const payload = requestSchema.safeParse(await request.json());

  if (!payload.success) {
    return Response.json(
      {
        success: false,
        error: "Invalid request payload",
        details: payload.error.flatten(),
      },
      { status: 400 },
    );
  }

  try {
    const stream = await streamTextOutput({
      provider: "gemini",
      model: "gemini-2.5-pro",
      systemInstruction: SYSTEM_PROMPT,
      messages: payload.data.messages,
      temperature: 0.2,
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
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
          error: "Failed to stream stage-zero response",
          code: error.code,
          message: error.message,
        },
        { status: statusByCode[error.code] ?? 500 },
      );
    }

    return Response.json(
      { success: false, error: "Failed to stream stage-zero response" },
      { status: 500 },
    );
  }
}
