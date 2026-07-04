import { routeCompletion } from "./aiRouter";

export type ToolName =
  | "synonym"
  | "antonym"
  | "dialogue_improver"
  | "tone_modifier";

export interface ToolDefinition {
  name: ToolName;
  description: string;
  /** JSON-schema-ish parameter description, used both for docs and for prompting. */
  parameters: Record<string, string>;
}

/**
 * Tool registry. Kept declarative so the same list can be surfaced to the
 * frontend (e.g. a "/" command palette) and reused if we wire this into a
 * real function-calling API later — each tool's `run` is the actual
 * implementation, `describe` is what a model/UI needs to know about it.
 */
export const TOOLS: ToolDefinition[] = [
  {
    name: "synonym",
    description: "Suggest synonyms for a given word or phrase.",
    parameters: { word: "string" },
  },
  {
    name: "antonym",
    description: "Suggest antonyms/opposites for a given word or phrase.",
    parameters: { word: "string" },
  },
  {
    name: "dialogue_improver",
    description: "Rewrite weak or flat dialogue to be sharper and more character-driven.",
    parameters: { dialogue: "string", persona: "string (optional style hint)" },
  },
  {
    name: "tone_modifier",
    description: "Rewrite text in a target tone (funny, emotional, dramatic, dark, etc).",
    parameters: { text: "string", targetTone: "string" },
  },
];

interface ToolInput {
  word?: string;
  dialogue?: string;
  text?: string;
  targetTone?: string;
  persona?: string;
}

export async function runTool(name: ToolName, input: ToolInput): Promise<string> {
  switch (name) {
    case "synonym":
      return listWords(input.word ?? "", "synonyms");
    case "antonym":
      return listWords(input.word ?? "", "antonyms");
    case "dialogue_improver":
      return improveDialogue(input.dialogue ?? "", input.persona);
    case "tone_modifier":
      return modifyTone(input.text ?? "", input.targetTone ?? "neutral");
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

async function listWords(word: string, kind: "synonyms" | "antonyms"): Promise<string> {
  if (!word.trim()) throw new Error("A word or phrase is required.");
  const prompt = `List 6 strong ${kind} for the word or phrase "${word}". ` +
    `Reply as a plain comma-separated list only, no numbering, no explanation.`;
  return routeCompletion("tool", [
    { role: "system", content: "You are a precise thesaurus tool for fiction writers." },
    { role: "user", content: prompt },
  ]);
}

async function improveDialogue(dialogue: string, persona?: string): Promise<string> {
  if (!dialogue.trim()) throw new Error("Dialogue text is required.");
  const styleHint = persona ? ` Write it in a voice consistent with: ${persona}.` : "";
  const prompt =
    `Rewrite the following dialogue to feel sharper, more natural, and more character-driven, ` +
    `while preserving its meaning.${styleHint}\n\nDialogue:\n"""${dialogue}"""\n\n` +
    `Reply with only the improved dialogue.`;
  return routeCompletion("tool", [
    { role: "system", content: "You are an expert dialogue editor for novels and screenplays." },
    { role: "user", content: prompt },
  ]);
}

async function modifyTone(text: string, targetTone: string): Promise<string> {
  if (!text.trim()) throw new Error("Text is required.");
  const prompt =
    `Rewrite the following passage in a ${targetTone} tone, keeping the same events and meaning.\n\n` +
    `Passage:\n"""${text}"""\n\nReply with only the rewritten passage.`;
  return routeCompletion("tool", [
    { role: "system", content: "You are a skilled prose stylist who rewrites text to match a requested tone." },
    { role: "user", content: prompt },
  ]);
}
