import { Request, Response } from "express";
import asyncHandler from "express-async-handler";
import { z } from "zod";
import { ApiError } from "../utils/ApiError";
import { TOOLS, ToolName, runTool } from "../services/toolService";

export const listTools = asyncHandler(async (_req: Request, res: Response) => {
  res.json({ success: true, data: TOOLS });
});

const toolRunSchema = z.object({
  tool: z.enum(["synonym", "antonym", "dialogue_improver", "tone_modifier"]),
  input: z.object({
    word: z.string().optional(),
    dialogue: z.string().optional(),
    text: z.string().optional(),
    targetTone: z.string().optional(),
    persona: z.string().optional(),
  }),
});

export const runToolHandler = asyncHandler(async (req: Request, res: Response) => {
  const parsed = toolRunSchema.safeParse(req.body);
  if (!parsed.success) throw ApiError.badRequest("Invalid tool request", parsed.error.flatten());

  const { tool, input } = parsed.data;
  const result = await runTool(tool as ToolName, input);
  res.json({ success: true, data: { tool, result } });
});
