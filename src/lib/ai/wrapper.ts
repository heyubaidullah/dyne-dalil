import { z } from "zod";

// Define supported providers
export type AIProvider = "gemini" | "openai" | "claude" | "local";

export interface AIWrapperParams<T> {
  provider?: AIProvider;
  model?: string;
  systemInstruction: string;
  userPrompt: string;
  attachments?: Array<{
    mimeType: string;
    dataBase64: string;
    fileName?: string;
  }>;
  schema: z.ZodSchema<T>; // Forces structured output validation
  temperature?: number;
}

export interface AIStreamParams {
  provider?: AIProvider;
  model?: string;
  systemInstruction: string;
  messages: Array<{
    role: "user" | "assistant";
    content: string;
  }>;
  temperature?: number;
}

export interface AIEmbeddingParams {
  provider?: Extract<AIProvider, "gemini" | "openai" | "local">;
  model?: string;
  input: string;
  /**
   * Override the output dimensionality. Only supported by Gemini
   * `gemini-embedding-001` (128/256/512/768/1536/3072). Ignored by
   * OpenAI and local providers.
   */
  outputDimensionality?: number;
}

export type AIErrorCode =
  | "MISSING_API_KEY"
  | "PROVIDER_HTTP_ERROR"
  | "EMPTY_PROVIDER_RESPONSE"
  | "EMPTY_EMBEDDING_RESPONSE"
  | "INVALID_JSON"
  | "SCHEMA_VALIDATION_FAILED"
  | "UNSUPPORTED_PROVIDER";

export class AIWrapperError extends Error {
  constructor(
    public readonly code: AIErrorCode,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "AIWrapperError";
  }
}

const DEFAULT_MODELS: Record<AIProvider, string> = {
  gemini: "gemini-2.5-flash",
  openai: "gpt-4.1-mini",
  claude: "claude-3-5-haiku-latest",
  local: process.env.LLAMA_CPP_MODEL ?? "",
};

const DEFAULT_EMBEDDING_MODELS: Record<"gemini" | "openai" | "local", string> = {
  gemini: "gemini-embedding-001",
  openai: "text-embedding-3-small",
  local: process.env.LLAMA_CPP_EMBEDDING_MODEL ?? "",
};

export const AI_EMBEDDING_DIMENSIONS = 1536;

/**
 * Generate a numeric embedding vector for semantic similarity.
 */
export async function generateEmbedding({
  provider = "gemini",
  model,
  input,
  outputDimensionality,
}: AIEmbeddingParams): Promise<number[]> {
  const text = input.trim();
  if (!text) {
    throw new AIWrapperError(
      "EMPTY_PROVIDER_RESPONSE",
      "Embedding input cannot be empty.",
    );
  }

  const selectedModel = model ?? DEFAULT_EMBEDDING_MODELS[provider];

  switch (provider) {
    case "gemini":
      return callGeminiEmbedding(
        selectedModel,
        text,
        outputDimensionality ?? AI_EMBEDDING_DIMENSIONS,
      );
    case "openai":
      return callOpenAIEmbedding(selectedModel, text);
    case "local":
      return callLocalEmbedding(selectedModel, text);
    default:
      throw new AIWrapperError(
        "UNSUPPORTED_PROVIDER",
        `Unsupported embedding provider: ${provider}`,
      );
  }
}

/**
 * Stream plain text output from a provider for chat-like interactions.
 */
export async function streamTextOutput({
  provider = "gemini",
  model,
  systemInstruction,
  messages,
  temperature = 0.2,
}: AIStreamParams): Promise<ReadableStream<Uint8Array>> {
  const selectedModel = model ?? DEFAULT_MODELS[provider];

  switch (provider) {
    case "gemini":
      return streamGemini(
        selectedModel,
        systemInstruction,
        messages,
        temperature,
      );
    case "openai":
      return streamOpenAI(
        selectedModel,
        systemInstruction,
        messages,
        temperature,
      );
    case "local":
      return streamLocalLlamaCpp(
        selectedModel,
        systemInstruction,
        messages,
        temperature,
      );
    case "claude":
      throw new AIWrapperError(
        "UNSUPPORTED_PROVIDER",
        "Streaming is not implemented for Claude yet.",
      );
    default:
      throw new AIWrapperError(
        "UNSUPPORTED_PROVIDER",
        `Unsupported provider: ${provider}`,
      );
  }
}

