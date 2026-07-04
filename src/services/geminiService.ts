import { GoogleGenerativeAI } from "@google/generative-ai";
import { env } from "../config/env";
import { AIMessage } from "./groqService";

const client = env.geminiApiKey ? new GoogleGenerativeAI(env.geminiApiKey) : null;

/**
 * Gemini is used for the "deep lane": long-context reasoning over the full
 * manuscript so far (e.g. "does this scene stay consistent with chapter 3?"),
 * and writing suggestions that benefit from a bigger context window than
 * Groq's fast models comfortably handle.
 */
export async function geminiComplete(
  messages: AIMessage[],
  options?: { temperature?: number; maxTokens?: number }
): Promise<string> {
  if (!client) {
    throw new Error(
      "Gemini API key is not configured. Set GEMINI_API_KEY in your .env file."
    );
  }

  const model = client.getGenerativeModel({ model: env.geminiModel });

  const system = messages.find((m) => m.role === "system")?.content;
  const history = messages
    .filter((m) => m.role !== "system")
    .map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

  const chat = model.startChat({
    history: history.slice(0, -1),
    systemInstruction: system,
    generationConfig: {
      temperature: options?.temperature ?? 0.7,
      maxOutputTokens: options?.maxTokens ?? 2048,
    },
  });

  const last = history[history.length - 1];
  const result = await chat.sendMessage(last?.parts[0]?.text ?? "");
  return result.response.text();
}
