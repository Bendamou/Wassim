import { Router } from "express";
import { db } from "@workspace/db";
import { getUserFromToken } from "./auth";
import { logger } from "../lib/logger";

const router = Router();

import { sql } from "drizzle-orm";

// ── GET /api/salons ──────────────────────────────────────────────────────────
router.get("/salons", async (req, res) => {
  try {
    const rows = await db.execute(sql`
      SELECT
        s.*,
        u.name AS owner_name,
        u.avatar AS owner_avatar,
        COUNT(c.id) FILTER (WHERE c.status = 'available') AS free_chairs,
        COUNT(c.id) AS total_chairs,
        COUNT(cc.id) FILTER (WHERE cc.status IN ('pending','confirmed')) AS active_claims
      FROM salons s
      LEFT JOIN users u ON u.id = s.owner_id
      LEFT JOIN chairs c ON c.salon_id = s.id
      LEFT JOIN chair_claims cc ON cc.salon_id = s.id AND cc.expires_at > now()
      GROUP BY s.id, u.name, u.avatar
      ORDER BY s.is_live DESC, free_chairs DESC, s.name ASC
    `);
    res.json(rows.rows);
  } catch (err) {
    req.log.error({ err }, "GET /salons failed");
    res.status(500).json({ message: "Internal error" });
  }
});

// ── GET /api/salons/nearby  (geofenced, live shops only within radius km) ────
router.get("/salons/nearby", async (req, res) => {
  const lat  = parseFloat(req.query.lat as string);
  const lng  = parseFloat(req.query.lng as string);
  const radius = parseFloat((req.query.radius as string) ?? "5");

  if (isNaN(lat) || isNaN(lng)) {
    res.status(400).json({ message: "lat and lng required" }); return;
  }

  try {
    const rows = await db.execute(sql`
      SELECT
        s.*,
        u.name AS owner_name,
        COUNT(c.id) FILTER (WHERE c.status = 'available') AS free_chairs,
        COUNT(c.id) AS total_chairs,
        COUNT(cc.id) FILTER (WHERE cc.status IN ('pending','confirmed')) AS active_claims,
        (6371 * acos(
          cos(radians(${lat})) * cos(radians(s.lat)) *
          cos(radians(s.lng) - radians(${lng})) +
          sin(radians(${lat})) * sin(radians(s.lat))
        )) AS distance_km
      FROM salons s
      LEFT JOIN users u ON u.id = s.owner_id
      LEFT JOIN chairs c ON c.salon_id = s.id
      LEFT JOIN chair_claims cc ON cc.salon_id = s.id AND cc.expires_at > now()
      WHERE s.lat IS NOT NULL AND s.lng IS NOT NULL
        AND s.is_live = true
        AND (6371 * acos(
          cos(radians(${lat})) * cos(radians(s.lat)) *
          cos(radians(s.lng) - radians(${lng})) +
          sin(radians(${lat})) * sin(radians(s.lat))
        )) <= ${radius}
      GROUP BY s.id, u.name
      HAVING COUNT(c.id) FILTER (WHERE c.status = 'available') > 0
      ORDER BY distance_km ASC
    `);
    res.json(rows.rows);
  } catch (err) {
    req.log.error({ err }, "GET /salons/nearby failed");
    res.status(500).json({ message: "Internal error" });
  }
});