/**
 * Universal wrapper for LLM calls enforcing structured JSON output.
 */
export async function generateStructuredOutput<T>({
  provider = "gemini",
  model,
  systemInstruction,
  userPrompt,
  attachments = [],
  schema,
  temperature = 0.2,
}: AIWrapperParams<T>): Promise<T> {
  const selectedModel = model ?? DEFAULT_MODELS[provider];

  let rawJsonString = "";

  // Inject a schema hint so the model actually matches our expected shape.
  // Gemini happily wraps the output under an invented top-level key if the
  // hint isn't forceful, so spell it out.
  const jsonSchema = zodToOpenApiSchema(schema);
  const schemaHint = `\n\nReturn ONLY a single JSON object whose TOP-LEVEL keys exactly match this schema — do NOT wrap the object under any other field name (no "data", no "market_intelligence", no "result", no "output"):\n${JSON.stringify(jsonSchema, null, 2)}`;
  const systemWithHint = systemInstruction + schemaHint;

  switch (provider) {
    case "gemini":
      // Pass the schema both as textual hint AND as responseSchema so Gemini
      // doesn't wander into a richer shape of its own invention.
      rawJsonString = await callGemini(
        selectedModel,
        systemWithHint,
        userPrompt,
        temperature,
        attachments,
        sanitizeForGemini(jsonSchema),
      );
      break;
    case "openai":
      if (attachments.length > 0) {
        throw new AIWrapperError(
          "UNSUPPORTED_PROVIDER",
          "Attachments are only implemented for Gemini structured extraction.",
        );
      }
      rawJsonString = await callOpenAI(
        selectedModel,
        systemWithHint,
        userPrompt,
        temperature,
      );
      break;
    case "claude":
      if (attachments.length > 0) {
        throw new AIWrapperError(
          "UNSUPPORTED_PROVIDER",
          "Attachments are only implemented for Gemini structured extraction.",
        );
      }
      rawJsonString = await callClaude(
        selectedModel,
        systemWithHint,
        userPrompt,
        temperature,
      );
      break;
    case "local":
      if (attachments.length > 0) {
        throw new AIWrapperError(
          "UNSUPPORTED_PROVIDER",
          "Attachments are only implemented for Gemini structured extraction.",
        );
      }
      rawJsonString = await callLocalLlamaCpp(
        selectedModel,
        systemWithHint,
        userPrompt,
        temperature,
      );
      break;
    default:
      throw new AIWrapperError(
        "UNSUPPORTED_PROVIDER",
        `Unsupported provider: ${provider}`,
      );
  }

  if (!rawJsonString || !rawJsonString.trim()) {
    throw new AIWrapperError(
      "EMPTY_PROVIDER_RESPONSE",
      "Provider returned an empty response.",
      { provider, model: selectedModel },
    );
  }

  try {
    const parsedData = extractAndParseJson(rawJsonString);

    // Some providers (notably Gemini) occasionally wrap the real object
    // under an invented top-level key. If the outer validation fails AND
    // the payload is a single-key object whose value is an object,
    // retry against that inner value before giving up.
    let validation = schema.safeParse(parsedData);
    if (
      !validation.success &&
      parsedData &&
      typeof parsedData === "object" &&
      !Array.isArray(parsedData)
    ) {
      const keys = Object.keys(parsedData as Record<string, unknown>);
      if (keys.length === 1) {
        const inner = (parsedData as Record<string, unknown>)[keys[0]];
        if (inner && typeof inner === "object") {
          const innerValidation = schema.safeParse(inner);
          if (innerValidation.success) validation = innerValidation;
        }
      }
    }
    if (!validation.success) {
      if (process.env.NODE_ENV !== "production") {
        console.warn("[ai-wrapper] schema validation failed", {
          provider,
          rawSample: rawJsonString.slice(0, 600),
          parsedKeys:
            parsedData && typeof parsedData === "object"
              ? Object.keys(parsedData as object)
              : null,
          issues: validation.error.issues.slice(0, 4),
        });
      }
      throw new AIWrapperError(
        "SCHEMA_VALIDATION_FAILED",
        "LLM output JSON did not match the expected schema.",
        {
          issues: validation.error.issues.slice(0, 4),
          rawSample: rawJsonString.slice(0, 300),
        },
      );
    }

    return validation.data;
  } catch (error) {
    if (error instanceof AIWrapperError) {
      throw error;
    }
    throw new AIWrapperError(
      "INVALID_JSON",
      "Failed to parse JSON from LLM output.",
      {
        cause: error instanceof Error ? error.message : String(error),
        sample: rawJsonString.slice(0, 300),
      },
    );
  }
}

