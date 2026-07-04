import app from "./app";
import { env } from "./config/env";
import { connectDatabase } from "./config/db";
import { Persona, buildDefaultPersonas } from "./models/Persona";

/** Seeds the two built-in personas once, if none exist yet. */
async function seedDefaultPersonas() {
  const count = await Persona.countDocuments();
  if (count === 0) {
    await Persona.insertMany(buildDefaultPersonas());
    console.log("[server] Seeded default personas (General AI, Environment AI)");
  }
}

async function start() {
  await connectDatabase();
  await seedDefaultPersonas();
  app.listen(env.port, () => {
    console.log(`[server] Inspire Inks API listening on port ${env.port} (${env.nodeEnv})`);
  });
}

start().catch((err) => {
  console.error("[server] Failed to start", err);
  process.exit(1);
});