// ── GET /api/salons/:id ──────────────────────────────────────────────────────
router.get("/salons/:id", async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ message: "Invalid ID" }); return; }

  try {
    const [salonRow] = (await db.execute(sql`
      SELECT s.*, u.name AS owner_name, u.avatar AS owner_avatar,
             COUNT(c2.id) FILTER (WHERE c2.status = 'available') AS free_chairs,
             COUNT(c2.id) AS total_chairs
      FROM salons s
      LEFT JOIN users u ON u.id = s.owner_id
      LEFT JOIN chairs c2 ON c2.salon_id = s.id
      WHERE s.id = ${id}
      GROUP BY s.id, u.name, u.avatar
    `)).rows;

    if (!salonRow) { res.status(404).json({ message: "Salon not found" }); return; }

    const chairs   = (await db.execute(sql`SELECT * FROM chairs WHERE salon_id = ${id} ORDER BY name`)).rows;
    const services = (await db.execute(sql`SELECT * FROM salon_services WHERE salon_id = ${id} ORDER BY price`)).rows;
    const products = (await db.execute(sql`SELECT * FROM salon_products WHERE salon_id = ${id} ORDER BY name`)).rows;
    const reviews  = (await db.execute(sql`
      SELECT r.*, u.name AS client_name, u.avatar AS client_avatar
      FROM reviews r LEFT JOIN users u ON u.id = r.client_id
      WHERE r.salon_id = ${id} ORDER BY r.created_at DESC
    `)).rows;
    const activeClaims = (await db.execute(sql`
      SELECT cc.*, u.name AS client_name, u.avatar AS client_avatar
      FROM chair_claims cc
      LEFT JOIN users u ON u.id = cc.client_id
      WHERE cc.salon_id = ${id}
        AND cc.status IN ('pending','confirmed')
        AND cc.expires_at > now()
      ORDER BY cc.created_at ASC
    `)).rows;

    res.json({ ...salonRow, chairs, services, products, reviews, activeClaims });
  } catch (err) {
    req.log.error({ err }, "GET /salons/:id failed");
    res.status(500).json({ message: "Internal error" });
  }
});

// ── POST /api/salons  (create) ───────────────────────────────────────────────
router.post("/salons", async (req, res) => {
  const token = req.headers.authorization?.replace("Bearer ", "");
  const user = await getUserFromToken(token);
  if (!user || user.role !== "salon_owner") {
    res.status(403).json({ message: "Salon owners only" }); return;
  }

  const { name, description, address, lat, lng, header_image } = req.body;
  if (!name) { res.status(400).json({ message: "Name required" }); return; }

  try {
    const [salon] = (await db.execute(sql`
      INSERT INTO salons (owner_id, name, description, address, lat, lng, header_image)
      VALUES (${user.id}, ${name}, ${description ?? null}, ${address ?? null},
              ${lat ?? null}, ${lng ?? null}, ${header_image ?? null})
      RETURNING *
    `)).rows;
    res.status(201).json(salon);
  } catch (err) {
    req.log.error({ err }, "POST /salons failed");
    res.status(500).json({ message: "Internal error" });
  }
});

// ── POST /api/salons/:id/go-live  (toggle is_live) ───────────────────────────
router.post("/salons/:id/go-live", async (req, res) => {
  const salonId = parseInt(req.params.id, 10);
  const token = req.headers.authorization?.replace("Bearer ", "");
  const user = await getUserFromToken(token);
  if (!user) { res.status(401).json({ message: "Unauthorized" }); return; }

  try {
    const [existing] = (await db.execute(sql`SELECT * FROM salons WHERE id = ${salonId}`)).rows as any[];
    if (!existing) { res.status(404).json({ message: "Salon not found" }); return; }
    if (Number(existing.owner_id) !== Number(user.id)) {
      res.status(403).json({ message: "Only the salon owner can go live" }); return;
    }

    const nowLive = !existing.is_live;
    const [updated] = (await db.execute(sql`
      UPDATE salons
      SET is_live = ${nowLive},
          live_since = ${nowLive ? sql`now()` : sql`NULL`}
      WHERE id = ${salonId}
      RETURNING *
    `)).rows;

    res.json(updated);
  } catch (err) {
    req.log.error({ err }, "POST /salons/:id/go-live failed");
    res.status(500).json({ message: "Internal error" });
  }
});