// --- Provider implementations ------------------------------------------

function getRequiredEnv(name: string): string {
  const value = process.env[name];
  if (!value || value.trim().length === 0) {
    throw new AIWrapperError(
      "MISSING_API_KEY",
      `Missing required environment variable: ${name}`,
    );
  }
  return value;
}

function formatHttpError(
  provider: AIProvider,
  status: number,
  body: string,
): AIWrapperError {
  return new AIWrapperError(
    "PROVIDER_HTTP_ERROR",
    `${provider} request failed with HTTP ${status}.`,
    { status, body: body.slice(0, 500) },
  );
}

function extractAndParseJson(raw: string): unknown {
  const trimmed = raw.trim();

  try {
    return JSON.parse(trimmed);
  } catch {
    // fall through
  }

  const fencedMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fencedMatch?.[1]) {
    try {
      return JSON.parse(fencedMatch[1].trim());
    } catch {
      // fall through
    }
  }

  const objectStart = trimmed.indexOf("{");
  const objectEnd = trimmed.lastIndexOf("}");
  if (objectStart !== -1 && objectEnd > objectStart) {
    const candidate = trimmed.slice(objectStart, objectEnd + 1);
    return JSON.parse(candidate);
  }

  const arrayStart = trimmed.indexOf("[");
  const arrayEnd = trimmed.lastIndexOf("]");
  if (arrayStart !== -1 && arrayEnd > arrayStart) {
    const candidate = trimmed.slice(arrayStart, arrayEnd + 1);
    return JSON.parse(candidate);
  }

  throw new AIWrapperError(
    "INVALID_JSON",
    "No valid JSON payload was found in LLM output.",
    { sample: raw.slice(0, 300) },
  );
}

type JsonSchemaLike = Record<string, unknown>;

// Convert a zod schema into a JSON-schema-like object using zod v4's native
// `toJSONSchema`, then strip fields providers don't understand.
function zodToOpenApiSchema(schema: z.ZodTypeAny): JsonSchemaLike {
  try {
    const out = z.toJSONSchema(schema) as unknown as JsonSchemaLike;
    return scrubJsonSchemaMeta(out);
  } catch {
    return { type: "object" };
  }
}

function scrubJsonSchemaMeta(node: unknown): JsonSchemaLike {
  if (!node || typeof node !== "object") return node as JsonSchemaLike;
  if (Array.isArray(node)) {
    return node.map(scrubJsonSchemaMeta) as unknown as JsonSchemaLike;
  }
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(node as Record<string, unknown>)) {
    if (k === "$schema" || k === "$ref" || k === "additionalProperties") continue;
    out[k] = scrubJsonSchemaMeta(v);
  }
  return out as JsonSchemaLike;
}

