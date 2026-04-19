import { z } from "zod";
import { AIWrapperError, generateStructuredOutput } from "@/lib/ai/wrapper";

const formSchema = z.object({
  title: z.string().default(""),
  category: z.string().default(""),
  rationale: z.string().default(""),
  description: z.string().default(""),
  expected_outcome: z.string().default(""),
});

const requestSchema = z.object({
  user_message: z.string().trim().min(1).max(2000),
  current_form: formSchema,
  active_theme: z.string().trim().max(200).optional(),
  evidence_snippets: z
    .array(
      z.object({
        title: z.string().trim().max(200).nullable().optional(),
        confirmed_summary: z.string().trim().max(1500).nullable().optional(),
      }),
    )
    .max(10)
    .default([]),
});

const refinementSchema = z.object({
  updated_form: formSchema,
  assistant_reply: z.string().min(1),
});

const SYSTEM_PROMPT = `You are Dalil Assistant, embedded inside a "Log a Decision" form. The founder will describe how they want the decision draft updated. You respond in two parts:
1) updated_form: the full new form with the edits applied. PRESERVE any field the user didn't ask to change.
2) assistant_reply: a short (1–3 sentence) conversational confirmation of what you changed, or a clarifying question if the ask was ambiguous.

Rules:
- Keep the founder's language and evidence when rewriting. Don't invent numbers.
- If the founder asks you to "make the expected outcome measurable", write something specific and realistic based on the evidence snippets if provided.
- Category should be a short noun/department ("Product", "Operations", "Pricing", "Positioning") or a product-specific category like "Zipper issue".
- Rationale is the why. Description is the what (a short paragraph describing the change itself).
- Expected outcome should be a short forward-looking measurable sentence if possible.
- Return ONLY the structured JSON.`;

export async function POST(
  request: Request,
  { params: _params }: RouteContext<"/api/workspace/[id]/decision-refine">,
) {
  void _params;
  const body = requestSchema.safeParse(await request.json());
  if (!body.success) {
    return Response.json(
      {
        success: false,
        error: "Invalid request payload",
        details: body.error.flatten(),
      },
      { status: 400 },
    );
  }

  const { current_form, user_message, active_theme, evidence_snippets } = body.data;

  const evidenceBlock = evidence_snippets
    .map(
      (e, i) =>
        `[${i + 1}] ${e.title ?? "Untitled input"}${
          e.confirmed_summary ? ` — ${e.confirmed_summary}` : ""
        }`,
    )
    .join("\n");

  const userPrompt = [
    active_theme ? `Active recurring theme: ${active_theme}` : null,
    "Current form state:",
    JSON.stringify(current_form, null, 2),
    evidenceBlock ? `Linked evidence:\n${evidenceBlock}` : null,
    `Founder message: ${user_message}`,
    "Return the updated_form and a short assistant_reply.",
  ]
    .filter(Boolean)
    .join("\n\n");

  try {
    const result = await generateStructuredOutput({
      provider: "claude",
      model: "claude-sonnet-4-6",
      systemInstruction: SYSTEM_PROMPT,
      userPrompt,
      schema: refinementSchema,
      temperature: 0.2,
    });
    return Response.json({ success: true, data: result });
  } catch (error) {
    if (error instanceof AIWrapperError) {
      return Response.json(
        { success: false, error: "Refinement failed", message: error.message },
        { status: 502 },
      );
    }
    return Response.json(
      { success: false, error: "Refinement failed" },
      { status: 500 },
    );
  }
}
