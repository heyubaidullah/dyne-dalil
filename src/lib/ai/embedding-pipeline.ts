import { generateEmbedding } from "@/lib/ai/wrapper";
import { createServiceClient } from "@/lib/supabase/server";

function compactText(parts: Array<string | null | undefined>): string {
  return parts
    .map((part) => part?.trim())
    .filter((part): part is string => Boolean(part && part.length > 0))
    .join("\n\n");
}

export async function generateSignalAnalysisEmbedding(params: {
  signalAnalysisId: string;
  confirmedSummary?: string | null;
  likelySegment?: string | null;
  painPoints?: string[] | null;
  objections?: string[] | null;
  requests?: string[] | null;
  quotes?: string[] | null;
}): Promise<void> {
  const text = compactText([
    params.confirmedSummary,
    params.likelySegment ? `Likely segment: ${params.likelySegment}` : null,
    params.painPoints?.length ? `Pain points: ${params.painPoints.join("; ")}` : null,
    params.objections?.length ? `Objections: ${params.objections.join("; ")}` : null,
    params.requests?.length ? `Requests: ${params.requests.join("; ")}` : null,
    params.quotes?.length ? `Quotes: ${params.quotes.join("; ")}` : null,
  ]);

  if (!text) return;

  const embedding = await generateEmbedding({
    provider: "openai",
    input: text,
  });

  const supabase = createServiceClient();
  const { error } = await supabase
    .from("signal_analyses")
    .update({ embedding })
    .eq("id", params.signalAnalysisId);

  if (error) {
    throw error;
  }
}

export async function generateDecisionEmbedding(params: {
  decisionId: string;
  title: string;
  category?: string | null;
  rationale?: string | null;
  expectedOutcome?: string | null;
}): Promise<void> {
  const text = compactText([
    params.title,
    params.category ? `Category: ${params.category}` : null,
    params.rationale ? `Rationale: ${params.rationale}` : null,
    params.expectedOutcome ? `Expected outcome: ${params.expectedOutcome}` : null,
  ]);

  if (!text) return;

  const embedding = await generateEmbedding({
    provider: "openai",
    input: text,
  });

  const supabase = createServiceClient();
  const { error } = await supabase
    .from("decisions")
    .update({ embedding })
    .eq("id", params.decisionId);

  if (error) {
    throw error;
  }
}
