import { Router } from "express";
import { db } from "@workspace/db";
import { getUserFromToken } from "./auth";
import { logger } from "../lib/logger";

const router = Router();

// Raw SQL helpers via the pg pool from drizzle's driver
import { sql } from "drizzle-orm";

// --- GET /api/salons  (list, with available chair count) ---
router.get("/salons", async (req, res) => {
  try {
    const rows = await db.execute(sql`
      SELECT
        s.*,
        u.name AS owner_name,
        u.avatar AS owner_avatar,
        COUNT(c.id) FILTER (WHERE c.status = 'available') AS free_chairs,
        COUNT(c.id) AS total_chairs
      FROM salons s
      LEFT JOIN users u ON u.id = s.owner_id
      LEFT JOIN chairs c ON c.salon_id = s.id
      GROUP BY s.id, u.name, u.avatar
      ORDER BY free_chairs DESC, s.name ASC
    `);
    res.json(rows.rows);
  } catch (err) {
    req.log.error({ err }, "GET /salons failed");
    res.status(500).json({ message: "Internal error" });
  }
});

// --- GET /api/salons/:id  (full detail) ---
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

    res.json({ ...salonRow, chairs, services, products, reviews });
  } catch (err) {
    req.log.error({ err }, "GET /salons/:id failed");
    res.status(500).json({ message: "Internal error" });
  }
});

// --- POST /api/salons  (create salon, salon_owner only) ---
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

// --- PATCH /api/salons/:id/chairs/:chairId  (toggle chair status) ---
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

// --- POST /api/salons/:id/chairs  (add chair) ---
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

// --- GET /api/salons/:id/reviews ---
router.get("/salons/:id/reviews", async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const reviews = (await db.execute(sql`
    SELECT r.*, u.name AS client_name, u.avatar AS client_avatar
    FROM reviews r LEFT JOIN users u ON u.id = r.client_id
    WHERE r.salon_id = ${id} ORDER BY r.created_at DESC
  `)).rows;
  res.json(reviews);
});

// --- POST /api/salons/:id/reviews ---
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

  const enriched = {
    ...review,
    client_name: user.name,
    client_avatar: user.avatar,
  };
  res.status(201).json(enriched);
});

export default router;
