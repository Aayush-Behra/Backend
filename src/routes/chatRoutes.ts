import { Router } from "express";
import {
  getChatHistory,
  sendMessage,
  streamMessage,
  clearChat,
} from "../controllers/chatController";

const router = Router();

router.get("/:personaId", getChatHistory);
router.post("/:personaId/message", sendMessage);
router.post("/:personaId/stream", streamMessage);
router.delete("/:personaId", clearChat);

export default router; 
