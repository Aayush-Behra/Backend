import { Request, Response } from "express";
import asyncHandler from "express-async-handler";
import { z } from "zod";
import { NotionSettings } from "../models/NotionSettings";
import { WritingDocument } from "../models/WritingDocument";
import { ApiError } from "../utils/ApiError";
import { upsertNotionPage } from "../services/notionService";

const connectSchema = z.object({
  accessToken: z.string().min(1),
  databaseId: z.string().min(1),
  syncMode: z.enum(["manual", "auto"]).optional(),
});

// There's only one writer using this app, so Notion settings are a
// singleton document rather than something scoped per-user.
export const connectNotion = asyncHandler(async (req: Request, res: Response) => {
  const parsed = connectSchema.safeParse(req.body);
  if (!parsed.success) throw ApiError.badRequest("Invalid Notion settings", parsed.error.flatten());

  const settings = await NotionSettings.findOneAndUpdate({}, parsed.data, {
    upsert: true,
    new: true,
  });

  res.json({ success: true, data: { syncMode: settings.syncMode, connected: true } });
});

export const disconnectNotion = asyncHandler(async (_req: Request, res: Response) => {
  await NotionSettings.deleteMany({});
  res.json({ success: true, data: { connected: false } });
});

export const getNotionStatus = asyncHandler(async (_req: Request, res: Response) => {
  const settings = await NotionSettings.findOne();
  res.json({
    success: true,
    data: settings
      ? { connected: true, syncMode: settings.syncMode, lastSyncedAt: settings.lastSyncedAt }
      : { connected: false },
  });
});

/** Manually push a single chapter's content to its linked (or new) Notion page. */
export const syncDocument = asyncHandler(async (req: Request, res: Response) => {
  const settings = await NotionSettings.findOne().select("+accessToken");
  if (!settings) throw ApiError.badRequest("Notion is not connected");

  const doc = await WritingDocument.findOne({ _id: req.params.documentId });
  if (!doc) throw ApiError.notFound("Document not found");

  const { pageId } = await upsertNotionPage({
    accessToken: settings.accessToken,
    databaseId: settings.databaseId!,
    pageId: doc.notionPageId,
    title: `${doc.volumeTitle} — ${doc.chapterTitle}`,
    content: doc.content,
  });

  doc.notionPageId = pageId;
  await doc.save();
  settings.lastSyncedAt = new Date();
  await settings.save();

  res.json({ success: true, data: { notionPageId: pageId, syncedAt: settings.lastSyncedAt } });
});
