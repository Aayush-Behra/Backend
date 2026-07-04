import { WritingDocument } from "../models/WritingDocument";

/**
 * Pulls the writer's most recent content so persona chats can reference
 * "what's on the page" (e.g. "John entered the dark room..."). We only take
 * the single most-recently-edited document to keep prompts small and
 * relevant instead of dumping the entire manuscript into every request.
 */
export async function getActiveStoryContext(documentId?: string): Promise<string | undefined> {
  const doc = documentId
    ? await WritingDocument.findOne({ _id: documentId })
    : await WritingDocument.findOne().sort({ updatedAt: -1 });

  if (!doc) return undefined;
  return doc.content.replace(/<[^>]*>/g, " ").trim();
}
