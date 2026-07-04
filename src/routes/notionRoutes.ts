import { Router } from "express";
import {
  connectNotion,
  disconnectNotion,
  getNotionStatus,
  syncDocument,
} from "../controllers/notionController";

const router = Router();

router.get("/status", getNotionStatus);
router.post("/connect", connectNotion);
router.post("/disconnect", disconnectNotion);
router.post("/sync/:documentId", syncDocument);

export default router;
