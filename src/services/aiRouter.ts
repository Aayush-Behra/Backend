import { AIMessage, groqComplete, groqStream } from "./groqService";
import { geminiComplete } from "./geminiService";
import { IPersona } from "../models/Persona";

export type AITask = "chat" | "deep-analysis" | "tool";

/**
 * Single entry point the rest of the backend talks to for AI completions.
 * Why an abstraction layer: controllers/services should never import
 * groqService or geminiService directly — if we add/replace a provider
 * later, only this file changes. It also encodes the product's routing
 * policy in one place instead of scattering "if task === x use y" checks
 * across controllers.
 *
 * Policy:
 *  - "chat"          -> Groq (fast persona replies, tool calls)
 *  - "tool"          -> Groq (synonym/antonym/tone tools need to feel instant)
 *  - "deep-analysis" -> Gemini (long manuscript context, consistency checks)
 */
export async function routeCompletion(
  task: AITask,
  messages: AIMessage[],
  options?: { temperature?: number; maxTokens?: number }
): Promise<string> {
  if (task === "deep-analysis") {
    return geminiComplete(messages, options);
  }
  return groqComplete(messages, options);
}

export function routeStream(messages: AIMessage[], options?: { temperature?: number; maxTokens?: number }) {
  // Streaming is currently only supported on the Groq fast lane, since
  // that's what backs the live persona chat UI.
  return groqStream(messages, options);
}

/**
 * Builds the system prompt for a given persona, folding in its
 * personality/tone/description/memory plus optional story context pulled
 * from the writing canvas so replies stay grounded in what's on the page.
 */
export function buildPersonaSystemPrompt(
  persona: Pick<IPersona, "name" | "role" | "personality" | "tone" | "description" | "memory">,
  storyContext?: string
): string {
  const lines = [
    `You are ${persona.name}, acting as: ${persona.role}.`,
    persona.personality ? `Personality: ${persona.personality}.` : "",
    persona.tone ? `Tone: ${persona.tone}.` : "",
    persona.description ? `Background: ${persona.description}.` : "",
    persona.memory ? `Remember these details from earlier conversation: ${persona.memory}.` : "",
    "Stay fully in character in every reply. Respond as this persona would, not as a generic assistant.",
    "You are helping a writer who is stuck — be concise, specific, and useful for continuing their scene.",
  ];

  if (storyContext) {
    lines.push(
      "Here is the writer's current manuscript context (use it to ground your response, do not repeat it verbatim):",
      storyContext.slice(0, 6000)
    );
  }

  return lines.filter(Boolean).join("\n");
}
