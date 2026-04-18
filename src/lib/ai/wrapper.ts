import { z } from 'zod';

// Define supported providers
export type AIProvider = 'gemini' | 'openai' | 'claude' | 'local';

export interface AIWrapperParams<T> {
  provider?: AIProvider;
  model?: string;
  systemInstruction: string;
  userPrompt: string;
  schema: z.ZodSchema<T>; // Forces structured output validation
  temperature?: number;
}

export interface AIStreamParams {
  provider?: AIProvider;
  model?: string;
  systemInstruction: string;
  messages: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
  temperature?: number;
}

export interface AIEmbeddingParams {
  provider?: Extract<AIProvider, 'openai' | 'local'>;
  model?: string;
  input: string;
}

export type AIErrorCode =
  | 'MISSING_API_KEY'
  | 'PROVIDER_HTTP_ERROR'
  | 'EMPTY_PROVIDER_RESPONSE'
  | 'EMPTY_EMBEDDING_RESPONSE'
  | 'INVALID_JSON'
  | 'SCHEMA_VALIDATION_FAILED'
  | 'UNSUPPORTED_PROVIDER';

export class AIWrapperError extends Error {
  constructor(
    public readonly code: AIErrorCode,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'AIWrapperError';
  }
}

const DEFAULT_MODELS: Record<AIProvider, string> = {
  gemini: 'gemini-1.5-flash',
  openai: 'gpt-4.1-mini',
  claude: 'claude-3-5-haiku-latest',
  local: process.env.LLAMA_CPP_MODEL ?? '',
};

const DEFAULT_EMBEDDING_MODELS: Record<'openai' | 'local', string> = {
  openai: 'text-embedding-3-small',
  local: process.env.LLAMA_CPP_EMBEDDING_MODEL ?? '',
};

/**
 * Generate a numeric embedding vector for semantic similarity.
 */
export async function generateEmbedding({
  provider = 'openai',
  model,
  input,
}: AIEmbeddingParams): Promise<number[]> {
  const text = input.trim();
  if (!text) {
    throw new AIWrapperError('EMPTY_PROVIDER_RESPONSE', 'Embedding input cannot be empty.');
  }

  const selectedModel = model ?? DEFAULT_EMBEDDING_MODELS[provider];

  switch (provider) {
    case 'openai':
      return callOpenAIEmbedding(selectedModel, text);
    case 'local':
      return callLocalEmbedding(selectedModel, text);
    default:
      throw new AIWrapperError('UNSUPPORTED_PROVIDER', `Unsupported embedding provider: ${provider}`);
  }
}

/**
 * Stream plain text output from a provider for chat-like interactions.
 */
export async function streamTextOutput({
  provider = 'openai',
  model,
  systemInstruction,
  messages,
  temperature = 0.2,
}: AIStreamParams): Promise<ReadableStream<Uint8Array>> {
  const selectedModel = model ?? DEFAULT_MODELS[provider];

  switch (provider) {
    case 'openai':
      return streamOpenAI(selectedModel, systemInstruction, messages, temperature);
    case 'local':
      return streamLocalLlamaCpp(selectedModel, systemInstruction, messages, temperature);
    case 'gemini':
    case 'claude':
      throw new AIWrapperError(
        'UNSUPPORTED_PROVIDER',
        `Streaming is not implemented for provider: ${provider}`,
      );
    default:
      throw new AIWrapperError('UNSUPPORTED_PROVIDER', `Unsupported provider: ${provider}`);
  }
}

/**
 * Universal wrapper for LLM calls enforcing structured JSON output.
 */
export async function generateStructuredOutput<T>({
  provider = 'gemini',
  model,
  systemInstruction,
  userPrompt,
  schema,
  temperature = 0.2, // Low temp by default for analytical tasks
}: AIWrapperParams<T>): Promise<T> {
  const selectedModel = model ?? DEFAULT_MODELS[provider];

  let rawJsonString = '';

  switch (provider) {
    case 'gemini':
      rawJsonString = await callGemini(selectedModel, systemInstruction, userPrompt, temperature);
      break;
    case 'openai':
      rawJsonString = await callOpenAI(selectedModel, systemInstruction, userPrompt, temperature);
      break;
    case 'claude':
      rawJsonString = await callClaude(selectedModel, systemInstruction, userPrompt, temperature);
      break;
    case 'local':
      rawJsonString = await callLocalLlamaCpp(selectedModel, systemInstruction, userPrompt, temperature);
      break;
    default:
      throw new AIWrapperError('UNSUPPORTED_PROVIDER', `Unsupported provider: ${provider}`);
  }

  if (!rawJsonString || !rawJsonString.trim()) {
    throw new AIWrapperError('EMPTY_PROVIDER_RESPONSE', 'Provider returned an empty response.', {
      provider,
      model: selectedModel,
    });
  }

  try {
    const parsedData = extractAndParseJson(rawJsonString);

    const validation = schema.safeParse(parsedData);
    if (!validation.success) {
      throw new AIWrapperError(
        'SCHEMA_VALIDATION_FAILED',
        'LLM output JSON did not match the expected schema.',
        validation.error.flatten(),
      );
    }

    return validation.data;
  } catch (error) {
    if (error instanceof AIWrapperError) {
      throw error;
    }

    throw new AIWrapperError('INVALID_JSON', 'Failed to parse JSON from LLM output.', {
      cause: error instanceof Error ? error.message : String(error),
      sample: rawJsonString.slice(0, 300),
    });
  }
}

