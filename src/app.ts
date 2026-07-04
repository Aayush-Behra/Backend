import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { env } from "./config/env";
import { notFoundHandler, errorHandler } from "./middleware/errorHandler";

import personaRoutes from "./routes/personaRoutes";
import chatRoutes from "./routes/chatRoutes";
import documentRoutes from "./routes/documentRoutes";
import aiRoutes from "./routes/aiRoutes";
import notionRoutes from "./routes/notionRoutes";

const app = express();

app.use(helmet());
app.use(cors({ origin: env.clientUrl, credentials: true }));
app.use(express.json({ limit: "5mb" })); // generous limit: chapters can be long
app.use(morgan(env.isProd ? "combined" : "dev"));

app.get("/api/health", (_req, res) => {
  res.json({ success: true, message: "Inspire Inks API is running", env: env.nodeEnv });
});

app.use("/api/personas", personaRoutes);
app.use("/api/chats", chatRoutes);
app.use("/api/documents", documentRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/notion", notionRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