/**
 * Strip fields Gemini's responseSchema parser doesn't understand. We keep
 * only the small OpenAPI 3.0 subset Gemini supports: type, properties,
 * required, items, enum, description.
 */
function sanitizeForGemini(node: unknown): JsonSchemaLike {
  if (!node || typeof node !== "object" || Array.isArray(node)) {
    return node as JsonSchemaLike;
  }
  const source = node as Record<string, unknown>;
  const out: Record<string, unknown> = {};

  // Gemini's responseSchema expects uppercase types (STRING, ARRAY, etc.).
  const t = source.type;
  const raw = typeof t === "string" ? t : Array.isArray(t) ? t[0] : null;
  if (typeof raw === "string") {
    out.type = raw.toUpperCase();
  }

  if (typeof source.description === "string") {
    out.description = source.description;
  }
  if (Array.isArray(source.enum)) {
    out.enum = source.enum;
  }
  if (Array.isArray(source.required)) {
    out.required = source.required;
  }

  if (source.properties && typeof source.properties === "object") {
    const props: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(
      source.properties as Record<string, unknown>,
    )) {
      props[key] = sanitizeForGemini(value);
    }
    out.properties = props;
  }

  if (source.items) {
    out.items = sanitizeForGemini(source.items);
  }

  return out as JsonSchemaLike;
}

async function callGemini(
  model: string,
  system: string,
  prompt: string,
  temp: number,
  attachments: Array<{
    mimeType: string;
    dataBase64: string;
    fileName?: string;
  }>,
  responseSchema?: JsonSchemaLike,
): Promise<string> {
  const apiKey = getRequiredEnv("GEMINI_API_KEY");

  const userParts: Array<
    | { text: string }
    | {
        inlineData: {
          mimeType: string;
          data: string;
        };
      }
  > = [{ text: prompt }];

  for (const file of attachments) {
    userParts.push({
      inlineData: {
        mimeType: file.mimeType,
        data: file.dataBase64,
      },
    });
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents: [{ role: "user", parts: userParts }],
        generationConfig: {
          temperature: temp,
          responseMimeType: "application/json",
          ...(responseSchema ? { responseSchema } : {}),
        },
      }),
    },
  );

  if (!response.ok) {
    throw formatHttpError("gemini", response.status, await response.text());
  }

  const data = (await response.json()) as {
    candidates?: Array<{
      content?: { parts?: Array<{ text?: string }> };
    }>;
  };

  return (
    data.candidates?.[0]?.content?.parts
      ?.map((part) => part.text ?? "")
      .join("") ?? ""
  );
}

async function callOpenAI(
  model: string,
  system: string,
  prompt: string,
  temp: number,
): Promise<string> {
  const apiKey = getRequiredEnv("OPENAI_API_KEY");

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature: temp,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        { role: "user", content: prompt },
      ],
    }),
  });

  if (!response.ok) {
    throw formatHttpError("openai", response.status, await response.text());
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };

  return data.choices?.[0]?.message?.content ?? "";
}

async function callClaude(
  model: string,
  system: string,
  prompt: string,
  temp: number,
): Promise<string> {
  const apiKey = getRequiredEnv("ANTHROPIC_API_KEY");

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      max_tokens: 2048,
      temperature: temp,
      system,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!response.ok) {
    throw formatHttpError("claude", response.status, await response.text());
  }

  const data = (await response.json()) as {
    content?: Array<{ type?: string; text?: string }>;
  };

  return (
    data.content
      ?.filter((part) => part.type === "text")
      .map((part) => part.text ?? "")
      .join("") ?? ""
  );
}