// --- Provider Implementations (Abstracted for clarity) ---

function getRequiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new AIWrapperError('MISSING_API_KEY', `Missing required environment variable: ${name}`);
  }
  return value;
}

function formatHttpError(provider: AIProvider, status: number, body: string): AIWrapperError {
  return new AIWrapperError(
    'PROVIDER_HTTP_ERROR',
    `${provider} request failed with HTTP ${status}.`,
    { status, body: body.slice(0, 500) },
  );
}

function extractAndParseJson(raw: string): unknown {
  const trimmed = raw.trim();

  // Fast path: plain JSON object/array.
  try {
    return JSON.parse(trimmed);
  } catch {
    // Continue through fallback extractors.
  }

  // Common fenced output: ```json ... ``` or ``` ... ```.
  const fencedMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fencedMatch?.[1]) {
    try {
      return JSON.parse(fencedMatch[1].trim());
    } catch {
      // Continue to brace extraction.
    }
  }

  // Last resort: isolate the outermost JSON object/array span from mixed text.
  const objectStart = trimmed.indexOf('{');
  const objectEnd = trimmed.lastIndexOf('}');
  if (objectStart !== -1 && objectEnd > objectStart) {
    const candidate = trimmed.slice(objectStart, objectEnd + 1);
    return JSON.parse(candidate);
  }

  const arrayStart = trimmed.indexOf('[');
  const arrayEnd = trimmed.lastIndexOf(']');
  if (arrayStart !== -1 && arrayEnd > arrayStart) {
    const candidate = trimmed.slice(arrayStart, arrayEnd + 1);
    return JSON.parse(candidate);
  }

  throw new AIWrapperError('INVALID_JSON', 'No valid JSON payload was found in LLM output.', {
    sample: raw.slice(0, 300),
  });
}

async function callGemini(model: string, system: string, prompt: string, temp: number): Promise<string> {
  const apiKey = getRequiredEnv('GEMINI_API_KEY');

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: system }],
        },
        contents: [
          {
            role: 'user',
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          temperature: temp,
          responseMimeType: 'application/json',
        },
      }),
    },
  );

  if (!response.ok) {
    throw formatHttpError('gemini', response.status, await response.text());
  }

  const data = (await response.json()) as {
    candidates?: Array<{
      content?: {
        parts?: Array<{ text?: string }>;
      };
    }>;
  };

  return data.candidates?.[0]?.content?.parts?.map((part) => part.text ?? '').join('') ?? '';
}

async function callOpenAI(model: string, system: string, prompt: string, temp: number): Promise<string> {
  const apiKey = getRequiredEnv('OPENAI_API_KEY');

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature: temp,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: prompt },
      ],
    }),
  });

  if (!response.ok) {
    throw formatHttpError('openai', response.status, await response.text());
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };

  return data.choices?.[0]?.message?.content ?? '';
}

async function callClaude(model: string, system: string, prompt: string, temp: number): Promise<string> {
  const apiKey = getRequiredEnv('ANTHROPIC_API_KEY');

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      max_tokens: 2048,
      temperature: temp,
      system,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!response.ok) {
    throw formatHttpError('claude', response.status, await response.text());
  }

  const data = (await response.json()) as {
    content?: Array<{ type?: string; text?: string }>;
  };

  return data.content?.filter((part) => part.type === 'text').map((part) => part.text ?? '').join('') ?? '';
}

