import { z } from "zod";
import { AIWrapperError, generateStructuredOutput } from "@/lib/ai/wrapper";
import { createClient } from "@/lib/supabase/server";

const rollupSchema = z.object({
  recurring_themes: z.array(z.string()),
  strongest_objections: z.array(z.string()),
  most_likely_segment: z.string(),
  contradictions: z.array(z.string()),
  suggested_next_tests: z.array(z.string()),
});

type RollupResult = z.infer<typeof rollupSchema>;

const ROLLUP_SYSTEM_PROMPT = `You are a fractional product manager for an early-stage startup. Analyze the historical customer signals and synthesize high-level market intelligence. Return only valid JSON matching the exact schema provided. Surface contradictions explicitly when customer requests are mutually exclusive.`;

export async function GET(
  _request: Request,
  { params }: RouteContext<"/api/workspace/[id]/rollup">,
) {
  const { id: workspaceId } = await params;
  const supabase = await createClient();

  const { data: workspace, error: workspaceError } = await supabase
    .from("workspaces")
    .select("id")
    .eq("id", workspaceId)
    .single();

  if (workspaceError || !workspace) {
    return Response.json({ success: false, error: "Workspace not found" }, { status: 404 });
  }

  const { data: signals, error: signalsError } = await supabase
    .from("signals")
    .select("id")
    .eq("workspace_id", workspaceId);

  if (signalsError) {
    return Response.json({ success: false, error: "Failed to load workspace signals" }, { status: 500 });
  }

  const signalIds = signals?.map((signal) => signal.id) ?? [];

  if (signalIds.length === 0) {
    const empty: RollupResult = {
      recurring_themes: [],
      strongest_objections: [],
      most_likely_segment: "Insufficient confirmed memories",
      contradictions: [],
      suggested_next_tests: [],
    };

    return Response.json({ success: true, data: empty });
  }

  const { data: memories, error: memoryError } = await supabase
    .from("signal_analyses")
    .select("confirmed_summary, likely_segment, pain_points, objections, requests, quotes")
    .not("confirmed_at", "is", null)
    .not("confirmed_summary", "is", null)
    .in("signal_id", signalIds);

  if (memoryError) {
    return Response.json({ success: false, error: "Failed to load canonical memories" }, { status: 500 });
  }

  if (!memories || memories.length === 0) {
    const empty: RollupResult = {
      recurring_themes: [],
      strongest_objections: [],
      most_likely_segment: "Insufficient confirmed memories",
      contradictions: [],
      suggested_next_tests: [],
    };

    return Response.json({ success: true, data: empty });
  }

  const memoryPayload = memories.map((memory, index) => ({
    index: index + 1,
    confirmed_summary: memory.confirmed_summary,
    likely_segment: memory.likely_segment,
    pain_points: memory.pain_points,
    objections: memory.objections,
    requests: memory.requests,
    quotes: memory.quotes,
  }));

  try {
    const result: RollupResult = await generateStructuredOutput({
      provider: "openai",
      model: "gpt-4.1-mini",
      systemInstruction: ROLLUP_SYSTEM_PROMPT,
      userPrompt: [
        "Analyze this array of canonical customer signals and produce a workspace rollup.",
        "Return only JSON that matches the requested schema.",
        JSON.stringify(memoryPayload),
      ].join("\n\n"),
      schema: rollupSchema,
      temperature: 0.1,
    });

    return Response.json({ success: true, data: result });
  } catch (error) {
    if (error instanceof AIWrapperError) {
      const statusByCode: Partial<Record<AIWrapperError["code"], number>> = {
        MISSING_API_KEY: 500,
        PROVIDER_HTTP_ERROR: 502,
        EMPTY_PROVIDER_RESPONSE: 502,
        EMPTY_EMBEDDING_RESPONSE: 502,
        INVALID_JSON: 502,
        SCHEMA_VALIDATION_FAILED: 422,
        UNSUPPORTED_PROVIDER: 400,
      };

      return Response.json(
        {
          success: false,
          error: "Workspace rollup generation failed",
          code: error.code,
          message: error.message,
        },
        { status: statusByCode[error.code] ?? 500 },
      );
    }

    return Response.json({ success: false, error: "Workspace rollup generation failed" }, { status: 500 });
  }
}