// ── PATCH /api/salons/:id  (update salon fields) ─────────────────────────────
router.patch("/salons/:id", async (req, res) => {
  const salonId = parseInt(req.params.id, 10);
  const token = req.headers.authorization?.replace("Bearer ", "");
  const user = await getUserFromToken(token);
  if (!user) { res.status(401).json({ message: "Unauthorized" }); return; }

  const { avg_service_price, name, description, address, photos } = req.body;
  try {
    const [updated] = (await db.execute(sql`
      UPDATE salons SET
        avg_service_price = COALESCE(${avg_service_price ?? null}, avg_service_price),
        name        = COALESCE(${name        ?? null}, name),
        description = COALESCE(${description ?? null}, description),
        address     = COALESCE(${address     ?? null}, address),
        photos      = COALESCE(${photos      ?? null}, photos)
      WHERE id = ${salonId}
      RETURNING *
    `)).rows;
    res.json(updated);
  } catch (err) {
    req.log.error({ err }, "PATCH /salons/:id failed");
    res.status(500).json({ message: "Internal error" });
  }
});

// ── POST /api/salons/:id/claim-chair  (client claims a walk-in slot) ─────────
router.post("/salons/:id/claim-chair", async (req, res) => {
  const salonId = parseInt(req.params.id, 10);
  const token = req.headers.authorization?.replace("Bearer ", "");
  const user = await getUserFromToken(token);
  if (!user) { res.status(401).json({ message: "Unauthorized" }); return; }

  const { card_last4, card_holder, deposit_amount, service_name, client_lat, client_lng } = req.body;
  if (!card_last4 || card_last4.length !== 4 || !/^\d+$/.test(card_last4)) {
    res.status(400).json({ message: "card_last4 must be 4 digits" }); return;
  }

  try {
    const [salon] = (await db.execute(sql`
      SELECT s.*, COUNT(c.id) FILTER (WHERE c.status='available') AS free_chairs
      FROM salons s LEFT JOIN chairs c ON c.salon_id = s.id
      WHERE s.id = ${salonId} AND s.is_live = true
      GROUP BY s.id
    `)).rows as any[];

    if (!salon) {
      res.status(404).json({ message: "Salon is not currently live" }); return;
    }
    if (Number(salon.free_chairs) === 0) {
      res.status(409).json({ message: "No available chairs right now" }); return;
    }

    // Check if client already has an active claim here
    const [existing] = (await db.execute(sql`
      SELECT id FROM chair_claims
      WHERE salon_id = ${salonId} AND client_id = ${user.id}
        AND status IN ('pending','confirmed') AND expires_at > now()
    `)).rows as any[];
    if (existing) {
      res.status(409).json({ message: "You already have an active claim at this salon" }); return;
    }

    // Auto-assign first available chair
    const [chair] = (await db.execute(sql`
      SELECT * FROM chairs WHERE salon_id = ${salonId} AND status = 'available' LIMIT 1
    `)).rows as any[];

    const [claim] = (await db.execute(sql`
      INSERT INTO chair_claims (salon_id, chair_id, client_id, status, deposit_amount, card_last4, card_holder, service_name, client_lat, client_lng)
      VALUES (${salonId}, ${chair?.id ?? null}, ${user.id}, 'confirmed',
              ${deposit_amount ?? 20}, ${card_last4}, ${card_holder ?? null}, ${service_name ?? null},
              ${client_lat ?? null}, ${client_lng ?? null})
      RETURNING *
    `)).rows;

    // Count queue position
    const [{ count }] = (await db.execute(sql`
      SELECT COUNT(*) FROM chair_claims
      WHERE salon_id = ${salonId} AND status IN ('pending','confirmed') AND expires_at > now()
    `)).rows as any[];

    res.status(201).json({ ...claim, queue_position: Number(count), salon_name: salon.name });
  } catch (err) {
    req.log.error({ err }, "POST /salons/:id/claim-chair failed");
    res.status(500).json({ message: "Internal error" });
  }
});

// ── GET /api/salons/:id/queue  (barber sees their live queue) ────────────────
router.get("/salons/:id/queue", async (req, res) => {
  const salonId = parseInt(req.params.id, 10);
  try {
    const rows = (await db.execute(sql`
      SELECT cc.*, u.name AS client_name, u.avatar AS client_avatar,
             c.name AS chair_name
      FROM chair_claims cc
      LEFT JOIN users u ON u.id = cc.client_id
      LEFT JOIN chairs c ON c.id = cc.chair_id
      WHERE cc.salon_id = ${salonId}
        AND cc.status IN ('pending','confirmed','en_route')
        AND cc.expires_at > now()
      ORDER BY cc.created_at ASC
    `)).rows;
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: "Internal error" });
  }
});