async function callLocalLlamaCpp(model: string, system: string, prompt: string, temp: number): Promise<string> {
  const baseUrl = (process.env.LLAMA_CPP_BASE_URL ?? 'http://127.0.0.1:8080').replace(/\/+$/, '');
  const apiKey = process.env.LLAMA_CPP_API_KEY;

  const response = await fetch(`${baseUrl}/v1/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
    },
    body: JSON.stringify({
      ...(model ? { model } : {}),
      temperature: temp,
      messages: [
        {
          role: 'system',
          content: `${system}\n\nReturn only valid JSON without markdown code fences.`,
        },
        { role: 'user', content: prompt },
      ],
    }),
  });

  if (!response.ok) {
    throw formatHttpError('local', response.status, await response.text());
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };

  return data.choices?.[0]?.message?.content ?? '';
}

async function streamOpenAI(
  model: string,
  system: string,
  messages: Array<{ role: 'user' | 'assistant'; content: string }>,
  temp: number,
): Promise<ReadableStream<Uint8Array>> {
  const apiKey = getRequiredEnv('OPENAI_API_KEY');

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature: temp,
      stream: true,
      messages: [
        { role: 'system', content: system },
        ...messages,
      ],
    }),
  });

  if (!response.ok) {
    throw formatHttpError('openai', response.status, await response.text());
  }

  if (!response.body) {
    throw new AIWrapperError('EMPTY_PROVIDER_RESPONSE', 'OpenAI returned an empty stream body.');
  }

  return convertOpenAISseToTextStream(response.body);
}

async function streamLocalLlamaCpp(
  model: string,
  system: string,
  messages: Array<{ role: 'user' | 'assistant'; content: string }>,
  temp: number,
): Promise<ReadableStream<Uint8Array>> {
  const baseUrl = (process.env.LLAMA_CPP_BASE_URL ?? 'http://127.0.0.1:8080').replace(/\/+$/, '');
  const apiKey = process.env.LLAMA_CPP_API_KEY;

  const response = await fetch(`${baseUrl}/v1/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
    },
    body: JSON.stringify({
      ...(model ? { model } : {}),
      temperature: temp,
      stream: true,
      messages: [
        { role: 'system', content: system },
        ...messages,
      ],
    }),
  });

  if (!response.ok) {
    throw formatHttpError('local', response.status, await response.text());
  }

  if (!response.body) {
    throw new AIWrapperError('EMPTY_PROVIDER_RESPONSE', 'Local provider returned an empty stream body.');
  }

  return convertOpenAISseToTextStream(response.body);
}

function convertOpenAISseToTextStream(source: ReadableStream<Uint8Array>): ReadableStream<Uint8Array> {
  const reader = source.getReader();
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();

  return new ReadableStream<Uint8Array>({
    async start(controller) {
      let buffer = '';

      try {
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() ?? '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith('data:')) continue;

            const payload = trimmed.slice(5).trim();
            if (payload === '[DONE]') {
              controller.close();
              return;
            }

            try {
              const parsed = JSON.parse(payload) as {
                choices?: Array<{
                  delta?: {
                    content?: string;
                  };
                }>;
              };

              const token = parsed.choices?.[0]?.delta?.content;
              if (token) {
                controller.enqueue(encoder.encode(token));
              }
            } catch {
              // Ignore malformed fragments and continue streaming.
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

async function callOpenAIEmbedding(model: string, input: string): Promise<number[]> {
  const apiKey = getRequiredEnv('OPENAI_API_KEY');

  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      input,
    }),
  });

  if (!response.ok) {
    throw formatHttpError('openai', response.status, await response.text());
  }

  const data = (await response.json()) as {
    data?: Array<{ embedding?: number[] }>;
  };

  const embedding = data.data?.[0]?.embedding;
  if (!embedding || embedding.length === 0) {
    throw new AIWrapperError('EMPTY_EMBEDDING_RESPONSE', 'OpenAI returned an empty embedding vector.');
  }

  return embedding;
}

async function callLocalEmbedding(model: string, input: string): Promise<number[]> {
  const baseUrl = (process.env.LLAMA_CPP_BASE_URL ?? 'http://127.0.0.1:8080').replace(/\/+$/, '');
  const apiKey = process.env.LLAMA_CPP_API_KEY;

  const response = await fetch(`${baseUrl}/v1/embeddings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
    },
    body: JSON.stringify({
      ...(model ? { model } : {}),
      input,
    }),
  });

  if (!response.ok) {
    throw formatHttpError('local', response.status, await response.text());
  }

  const data = (await response.json()) as {
    data?: Array<{ embedding?: number[] }>;
  };

  const embedding = data.data?.[0]?.embedding;
  if (!embedding || embedding.length === 0) {
    throw new AIWrapperError('EMPTY_EMBEDDING_RESPONSE', 'Local provider returned an empty embedding vector.');
  }

  return embedding;
}