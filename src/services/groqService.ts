import Groq from "groq-sdk";
import { env } from "../config/env";

export interface AIMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

const client = env.groqApiKey ? new Groq({ apiKey: env.groqApiKey }) : null;

/**
 * Groq is used for the "fast lane": persona chat replies and quick tool
 * calls where latency matters more than deep reasoning. See aiRouter.ts
 * for the decision of when Groq vs Gemini is used.
 */
export async function groqComplete(
  messages: AIMessage[],
  options?: { temperature?: number; maxTokens?: number }
): Promise<string> {
  if (!client) {
    throw new Error(
      "Groq API key is not configured. Set GROQ_API_KEY in your .env file."
    );
  }

  const completion = await client.chat.completions.create({
    model: env.groqModel,
    messages,
    temperature: options?.temperature ?? 0.8,
    max_tokens: options?.maxTokens ?? 1024,
  });

  return completion.choices[0]?.message?.content ?? "";
}

/**
 * Streaming variant used by the chat endpoint (SSE). Yields text chunks as
 * they arrive so the frontend can render tokens as they're generated.
 */
export async function* groqStream(
  messages: AIMessage[],
  options?: { temperature?: number; maxTokens?: number }
): AsyncGenerator<string> {
  if (!client) {
    throw new Error(
      "Groq API key is not configured. Set GROQ_API_KEY in your .env file."
    );
  }

  const stream = await client.chat.completions.create({
    model: env.groqModel,
    messages,
    temperature: options?.temperature ?? 0.8,
    max_tokens: options?.maxTokens ?? 1024,
    stream: true,
  });

  for await (const chunk of stream) {
    const token = chunk.choices[0]?.delta?.content;
    if (token) yield token;
  }
}