// ── PATCH /api/claims/:id  (mark no-show, complete, cancel) ──────────────────
router.patch("/claims/:id", async (req, res) => {
  const claimId = parseInt(req.params.id, 10);
  const token = req.headers.authorization?.replace("Bearer ", "");
  const user = await getUserFromToken(token);
  if (!user) { res.status(401).json({ message: "Unauthorized" }); return; }

  const { status } = req.body;
  const allowed = ["completed", "noshow", "cancelled", "en_route"];
  if (!allowed.includes(status)) {
    res.status(400).json({ message: `status must be one of ${allowed.join(", ")}` }); return;
  }

  try {
    const [claim] = (await db.execute(sql`
      UPDATE chair_claims SET status = ${status} WHERE id = ${claimId} RETURNING *
    `)).rows;
    res.json(claim);
  } catch (err) {
    res.status(500).json({ message: "Internal error" });
  }
});

// ── GET /api/claims/mine  (client's active claims) ────────────────────────────
router.get("/claims/mine", async (req, res) => {
  const token = req.headers.authorization?.replace("Bearer ", "");
  const user = await getUserFromToken(token);
  if (!user) { res.status(401).json({ message: "Unauthorized" }); return; }

  try {
    const rows = (await db.execute(sql`
      SELECT cc.*, s.name AS salon_name, s.address AS salon_address,
             c.name AS chair_name
      FROM chair_claims cc
      JOIN salons s ON s.id = cc.salon_id
      LEFT JOIN chairs c ON c.id = cc.chair_id
      WHERE cc.client_id = ${user.id}
        AND cc.status IN ('pending','confirmed')
        AND cc.expires_at > now()
      ORDER BY cc.created_at DESC
    `)).rows;
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: "Internal error" });
  }
});

// ── PATCH /api/salons/:id/chairs/:chairId ────────────────────────────────────
router.patch("/salons/:id/chairs/:chairId", async (req, res) => {
  const salonId  = parseInt(req.params.id, 10);
  const chairId  = parseInt(req.params.chairId, 10);
  const token = req.headers.authorization?.replace("Bearer ", "");
  const user = await getUserFromToken(token);

  if (!user) { res.status(401).json({ message: "Unauthorized" }); return; }

  const [chair] = (await db.execute(sql`SELECT * FROM chairs WHERE id = ${chairId} AND salon_id = ${salonId}`)).rows as any[];
  if (!chair) { res.status(404).json({ message: "Chair not found" }); return; }

  const newStatus = chair.status === "available" ? "occupied" : "available";
  const [updated] = (await db.execute(sql`
    UPDATE chairs SET status = ${newStatus} WHERE id = ${chairId} RETURNING *
  `)).rows;

  res.json(updated);
});

// ── POST /api/salons/:id/chairs ──────────────────────────────────────────────
router.post("/salons/:id/chairs", async (req, res) => {
  const salonId = parseInt(req.params.id, 10);
  const token = req.headers.authorization?.replace("Bearer ", "");
  const user = await getUserFromToken(token);
  if (!user) { res.status(401).json({ message: "Unauthorized" }); return; }

  const { name } = req.body;
  if (!name) { res.status(400).json({ message: "Chair name required" }); return; }

  const [chair] = (await db.execute(sql`
    INSERT INTO chairs (salon_id, name, status) VALUES (${salonId}, ${name}, 'available') RETURNING *
  `)).rows;
  res.status(201).json(chair);
});

// ── GET /api/salons/:id/reviews ──────────────────────────────────────────────
router.get("/salons/:id/reviews", async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const reviews = (await db.execute(sql`
    SELECT r.*, u.name AS client_name, u.avatar AS client_avatar
    FROM reviews r LEFT JOIN users u ON u.id = r.client_id
    WHERE r.salon_id = ${id} ORDER BY r.created_at DESC
  `)).rows;
  res.json(reviews);
});

