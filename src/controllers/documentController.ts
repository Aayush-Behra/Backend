import { Request, Response } from "express";
import asyncHandler from "express-async-handler";
import { z } from "zod";
import { WritingDocument } from "../models/WritingDocument";
import { ApiError } from "../utils/ApiError";

/** Returns the sidebar tree: volumes -> chapters, sorted for display. */
export const listDocuments = asyncHandler(async (_req: Request, res: Response) => {
  const docs = await WritingDocument.find()
    .sort({ volumeOrder: 1, chapterOrder: 1 })
    .select("-content");
  res.json({ success: true, data: docs });
});

export const getDocument = asyncHandler(async (req: Request, res: Response) => {
  const doc = await WritingDocument.findOne({ _id: req.params.id });
  if (!doc) throw ApiError.notFound("Document not found");
  res.json({ success: true, data: doc });
});

const createSchema = z.object({
  volumeTitle: z.string().min(1),
  volumeOrder: z.number().optional(),
  chapterTitle: z.string().min(1),
  chapterOrder: z.number().optional(),
  content: z.string().optional(),
});

export const createDocument = asyncHandler(async (req: Request, res: Response) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) throw ApiError.badRequest("Invalid document data", parsed.error.flatten());

  const doc = await WritingDocument.create(parsed.data);
  res.status(201).json({ success: true, data: doc });
});

const updateSchema = createSchema.partial().extend({
  isDraft: z.boolean().optional(),
});

/** Autosave endpoint — the frontend debounces calls to this on every edit. */
export const updateDocument = asyncHandler(async (req: Request, res: Response) => {
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) throw ApiError.badRequest("Invalid document data", parsed.error.flatten());

  const doc = await WritingDocument.findOne({ _id: req.params.id });
  if (!doc) throw ApiError.notFound("Document not found");

  Object.assign(doc, parsed.data);
  await doc.save();

  res.json({
    success: true,
    data: { id: doc._id, wordCount: doc.wordCount, charCount: doc.charCount, updatedAt: doc.updatedAt },
  });
});

export const deleteDocument = asyncHandler(async (req: Request, res: Response) => {
  const doc = await WritingDocument.findOneAndDelete({ _id: req.params.id });
  if (!doc) throw ApiError.notFound("Document not found");
  res.json({ success: true, data: { id: req.params.id } });
});
