"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import {
  generateStructuredOutput,
  AIWrapperError,
} from "@/lib/ai/wrapper";

/**
 * Signal ingestion + extraction.
 *
 * The capture UI calls `ingestSignalAction` to save the raw signal and run
 * structured extraction through the wrapper. The founder confirmation step
 * posts to `/api/workspace/[id]/signal-analyses/confirm` which writes the
 * canonical memory and queues an embedding via the embedding pipeline.
 */

const EXTRACTION_SYSTEM = `You are Dalil's extraction engine. Your job is to turn raw founder-gathered customer text — call transcripts, rough notes, DMs, survey snippets — into structured, founder-readable evidence.

Style rules:
- Be conservative. If something isn't clearly stated, don't invent it.
- Keep the customer's voice in quotes. Lightly clean filler words only if unreadable.
- Pain points = real problems named or implied, not vibes. Prefer specific over abstract.
- Objections = things that would make this person say no.
- Requests = what they explicitly asked for.
- Confidence should reflect how much raw data you have. One short note → at most "medium".
- Segment should be the narrowest honest description (e.g. "Campus Muslim student" > "Student").

Return only the structured JSON.`;

const ExtractionSchema = z.object({
  summary: z.string(),
  pain_points: z.array(z.string()),
  objections: z.array(z.string()),
  requests: z.array(z.string()),
  urgency: z.enum(["low", "medium", "high"]),
  likely_segment: z.string(),
  quotes: z.array(z.string()),
  confidence: z.enum(["low", "medium", "high"]),
});

export type Extraction = z.infer<typeof ExtractionSchema>;

const ingestSchema = z.object({
  workspace_id: z.string().uuid(),
  title: z.string().trim().max(160).optional().or(z.literal("")),
  source_type: z.string().trim().max(40).optional().or(z.literal("")),
  raw_text: z.string().trim().optional().or(z.literal("")),
  pdf_attachment: z
    .object({
      file_name: z.string().trim().min(1),
      mime_type: z.literal("application/pdf"),
      data_base64: z.string().trim().min(1),
    })
    .optional(),
}).superRefine((data, ctx) => {
  if (!data.pdf_attachment && (!data.raw_text || data.raw_text.trim().length < 20)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["raw_text"],
      message: "Paste at least a sentence or two — otherwise extraction won't be useful.",
    });
  }
});

export type IngestResult =
  | {
      ok: true;
      signal_id: string;
      extraction: Extraction;
    }
  | { ok: false; error: string };

export async function ingestSignalAction(input: {
  workspace_id: string;
  title?: string;
  source_type?: string;
  raw_text?: string;
  pdf_attachment?: {
    file_name: string;
    mime_type: "application/pdf";
    data_base64: string;
  };
}): Promise<IngestResult> {
  const parsed = ingestSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const storageRawText =
    parsed.data.raw_text?.trim().length
      ? parsed.data.raw_text.trim()
      : parsed.data.pdf_attachment
        ? `[PDF attachment] ${parsed.data.pdf_attachment.file_name}`
        : "";

  const sb = db();
  const { data: signal, error: signalErr } = await sb
    .from("signals")
    .insert({
      workspace_id: parsed.data.workspace_id,
      title: parsed.data.title?.length ? parsed.data.title : null,
      source_type: parsed.data.source_type?.length ? parsed.data.source_type : null,
      raw_text: storageRawText,
    })
    .select("id")
    .single();

  if (signalErr || !signal) {
    return { ok: false, error: signalErr?.message ?? "Could not save signal." };
  }

  let extraction: Extraction;
  try {
    extraction = await generateStructuredOutput({
      provider: "claude",
      model: "claude-sonnet-4-6",
      systemInstruction: EXTRACTION_SYSTEM,
      userPrompt: parsed.data.pdf_attachment
        ? `Extract structure from this signal. The user attached a PDF document. Read the PDF content directly and extract the schema.`
        : `Extract structure from this signal.\n\n<signal>\n${parsed.data.raw_text}\n</signal>`,
      attachments: parsed.data.pdf_attachment
        ? [
            {
              mimeType: parsed.data.pdf_attachment.mime_type,
              dataBase64: parsed.data.pdf_attachment.data_base64,
              fileName: parsed.data.pdf_attachment.file_name,
            },
          ]
        : [],
      schema: ExtractionSchema,
      temperature: 0.2,
    });
  } catch (e) {
    const message =
      e instanceof AIWrapperError
        ? `${e.code}: ${e.message}`
        : e instanceof Error
          ? e.message
          : "Extraction failed.";
    return { ok: false, error: message };
  }

  // Store the AI proposal so the Memory Library can show "pending review".
  const { error: analysisErr } = await sb.from("signal_analyses").insert({
    signal_id: signal.id,
    ai_summary: extraction.summary,
    confirmed_summary: extraction.summary,
    pain_points: extraction.pain_points,
    objections: extraction.objections,
    requests: extraction.requests,
    urgency: extraction.urgency,
    likely_segment: extraction.likely_segment,
    quotes: extraction.quotes,
    confidence: extraction.confidence,
  });

  if (analysisErr) {
    return { ok: false, error: analysisErr.message };
  }

  revalidatePath(`/w/${parsed.data.workspace_id}`);
  revalidatePath(`/w/${parsed.data.workspace_id}/memory`);
  revalidatePath(`/w/${parsed.data.workspace_id}/timeline`);

  return { ok: true, signal_id: signal.id, extraction };
}
