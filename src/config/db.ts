import mongoose from "mongoose";
import { env } from "./env";

/**
 * Connects to MongoDB using Mongoose.
 * Why a dedicated module: keeps connection concerns (retries, logging,
 * event listeners) out of server.ts, and makes it trivial to mock in tests.
 */
export async function connectDatabase(): Promise<void> {
  mongoose.set("strictQuery", true);

  try {
    await mongoose.connect(env.mongoUri);
    console.log(`[db] Connected to MongoDB at ${maskUri(env.mongoUri)}`);
  } catch (error) {
    console.error("[db] Failed to connect to MongoDB", error);
    process.exit(1);
  }

  mongoose.connection.on("disconnected", () => {
    console.warn("[db] MongoDB disconnected");
  });

  mongoose.connection.on("error", (err) => {
    console.error("[db] MongoDB connection error", err);
  });
}

function maskUri(uri: string): string {
  // Avoid printing credentials in logs if present in the URI.
  return uri.replace(/\/\/(.*):(.*)@/, "//***:***@");
}
