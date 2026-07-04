import { Router } from "express";
import { listTools, runToolHandler } from "../controllers/aiController";

const router = Router();

router.get("/tools", listTools);
router.post("/tools/run", runToolHandler);

export default router;
