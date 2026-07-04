import { Schema, model, Document as MongooseDocument, Types } from "mongoose";

/**
 * Notion sync configuration. There's only ever one writer using this app,
 * so this is a singleton document — no owner/user reference needed.
 */
export interface INotionSettings extends MongooseDocument {
  _id: Types.ObjectId;
  accessToken?: string;
  databaseId?: string;
  syncMode: "manual" | "auto";
  lastSyncedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const notionSettingsSchema = new Schema<INotionSettings>(
  {
    accessToken: { type: String, select: false },
    databaseId: { type: String },
    syncMode: { type: String, enum: ["manual", "auto"], default: "manual" },
    lastSyncedAt: { type: Date },
  },
  { timestamps: true }
);

export const NotionSettings = model<INotionSettings>(
  "NotionSettings",
  notionSettingsSchema
);