// ── POST /api/salons/:id/reviews ─────────────────────────────────────────────
router.post("/salons/:id/reviews", async (req, res) => {
  const salonId = parseInt(req.params.id, 10);
  const token = req.headers.authorization?.replace("Bearer ", "");
  const user = await getUserFromToken(token);
  if (!user) { res.status(401).json({ message: "Unauthorized" }); return; }

  const { rating, comment, photo_url } = req.body;
  if (!rating || rating < 1 || rating > 5) {
    res.status(400).json({ message: "Rating 1-5 required" }); return;
  }

  const [review] = (await db.execute(sql`
    INSERT INTO reviews (salon_id, client_id, rating, comment, photo_url)
    VALUES (${salonId}, ${user.id}, ${rating}, ${comment ?? null}, ${photo_url ?? null})
    RETURNING *
  `)).rows;

  res.status(201).json({ ...review, client_name: user.name, client_avatar: user.avatar });
});

// ── GET /api/flash-offers/active ─────────────────────────────────────────────
router.get("/flash-offers/active", async (req, res) => {
  try {
    const now = new Date();
    const hour = now.getHours();
    const dow = now.getDay();

    const offers = (await db.execute(sql`
      SELECT fo.*, s.name AS salon_name, s.lat, s.lng
      FROM flash_offers fo
      JOIN salons s ON s.id = fo.salon_id
      WHERE fo.is_active = true
        AND fo.start_hour <= ${hour}
        AND fo.end_hour > ${hour}
        AND (fo.day_of_week IS NULL OR fo.day_of_week = ${dow})
    `)).rows;
    res.json(offers);
  } catch (err) {
    req.log.error({ err }, "GET /flash-offers/active failed");
    res.status(500).json({ message: "Internal error" });
  }
});

// ── GET /api/salons/:id/flash-offers ─────────────────────────────────────────
router.get("/salons/:id/flash-offers", async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ message: "Invalid ID" }); return; }
  try {
    const offers = (await db.execute(sql`
      SELECT * FROM flash_offers WHERE salon_id = ${id} ORDER BY created_at DESC
    `)).rows;
    res.json(offers);
  } catch (err) {
    res.status(500).json({ message: "Internal error" });
  }
});

// ── POST /api/salons/:id/flash-offers ────────────────────────────────────────
router.post("/salons/:id/flash-offers", async (req, res) => {
  const salonId = parseInt(req.params.id, 10);
  const token = req.headers.authorization?.replace("Bearer ", "");
  const user = await getUserFromToken(token);
  if (!user) { res.status(401).json({ message: "Unauthorized" }); return; }

  const { title, discount_pct, day_of_week, start_hour, end_hour } = req.body;
  if (!title || !discount_pct || start_hour == null || end_hour == null) {
    res.status(400).json({ message: "title, discount_pct, start_hour, end_hour required" }); return;
  }

  try {
    const [offer] = (await db.execute(sql`
      INSERT INTO flash_offers (salon_id, title, discount_pct, day_of_week, start_hour, end_hour, is_active)
      VALUES (${salonId}, ${title}, ${discount_pct}, ${day_of_week ?? null}, ${start_hour}, ${end_hour}, true)
      RETURNING *
    `)).rows;
    res.status(201).json(offer);
  } catch (err) {
    req.log.error({ err }, "POST /flash-offers failed");
    res.status(500).json({ message: "Internal error" });
  }
});

// ── PATCH /api/flash-offers/:id ──────────────────────────────────────────────
router.patch("/flash-offers/:id", async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const token = req.headers.authorization?.replace("Bearer ", "");
  const user = await getUserFromToken(token);
  if (!user) { res.status(401).json({ message: "Unauthorized" }); return; }

  const { is_active } = req.body;
  try {
    const [offer] = (await db.execute(sql`
      UPDATE flash_offers SET is_active = ${is_active} WHERE id = ${id} RETURNING *
    `)).rows;
    res.json(offer);
  } catch (err) {
    res.status(500).json({ message: "Internal error" });
  }
});

export default router;
