import { Request, Response } from "express";
import asyncHandler from "express-async-handler";
import { z } from "zod";
import { Persona } from "../models/Persona";
import { ApiError } from "../utils/ApiError";

const personaSchema = z.object({
  name: z.string().min(1),
  role: z.string().min(1),
  personality: z.string().optional(),
  tone: z.string().optional(),
  description: z.string().optional(),
  color: z.string().optional(),
});

export const listPersonas = asyncHandler(async (_req: Request, res: Response) => {
  const personas = await Persona.find().sort({ kind: -1, createdAt: 1 });
  res.json({ success: true, data: personas });
});

export const createPersona = asyncHandler(async (req: Request, res: Response) => {
  const parsed = personaSchema.safeParse(req.body);
  if (!parsed.success) throw ApiError.badRequest("Invalid persona data", parsed.error.flatten());

  const persona = await Persona.create({
    ...parsed.data,
    kind: "custom",
  });
  res.status(201).json({ success: true, data: persona });
});

export const updatePersona = asyncHandler(async (req: Request, res: Response) => {
  const parsed = personaSchema.partial().safeParse(req.body);
  if (!parsed.success) throw ApiError.badRequest("Invalid persona data", parsed.error.flatten());

  const persona = await Persona.findOneAndUpdate(
    { _id: req.params.id },
    parsed.data,
    { new: true }
  );
  if (!persona) throw ApiError.notFound("Persona not found");
  res.json({ success: true, data: persona });
});

export const deletePersona = asyncHandler(async (req: Request, res: Response) => {
  const persona = await Persona.findOne({ _id: req.params.id });
  if (!persona) throw ApiError.notFound("Persona not found");
  if (persona.kind === "default") {
    throw ApiError.forbidden("Default personas (General AI, Environment AI) cannot be deleted");
  }
  await persona.deleteOne();
  res.json({ success: true, data: { id: req.params.id } });
});
