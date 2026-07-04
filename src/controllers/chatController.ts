import { Request, Response } from "express";
import asyncHandler from "express-async-handler";
import { z } from "zod";
import { Chat } from "../models/Chat";
import { Persona } from "../models/Persona";
import { ApiError } from "../utils/ApiError";
import { buildPersonaSystemPrompt, routeCompletion, routeStream } from "../services/aiRouter";
import { getActiveStoryContext } from "../utils/context";
import { AIMessage } from "../services/groqService";

async function getOrCreateChat(personaId: string) {
  let chat = await Chat.findOne({ persona: personaId });
  if (!chat) {
    chat = await Chat.create({ persona: personaId, messages: [] });
  }
  return chat;
}

export const getChatHistory = asyncHandler(async (req: Request, res: Response) => {
  const persona = await Persona.findOne({ _id: req.params.personaId });
  if (!persona) throw ApiError.notFound("Persona not found");

  const chat = await getOrCreateChat(persona._id.toString());
  res.json({ success: true, data: chat.messages });
});

const sendMessageSchema = z.object({
  message: z.string().min(1),
  documentId: z.string().optional(),
  useDeepReasoning: z.boolean().optional(),
});

/**
 * Non-streaming send: persists the user message, calls the AI, persists
 * and returns the reply. Used as a fallback for clients that don't consume
 * SSE (and by the stream endpoint's persistence step below).
 */
export const sendMessage = asyncHandler(async (req: Request, res: Response) => {
  const persona = await Persona.findOne({ _id: req.params.personaId });
  if (!persona) throw ApiError.notFound("Persona not found");

  const parsed = sendMessageSchema.safeParse(req.body);
  if (!parsed.success) throw ApiError.badRequest("Invalid message", parsed.error.flatten());
  const { message, documentId, useDeepReasoning } = parsed.data;

  const chat = await getOrCreateChat(persona._id.toString());
  chat.messages.push({ role: "user", content: message, createdAt: new Date() });

  const storyContext = await getActiveStoryContext(documentId);
  const systemPrompt = buildPersonaSystemPrompt(persona, storyContext);

  const aiMessages: AIMessage[] = [
    { role: "system", content: systemPrompt },
    ...chat.messages.slice(-12).map((m) => ({
      role: (m.role === "tool" ? "assistant" : m.role) as "user" | "assistant",
      content: m.content,
    })),
  ];

  const reply = await routeCompletion(useDeepReasoning ? "deep-analysis" : "chat", aiMessages);
  chat.messages.push({ role: "assistant", content: reply, createdAt: new Date() });
  await chat.save();

  res.json({ success: true, data: { reply, messages: chat.messages } });
});

/**
 * Streaming send via Server-Sent Events. The frontend opens this with
 * fetch()+ReadableStream (see chatService.ts) to render tokens as they
 * arrive, matching the "typing" feel described in the brief.
 */
export const streamMessage = asyncHandler(async (req: Request, res: Response) => {
  const persona = await Persona.findOne({ _id: req.params.personaId });
  if (!persona) throw ApiError.notFound("Persona not found");

  const parsed = sendMessageSchema.safeParse(req.body);
  if (!parsed.success) throw ApiError.badRequest("Invalid message", parsed.error.flatten());
  const { message, documentId } = parsed.data;

  const chat = await getOrCreateChat(persona._id.toString());
  chat.messages.push({ role: "user", content: message, createdAt: new Date() });

  const storyContext = await getActiveStoryContext(documentId);
  const systemPrompt = buildPersonaSystemPrompt(persona, storyContext);

  const aiMessages: AIMessage[] = [
    { role: "system", content: systemPrompt },
    ...chat.messages.slice(-12).map((m) => ({
      role: (m.role === "tool" ? "assistant" : m.role) as "user" | "assistant",
      content: m.content,
    })),
  ];

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  let full = "";
  try {
    for await (const token of routeStream(aiMessages)) {
      full += token;
      res.write(`data: ${JSON.stringify({ token })}\n\n`);
    }
  } catch (err) {
    res.write(`data: ${JSON.stringify({ error: (err as Error).message })}\n\n`);
    res.end();
    return;
  }

  chat.messages.push({ role: "assistant", content: full, createdAt: new Date() });
  await chat.save();

  res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
  res.end();
});

export const clearChat = asyncHandler(async (req: Request, res: Response) => {
  const chat = await Chat.findOne({ persona: req.params.personaId });
  if (!chat) throw ApiError.notFound("Chat not found");
  chat.messages = [];
  await chat.save();
  res.json({ success: true, data: chat });
});