async function callLocalLlamaCpp(
  model: string,
  system: string,
  prompt: string,
  temp: number,
): Promise<string> {
  const baseUrl = (
    process.env.LLAMA_CPP_BASE_URL ?? "http://127.0.0.1:8080"
  ).replace(/\/+$/, "");
  const apiKey = process.env.LLAMA_CPP_API_KEY;

  const response = await fetch(`${baseUrl}/v1/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
    },
    body: JSON.stringify({
      ...(model ? { model } : {}),
      temperature: temp,
      messages: [
        {
          role: "system",
          content: `${system}\n\nReturn only valid JSON without markdown code fences.`,
        },
        { role: "user", content: prompt },
      ],
    }),
  });

  if (!response.ok) {
    throw formatHttpError("local", response.status, await response.text());
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };

  return data.choices?.[0]?.message?.content ?? "";
}

async function streamOpenAI(
  model: string,
  system: string,
  messages: Array<{ role: "user" | "assistant"; content: string }>,
  temp: number,
): Promise<ReadableStream<Uint8Array>> {
  const apiKey = getRequiredEnv("OPENAI_API_KEY");

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature: temp,
      stream: true,
      messages: [{ role: "system", content: system }, ...messages],
    }),
  });

  if (!response.ok) {
    throw formatHttpError("openai", response.status, await response.text());
  }
  if (!response.body) {
    throw new AIWrapperError(
      "EMPTY_PROVIDER_RESPONSE",
      "OpenAI returned an empty stream body.",
    );
  }

  return convertOpenAISseToTextStream(response.body);
}

async function streamLocalLlamaCpp(
  model: string,
  system: string,
  messages: Array<{ role: "user" | "assistant"; content: string }>,
  temp: number,
): Promise<ReadableStream<Uint8Array>> {
  const baseUrl = (
    process.env.LLAMA_CPP_BASE_URL ?? "http://127.0.0.1:8080"
  ).replace(/\/+$/, "");
  const apiKey = process.env.LLAMA_CPP_API_KEY;

  const response = await fetch(`${baseUrl}/v1/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
    },
    body: JSON.stringify({
      ...(model ? { model } : {}),
      temperature: temp,
      stream: true,
      messages: [{ role: "system", content: system }, ...messages],
    }),
  });

  if (!response.ok) {
    throw formatHttpError("local", response.status, await response.text());
  }
  if (!response.body) {
    throw new AIWrapperError(
      "EMPTY_PROVIDER_RESPONSE",
      "Local provider returned an empty stream body.",
    );
  }
  return convertOpenAISseToTextStream(response.body);
}

function convertOpenAISseToTextStream(
  source: ReadableStream<Uint8Array>,
): ReadableStream<Uint8Array> {
  const reader = source.getReader();
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();

  return new ReadableStream<Uint8Array>({
    async start(controller) {
      let buffer = "";

      try {
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith("data:")) continue;

            const payload = trimmed.slice(5).trim();
            if (payload === "[DONE]") {
              controller.close();
              return;
            }

            try {
              const parsed = JSON.parse(payload) as {
                choices?: Array<{ delta?: { content?: string } }>;
              };
              const token = parsed.choices?.[0]?.delta?.content;
              if (token) controller.enqueue(encoder.encode(token));
            } catch {
              // ignore malformed fragments
            }
          }
        }
        controller.close();
      } catch (error) {
        controller.error(error);
      } finally {
        reader.releaseLock();
      }
    },
  });
}

async function streamGemini(
  model: string,
  system: string,
  messages: Array<{ role: "user" | "assistant"; content: string }>,
  temp: number,
): Promise<ReadableStream<Uint8Array>> {
  const apiKey = getRequiredEnv("GEMINI_API_KEY");

  // Map our role names to Gemini's. Assistant → model.
  const contents = messages.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:streamGenerateContent?alt=sse&key=${encodeURIComponent(apiKey)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents,
        generationConfig: { temperature: temp },
      }),
    },
  );

  if (!response.ok) {
    throw formatHttpError("gemini", response.status, await response.text());
  }
  if (!response.body) {
    throw new AIWrapperError(
      "EMPTY_PROVIDER_RESPONSE",
      "Gemini returned an empty stream body.",
    );
  }

  return convertGeminiSseToTextStream(response.body);
}

