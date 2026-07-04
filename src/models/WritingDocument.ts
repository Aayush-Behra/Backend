import { Schema, model, Document as MongooseDocument, Types } from "mongoose";

/**
 * A WritingDocument represents a single chapter's content. Chapters are
 * grouped by `volumeTitle` rather than a separate Volume collection —
 * volumes here are lightweight groupings, not entities with their own
 * behavior, so a denormalized string + order keeps reads (sidebar tree)
 * to a single query instead of a join.
 */
export interface IWritingDocument extends MongooseDocument {
  _id: Types.ObjectId;
  volumeTitle: string;
  volumeOrder: number;
  chapterTitle: string;
  chapterOrder: number;
  content: string;
  wordCount: number;
  charCount: number;
  isDraft: boolean;
  notionPageId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const writingDocumentSchema = new Schema<IWritingDocument>(
  {
    volumeTitle: { type: String, required: true, default: "Volume 1" },
    volumeOrder: { type: Number, default: 1 },
    chapterTitle: { type: String, required: true, default: "Chapter 1" },
    chapterOrder: { type: Number, default: 1 },
    content: { type: String, default: "" },
    wordCount: { type: Number, default: 0 },
    charCount: { type: Number, default: 0 },
    isDraft: { type: Boolean, default: true },
    notionPageId: { type: String },
  },
  { timestamps: true }
);

writingDocumentSchema.index({ volumeOrder: 1, chapterOrder: 1 });

// Keep word/char counts server-side authoritative, recalculated on every save
// so the sidebar and dashboards never drift from what's actually stored.
writingDocumentSchema.pre("save", function (next) {
  if (this.isModified("content")) {
    const plain = this.content.replace(/<[^>]*>/g, " ").trim();
    this.charCount = plain.length;
    this.wordCount = plain.length ? plain.split(/\s+/).length : 0;
  }
  next();
});

export const WritingDocument = model<IWritingDocument>(
  "WritingDocument",
  writingDocumentSchema
);
