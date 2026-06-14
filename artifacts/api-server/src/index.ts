import app from "./app";
import { logger } from "./lib/logger";
import { startGhostBidder } from "./lib/ghost-bidder";
import { seedDemoData } from "./lib/seed";
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
  // ── Full idempotent schema bootstrap ─────────────────────────────────────
  try {
    // 1. Enums (PostgreSQL has no CREATE TYPE IF NOT EXISTS, use DO block)
    await db.execute(sql`
      DO $$ BEGIN
        CREATE TYPE user_role AS ENUM ('client', 'professional', 'salon_owner');
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$
    `);
    // Add salon_owner to existing enums that were created without it
    await db.execute(sql`
      DO $$ BEGIN
        ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'salon_owner';
      EXCEPTION WHEN others THEN NULL;
      END $$
    `);

    await db.execute(sql`
      DO $$ BEGIN
        CREATE TYPE service_type AS ENUM ('haircut', 'beard', 'nails', 'full_grooming');
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$
    `);
    await db.execute(sql`
      DO $$ BEGIN
        CREATE TYPE job_status AS ENUM ('open', 'in_progress', 'completed', 'cancelled');
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$
    `);
    await db.execute(sql`
      DO $$ BEGIN
        CREATE TYPE bid_status AS ENUM ('pending', 'accepted', 'rejected');
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$
    `);

    // 2. Core tables
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS users (
        id            SERIAL PRIMARY KEY,
        name          TEXT NOT NULL,
        email         TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        phone         TEXT UNIQUE,
        role          user_role NOT NULL DEFAULT 'client',
        location      TEXT,
        bio           TEXT,
        is_verified   BOOLEAN NOT NULL DEFAULT false,
        rating        REAL NOT NULL DEFAULT 0,
        avatar        TEXT,
        portfolio     TEXT,
        gender_pref   TEXT NOT NULL DEFAULT 'all',
        created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS jobs (
        id             SERIAL PRIMARY KEY,
        client_id      INTEGER NOT NULL REFERENCES users(id),
        service        service_type NOT NULL,
        budget         REAL NOT NULL,
        location       TEXT NOT NULL,
        scheduled_time TIMESTAMPTZ,
        status         job_status NOT NULL DEFAULT 'open',
        client_lat     REAL,
        client_lng     REAL,
        pro_lat        REAL,
        pro_lng        REAL,
        created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS bids (
        id                SERIAL PRIMARY KEY,
        job_id            INTEGER NOT NULL REFERENCES jobs(id),
        professional_id   INTEGER NOT NULL REFERENCES users(id),
        price             REAL NOT NULL,
        estimated_arrival TEXT,
        status            bid_status NOT NULL DEFAULT 'pending',
        created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);

    // 3. Salon tables
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS salons (
        id                SERIAL PRIMARY KEY,
        owner_id          INTEGER NOT NULL REFERENCES users(id),
        name              TEXT NOT NULL,
        description       TEXT,
        address           TEXT,
        lat               DOUBLE PRECISION,
        lng               DOUBLE PRECISION,
        is_live           BOOLEAN NOT NULL DEFAULT false,
        live_since        TIMESTAMPTZ,
        avg_service_price REAL,
        header_image      TEXT,
        photos            TEXT,
        created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS chairs (
        id        SERIAL PRIMARY KEY,
        salon_id  INTEGER NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
        name      TEXT NOT NULL,
        status    TEXT NOT NULL DEFAULT 'available',
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS chair_claims (
        id             SERIAL PRIMARY KEY,
        salon_id       INTEGER NOT NULL REFERENCES salons(id),
        chair_id       INTEGER REFERENCES chairs(id),
        client_id      INTEGER NOT NULL REFERENCES users(id),
        status         TEXT NOT NULL DEFAULT 'confirmed',
        deposit_amount REAL NOT NULL DEFAULT 20,
        card_last4     TEXT NOT NULL,
        card_holder    TEXT,
        service_name   TEXT,
        client_lat     DOUBLE PRECISION,
        client_lng     DOUBLE PRECISION,
        expires_at     TIMESTAMPTZ NOT NULL DEFAULT now() + interval '2 hours',
        created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS reviews (
        id         SERIAL PRIMARY KEY,
        salon_id   INTEGER NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
        client_id  INTEGER NOT NULL REFERENCES users(id),
        rating     INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
        comment    TEXT,
        photo_url  TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS flash_offers (
        id           SERIAL PRIMARY KEY,
        salon_id     INTEGER NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
        title        TEXT NOT NULL,
        discount_pct REAL NOT NULL,
        day_of_week  INTEGER,
        start_hour   INTEGER NOT NULL,
        end_hour     INTEGER NOT NULL,
        is_active    BOOLEAN NOT NULL DEFAULT true,
        created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS salon_services (
        id        SERIAL PRIMARY KEY,
        salon_id  INTEGER NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
        name      TEXT NOT NULL,
        price     REAL NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS salon_products (
        id          SERIAL PRIMARY KEY,
        salon_id    INTEGER NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
        name        TEXT NOT NULL,
        price       REAL NOT NULL,
        description TEXT,
        created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS user_favorites (
        id         SERIAL PRIMARY KEY,
        user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        salon_id   INTEGER NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        UNIQUE(user_id, salon_id)
      )
    `);

    // 4. Idempotent column additions for tables that may already exist
    await db.execute(sql`ALTER TABLE chair_claims ADD COLUMN IF NOT EXISTS client_lat DOUBLE PRECISION`);
    await db.execute(sql`ALTER TABLE chair_claims ADD COLUMN IF NOT EXISTS client_lng DOUBLE PRECISION`);
    await db.execute(sql`ALTER TABLE salons ADD COLUMN IF NOT EXISTS photos TEXT`);
    await db.execute(sql`ALTER TABLE salons ADD COLUMN IF NOT EXISTS categories TEXT`);
    await db.execute(sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS portfolio TEXT`);
    await db.execute(sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS gender_pref TEXT NOT NULL DEFAULT 'all'`);

    logger.info("Schema bootstrap complete");
    await seedDemoData();
  } catch (err) {
    logger.error({ err }, "Schema migration FAILED — server may not work correctly");
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
