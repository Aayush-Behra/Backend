import dotenv from "dotenv";

dotenv.config();

/**
 * Centralized, typed access to environment variables.
 * Why: scattering `process.env.X` across the codebase makes it hard to know
 * what config the app depends on and easy to typo a key. Reading it once
 * here also lets us fail fast on boot if something critical is missing.
 */
function required(key: string, fallback?: string): string {
  const value = process.env[key] ?? fallback;
  if (value === undefined) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

export const env = {
  port: parseInt(process.env.PORT || "5000", 10),
  nodeEnv: process.env.NODE_ENV || "development",
  clientUrl: process.env.CLIENT_URL || "http://localhost:5173",

  mongoUri: required("MONGO_URI", "mongodb://localhost:27017/inspire-inks"),

  groqApiKey: process.env.GROQ_API_KEY || "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",
  groqModel: process.env.GROQ_MODEL || "llama-3.1-70b-versatile",

  geminiApiKey: process.env.GEMINI_API_KEY || "",
  geminiModel: process.env.GEMINI_MODEL || "gemini-1.5-pro",

  notionApiKey: process.env.NOTION_API_KEY || "AQ.Ab8RN6JfoEk5NZeQXuCAxQ4nNQXWu5ih_iTQrbhTa_gPKGNUVw",

  isProd: process.env.NODE_ENV === "production",
};