function convertGeminiSseToTextStream(
  source: ReadableStream<Uint8Array>,
): ReadableStream<Uint8Array> {
  const reader = source.getReader();
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();

  return new ReadableStream<Uint8Array>({
    async start(controller) {
      let buffer = "";
      try {
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          // Gemini SSE frames are `data: {...}\n\n`. Split on newlines and
          // reassemble partial `data:` payloads incrementally.
          let newlineIdx = buffer.indexOf("\n");
          while (newlineIdx !== -1) {
            const line = buffer.slice(0, newlineIdx).trim();
            buffer = buffer.slice(newlineIdx + 1);
            newlineIdx = buffer.indexOf("\n");
            if (!line.startsWith("data:")) continue;
            const payload = line.slice(5).trim();
            if (!payload || payload === "[DONE]") continue;

            try {
              const parsed = JSON.parse(payload) as {
                candidates?: Array<{
                  content?: { parts?: Array<{ text?: string }> };
                }>;
              };
              const token = parsed.candidates?.[0]?.content?.parts
                ?.map((p) => p.text ?? "")
                .join("");
              if (token) controller.enqueue(encoder.encode(token));
            } catch {
              // ignore malformed fragments
            }
          }
        }
        controller.close();
      } catch (error) {
        controller.error(error);
      } finally {
        reader.releaseLock();
      }
    },
  });
}

async function callGeminiEmbedding(
  model: string,
  input: string,
  outputDimensionality: number,
): Promise<number[]> {
  const apiKey = getRequiredEnv("GEMINI_API_KEY");

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:embedContent?key=${encodeURIComponent(apiKey)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: { parts: [{ text: input }] },
        outputDimensionality,
      }),
    },
  );

  if (!response.ok) {
    throw formatHttpError("gemini", response.status, await response.text());
  }

  const data = (await response.json()) as {
    embedding?: { values?: number[] };
  };

  const embedding = data.embedding?.values;
  if (!embedding || embedding.length === 0) {
    throw new AIWrapperError(
      "EMPTY_EMBEDDING_RESPONSE",
      "Gemini returned an empty embedding vector.",
    );
  }
  return embedding;
}

async function callOpenAIEmbedding(
  model: string,
  input: string,
): Promise<number[]> {
  const apiKey = getRequiredEnv("OPENAI_API_KEY");

  const response = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ model, input }),
  });

  if (!response.ok) {
    throw formatHttpError("openai", response.status, await response.text());
  }

  const data = (await response.json()) as {
    data?: Array<{ embedding?: number[] }>;
  };

  const embedding = data.data?.[0]?.embedding;
  if (!embedding || embedding.length === 0) {
    throw new AIWrapperError(
      "EMPTY_EMBEDDING_RESPONSE",
      "OpenAI returned an empty embedding vector.",
    );
  }
  return embedding;
}

async function callLocalEmbedding(
  model: string,
  input: string,
): Promise<number[]> {
  const baseUrl = (
    process.env.LLAMA_CPP_BASE_URL ?? "http://127.0.0.1:8080"
  ).replace(/\/+$/, "");
  const apiKey = process.env.LLAMA_CPP_API_KEY;

  const response = await fetch(`${baseUrl}/v1/embeddings`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
    },
    body: JSON.stringify({ ...(model ? { model } : {}), input }),
  });

  if (!response.ok) {
    throw formatHttpError("local", response.status, await response.text());
  }

  const data = (await response.json()) as {
    data?: Array<{ embedding?: number[] }>;
  };

  const embedding = data.data?.[0]?.embedding;
  if (!embedding || embedding.length === 0) {
    throw new AIWrapperError(
      "EMPTY_EMBEDDING_RESPONSE",
      "Local provider returned an empty embedding vector.",
    );
  }
  return embedding;
}
