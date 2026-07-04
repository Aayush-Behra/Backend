import { Router } from "express";
import {
  listDocuments,
  getDocument,
  createDocument,
  updateDocument,
  deleteDocument,
} from "../controllers/documentController";

const router = Router();

router.get("/", listDocuments);
router.get("/:id", getDocument);
router.post("/", createDocument);
router.patch("/:id", updateDocument);
router.delete("/:id", deleteDocument);

export default router;
