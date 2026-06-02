import app from "./app";
import { logger } from "./lib/logger";
import { startGhostBidder } from "./lib/ghost-bidder";
import { db } from "@workspace/db";
import { sql } from "drizzle-orm";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error("PORT environment variable is required but was not provided.");
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

(async () => {
  // Idempotent schema migrations
  try {
    await db.execute(sql`ALTER TABLE chair_claims ADD COLUMN IF NOT EXISTS client_lat DOUBLE PRECISION`);
    await db.execute(sql`ALTER TABLE chair_claims ADD COLUMN IF NOT EXISTS client_lng DOUBLE PRECISION`);
    await db.execute(sql`ALTER TABLE salons ADD COLUMN IF NOT EXISTS photos TEXT`);
    await db.execute(sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS portfolio TEXT`);
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS user_favorites (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        salon_id INTEGER NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        UNIQUE(user_id, salon_id)
      )
    `);
    logger.info("Schema migrations applied");
  } catch (err) {
    logger.warn({ err }, "Migration warning (non-fatal)");
  }

  app.listen(port, (err) => {
    if (err) {
      logger.error({ err }, "Error listening on port");
      process.exit(1);
    }
    logger.info({ port }, "Server listening");
    startGhostBidder();
  });
})();
