import { z } from "zod";
import { db } from "@/lib/db";
import { AIWrapperError, generateStructuredOutput } from "@/lib/ai/wrapper";

const MAX_CANDIDATES = 40;
const DEFAULT_TOP_N = 5;

const RankingSchema = z.object({
  matches: z
    .array(
      z.object({
        signal_id: z.string(),
        similarity: z.number().min(0).max(1),
      }),
    )
    .max(20),
});

const SYSTEM_PROMPT = `You are a semantic retrieval engine. Given one target customer-research memory and a list of candidate memories from the same workspace, return the candidates most semantically similar to the target — based on shared pain points, customer segments, decisions implied, and quoted language.

Rules:
- Return at most ${DEFAULT_TOP_N} candidates.
- Use signal_id exactly as provided in the candidate list — do not invent ids.
- similarity is a float from 0 (unrelated) to 1 (near-duplicate). Be calibrated: 0.9+ for same-topic memories, 0.6-0.8 for loosely related, under 0.5 for weak matches (and omit those).
- Never include the target memory itself in the output.
- Return ONLY the structured JSON.`;

export async function GET(
  _request: Request,
  {
    params,
  }: RouteContext<"/api/workspace/[id]/signals/[signalId]/similar">,
) {
  const { id: workspaceId, signalId } = await params;
  const supabase = db();

  const { data: signal, error: signalError } = await supabase
    .from("signals")
    .select("id, workspace_id")
    .eq("id", signalId)
    .maybeSingle();

  if (signalError || !signal) {
    return Response.json(
      { success: false, error: "Signal not found" },
      { status: 404 },
    );
  }

  if (signal.workspace_id !== workspaceId) {
    return Response.json(
      { success: false, error: "Signal does not belong to workspace" },
      { status: 400 },
    );
  }

  const { data: targetAnalysis } = await supabase
    .from("signal_analyses")
    .select(
      "confirmed_summary, likely_segment, pain_points, objections, requests, quotes",
    )
    .eq("signal_id", signalId)
    .maybeSingle();

  if (!targetAnalysis?.confirmed_summary) {
    return Response.json({
      success: true,
      data: { ready: false, similar: [] },
    });
  }

  const { data: candidates } = await supabase
    .from("signal_analyses")
    .select(
      "signal_id, confirmed_summary, likely_segment, pain_points, objections, requests, quotes, signals!inner(workspace_id, title)",
    )
    .not("confirmed_summary", "is", null)
    .eq("signals.workspace_id", workspaceId)
    .neq("signal_id", signalId)
    .limit(MAX_CANDIDATES);

  const candidatePool = (candidates ?? []).filter((c) => !!c.confirmed_summary);

  if (candidatePool.length === 0) {
    return Response.json({
      success: true,
      data: { ready: true, similar: [] },
    });
  }

  const candidatesBlock = candidatePool
    .map((c, i) => {
      const parts = [
        `#${i + 1} signal_id: ${c.signal_id}`,
        `  summary: ${c.confirmed_summary}`,
        c.likely_segment ? `  segment: ${c.likely_segment}` : null,
        c.pain_points?.length
          ? `  pain_points: ${c.pain_points.join("; ")}`
          : null,
        c.objections?.length ? `  objections: ${c.objections.join("; ")}` : null,
        c.requests?.length ? `  requests: ${c.requests.join("; ")}` : null,
      ].filter(Boolean);
      return parts.join("\n");
    })
    .join("\n\n");

  const targetBlock = [
    `TARGET MEMORY (signal_id: ${signalId})`,
    `summary: ${targetAnalysis.confirmed_summary}`,
    targetAnalysis.likely_segment
      ? `segment: ${targetAnalysis.likely_segment}`
      : null,
    targetAnalysis.pain_points?.length
      ? `pain_points: ${targetAnalysis.pain_points.join("; ")}`
      : null,
    targetAnalysis.objections?.length
      ? `objections: ${targetAnalysis.objections.join("; ")}`
      : null,
    targetAnalysis.requests?.length
      ? `requests: ${targetAnalysis.requests.join("; ")}`
      : null,
  ]
    .filter(Boolean)
    .join("\n");

  let ranking: z.infer<typeof RankingSchema>;
  try {
    ranking = await generateStructuredOutput({
      provider: "claude",
      model: "claude-sonnet-4-6",
      systemInstruction: SYSTEM_PROMPT,
      userPrompt: `${targetBlock}\n\nCANDIDATES:\n\n${candidatesBlock}`,
      schema: RankingSchema,
      temperature: 0,
    });
  } catch (error) {
    console.error("[similar] claude ranker failed", error);
    const status = error instanceof AIWrapperError ? 502 : 500;
    return Response.json(
      { success: false, error: "Ranker failed" },
      { status },
    );
  }

  const byId = new Map(candidatePool.map((c) => [c.signal_id, c]));
  const similar = ranking.matches
    .filter((m) => byId.has(m.signal_id) && m.signal_id !== signalId)
    .slice(0, DEFAULT_TOP_N)
    .map((m) => {
      const c = byId.get(m.signal_id);
      return {
        id: `${m.signal_id}-claude`,
        signal_id: m.signal_id,
        confirmed_summary: c?.confirmed_summary ?? null,
        similarity: m.similarity,
      };
    });

  return Response.json({
    success: true,
    data: { ready: true, similar },
  });
}
