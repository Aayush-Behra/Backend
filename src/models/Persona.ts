import { Schema, model, Document as MongooseDocument, Types } from "mongoose";

export type PersonaKind = "default" | "custom";

export interface IPersona extends MongooseDocument {
  _id: Types.ObjectId;
  name: string;
  role: string;
  personality: string;
  tone: string;
  description: string;
  /** Rolling memory / notable facts the AI should remember about this persona's chats. */
  memory: string;
  kind: PersonaKind;
  color?: string;
  createdAt: Date;
  updatedAt: Date;
}

const personaSchema = new Schema<IPersona>(
  {
    name: { type: String, required: true, trim: true, unique: true },
    role: { type: String, required: true, trim: true },
    personality: { type: String, default: "" },
    tone: { type: String, default: "" },
    description: { type: String, default: "" },
    memory: { type: String, default: "" },
    kind: { type: String, enum: ["default", "custom"], default: "custom" },
    color: { type: String, default: "#64748B" },
  },
  { timestamps: true }
);

export const Persona = model<IPersona>("Persona", personaSchema);

/**
 * The two personas the app ships with by default: General AI
 * (brainstorming/writing help) and Environment Describer AI
 * (scene/ambience/world-building). Defined here, next to the schema, so the
 * "shape of a default persona" lives in one place. Seeded once on server
 * startup if the collection is empty.
 */
export function buildDefaultPersonas() {
  return [
    {
      name: "General AI",
      role: "Writing Assistant",
      personality: "Helpful, encouraging, versatile",
      tone: "Friendly and clear",
      description:
        "A general-purpose writing companion for brainstorming, structure, and getting unstuck.",
      memory: "",
      kind: "default" as const,
      color: "#64748B",
    },
    {
      name: "Environment AI",
      role: "Scene & World-Building Describer",
      personality: "Vivid, sensory, atmospheric",
      tone: "Descriptive and immersive",
      description:
        "Specializes in describing settings, ambience, and world details — e.g. 'Describe a rainy cyberpunk street.'",
      memory: "",
      kind: "default" as const,
      color: "#94A3B8",
    },
  ];
}
