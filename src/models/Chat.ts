import { Schema, model, Document as MongooseDocument, Types } from "mongoose";

export type MessageRole = "user" | "assistant" | "tool";

export interface IChatMessage {
  role: MessageRole;
  content: string;
  toolName?: string;
  createdAt: Date;
}

export interface IChat extends MongooseDocument {
  _id: Types.ObjectId;
  persona: Types.ObjectId;
  document?: Types.ObjectId;
  messages: IChatMessage[];
  createdAt: Date;
  updatedAt: Date;
}

const chatMessageSchema = new Schema<IChatMessage>(
  {
    role: { type: String, enum: ["user", "assistant", "tool"], required: true },
    content: { type: String, required: true },
    toolName: { type: String },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const chatSchema = new Schema<IChat>(
  {
    persona: { type: Schema.Types.ObjectId, ref: "Persona", required: true, unique: true, index: true },
    document: { type: Schema.Types.ObjectId, ref: "WritingDocument" },
    messages: { type: [chatMessageSchema], default: [] },
  },
  { timestamps: true }
);

// One chat thread per persona keeps "separate chat history per persona" simple.
export const Chat = model<IChat>("Chat", chatSchema);
