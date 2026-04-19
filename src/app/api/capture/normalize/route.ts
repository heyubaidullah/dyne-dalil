import mammoth from "mammoth";
import { z } from "zod";

export const runtime = "nodejs";

const MAX_FILE_BYTES = 10 * 1024 * 1024;
const MAX_EXTRACTED_CHARS = 200_000;

const allowedExtensions = new Set(["txt", "md", "pdf", "docx", "json"]);

const jsonRequestSchema = z.object({
  mode: z.literal("json"),
  json: z.string().trim().min(1, "JSON input is required."),
});

const strictTurnSchema = z.object({
  speaker: z.string().trim().min(1).optional(),
  text: z.string().trim().min(1).optional(),
  content: z.string().trim().min(1).optional(),
  message: z.string().trim().min(1).optional(),
  body: z.string().trim().min(1).optional(),
  timestamp: z.string().trim().min(1).optional(),
});

type StrictTurn = z.infer<typeof strictTurnSchema>;

const preferredTextKeys = new Set(["text", "message", "content", "body", "transcript"]);

export async function POST(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";

  try {
    if (contentType.includes("application/json")) {
      const parsed = jsonRequestSchema.safeParse(await request.json());
      if (!parsed.success) {
        return badRequest(parsed.error.issues[0]?.message ?? "Invalid JSON payload.");
      }

      const normalized = normalizeAndClampText(normalizeJsonInput(parsed.data.json));
      return Response.json({ success: true, data: { kind: "text", ...normalized } });
    }

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const fileEntry = formData.get("file");

      if (!(fileEntry instanceof File)) {
        return badRequest("Upload a file to continue.");
      }

      if (fileEntry.size === 0) {
        return badRequest("Uploaded file is empty.");
      }

      if (fileEntry.size > MAX_FILE_BYTES) {
        return badRequest("File exceeds 10MB limit.");
      }

      const extension = getFileExtension(fileEntry.name);

      if (!allowedExtensions.has(extension)) {
        return badRequest("Unsupported file type. Use txt, md, pdf, docx, or json.");
      }

      const buffer = Buffer.from(await fileEntry.arrayBuffer());

      if (extension === "pdf") {
        return Response.json({
          success: true,
          data: {
            kind: "pdf",
            file_name: fileEntry.name,
            mime_type: "application/pdf",
            data_base64: buffer.toString("base64"),
          },
        });
      }

      const extracted = await extractUploadText({ extension, buffer });
      const normalized = normalizeAndClampText(extracted);

      return Response.json({
        success: true,
        data: {
          kind: "text",
          ...normalized,
          file_name: fileEntry.name,
        },
      });
    }

    return Response.json(
      {
        success: false,
        error: "Unsupported request content type.",
      },
      { status: 415 },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Normalization failed.";
    return Response.json({ success: false, error: message }, { status: 400 });
  }
}

function badRequest(error: string) {
  return Response.json({ success: false, error }, { status: 400 });
}

function getFileExtension(fileName: string): string {
  const dot = fileName.lastIndexOf(".");
  if (dot < 0) return "";
  return fileName.slice(dot + 1).toLowerCase();
}

async function extractUploadText({
  extension,
  buffer,
}: {
  extension: string;
  buffer: Buffer;
}): Promise<string> {
  if (extension === "txt" || extension === "md") {
    return buffer.toString("utf8");
  }

  if (extension === "json") {
    return normalizeJsonInput(buffer.toString("utf8"));
  }

  if (extension === "docx") {
    const extracted = await mammoth.extractRawText({ buffer });
    return extracted.value;
  }

  throw new Error("Unsupported file type.");
}

function normalizeAndClampText(text: string): { raw_text: string; truncated: boolean } {
  const trimmed = text.replace(/\r\n/g, "\n").trim();
  if (!trimmed) {
    throw new Error("No usable text could be extracted from this input.");
  }

  const truncated = trimmed.length > MAX_EXTRACTED_CHARS;
  const rawText = truncated ? trimmed.slice(0, MAX_EXTRACTED_CHARS) : trimmed;

  if (rawText.length < 20) {
    throw new Error("Extracted text is too short. Provide at least a sentence or two.");
  }

  return { raw_text: rawText, truncated };
}

function normalizeJsonInput(rawJson: string): string {
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawJson);
  } catch {
    throw new Error("Invalid JSON. Please provide valid JSON input.");
  }

  const strict = extractStrictTranscript(parsed);
  if (strict.length > 0) {
    return strict;
  }

  const flexible = extractFlexibleText(parsed);
  if (flexible.length > 0) {
    return flexible;
  }

  throw new Error(
    "Could not find transcript-like text in this JSON. Include turns or text/message/content/body fields.",
  );
}

function extractStrictTranscript(value: unknown): string {
  const candidates = findTurnCandidates(value);

  for (const candidate of candidates) {
    const lines: string[] = [];
    for (const item of candidate) {
      const parsed = strictTurnSchema.safeParse(item);
      if (!parsed.success) continue;
      const line = formatTurn(parsed.data);
      if (line) lines.push(line);
    }
    if (lines.length > 0) {
      return lines.join("\n");
    }
  }

  return "";
}

function findTurnCandidates(value: unknown): unknown[][] {
  if (Array.isArray(value)) {
    return [value];
  }

  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    const keys = ["turns", "messages", "transcript"];
    const arrays = keys
      .map((key) => record[key])
      .filter((v): v is unknown[] => Array.isArray(v));
    return arrays;
  }

  return [];
}

function formatTurn(turn: StrictTurn): string {
  const text = turn.text ?? turn.content ?? turn.message ?? turn.body;
  if (!text) return "";

  const speaker = turn.speaker?.trim() || "speaker";
  const timestamp = turn.timestamp?.trim();
  if (timestamp) {
    return `${speaker} @ ${timestamp}: ${text}`;
  }
  return `${speaker}: ${text}`;
}

function extractFlexibleText(value: unknown): string {
  const preferred: string[] = [];
  const fallback: string[] = [];
  collectText(value, preferred, fallback);

  const picked = preferred.length > 0 ? preferred : fallback;
  const deduped = Array.from(new Set(picked.map((v) => v.trim()).filter(Boolean)));
  return deduped.join("\n\n");
}

function collectText(value: unknown, preferred: string[], fallback: string[]) {
  if (typeof value === "string") {
    fallback.push(value);
    return;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      collectText(item, preferred, fallback);
    }
    return;
  }

  if (!value || typeof value !== "object") {
    return;
  }

  for (const [key, child] of Object.entries(value)) {
    if (typeof child === "string" && preferredTextKeys.has(key.toLowerCase())) {
      preferred.push(child);
    }
    collectText(child, preferred, fallback);
  }
}