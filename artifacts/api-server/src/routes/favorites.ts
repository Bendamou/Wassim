import { Router } from "express";
import { db } from "@workspace/db";
import { sql } from "drizzle-orm";
import { getUserFromToken } from "./auth";

const router = Router();

// ── GET /api/users/favorites ─────────────────────────────────────────────────
router.get("/users/favorites", async (req, res) => {
  const token = req.headers.authorization?.replace("Bearer ", "");
  const user = await getUserFromToken(token);
  if (!user) { res.status(401).json({ message: "Unauthorized" }); return; }

  try {
    const rows = (await db.execute(sql`
      SELECT
        s.*,
        u.name  AS owner_name,
        uf.created_at AS favorited_at,
        COUNT(c.id) FILTER (WHERE c.status = 'available') AS free_chairs,
        COUNT(c.id) AS total_chairs,
        COUNT(cc.id) FILTER (WHERE cc.status IN ('pending','confirmed')) AS active_claims
      FROM user_favorites uf
      JOIN salons s ON s.id = uf.salon_id
      LEFT JOIN users u ON u.id = s.owner_id
      LEFT JOIN chairs c ON c.salon_id = s.id
      LEFT JOIN chair_claims cc ON cc.salon_id = s.id AND cc.expires_at > now()
      WHERE uf.user_id = ${user.id}
      GROUP BY s.id, u.name, uf.created_at
      ORDER BY uf.created_at DESC
    `)).rows;
    res.json(rows);
  } catch (err) {
    req.log.error({ err }, "GET /users/favorites failed");
    res.status(500).json({ message: "Internal error" });
  }
});

// ── POST /api/users/favorites/:salonId ───────────────────────────────────────
router.post("/users/favorites/:salonId", async (req, res) => {
  const salonId = parseInt(req.params.salonId, 10);
  if (isNaN(salonId)) { res.status(400).json({ message: "Invalid salon ID" }); return; }

  const token = req.headers.authorization?.replace("Bearer ", "");
  const user = await getUserFromToken(token);
  if (!user) { res.status(401).json({ message: "Unauthorized" }); return; }

  try {
    const [row] = (await db.execute(sql`
      INSERT INTO user_favorites (user_id, salon_id)
      VALUES (${user.id}, ${salonId})
      ON CONFLICT (user_id, salon_id) DO NOTHING
      RETURNING *
    `)).rows;
    res.status(201).json(row ?? { user_id: user.id, salon_id: salonId, already: true });
  } catch (err) {
    req.log.error({ err }, "POST /users/favorites/:salonId failed");
    res.status(500).json({ message: "Internal error" });
  }
});

// ── DELETE /api/users/favorites/:salonId ─────────────────────────────────────
router.delete("/users/favorites/:salonId", async (req, res) => {
  const salonId = parseInt(req.params.salonId, 10);
  if (isNaN(salonId)) { res.status(400).json({ message: "Invalid salon ID" }); return; }

  const token = req.headers.authorization?.replace("Bearer ", "");
  const user = await getUserFromToken(token);
  if (!user) { res.status(401).json({ message: "Unauthorized" }); return; }

  try {
    await db.execute(sql`
      DELETE FROM user_favorites WHERE user_id = ${user.id} AND salon_id = ${salonId}
    `);
    res.json({ ok: true });
  } catch (err) {
    req.log.error({ err }, "DELETE /users/favorites/:salonId failed");
    res.status(500).json({ message: "Internal error" });
  }
});

// ── GET /api/users/favorites/check/:salonId ──────────────────────────────────
router.get("/users/favorites/check/:salonId", async (req, res) => {
  const salonId = parseInt(req.params.salonId, 10);
  if (isNaN(salonId)) { res.status(400).json({ message: "Invalid salon ID" }); return; }

  const token = req.headers.authorization?.replace("Bearer ", "");
  const user = await getUserFromToken(token);
  if (!user) { res.status(401).json({ message: "Unauthorized" }); return; }

  try {
    const [row] = (await db.execute(sql`
      SELECT 1 FROM user_favorites WHERE user_id = ${user.id} AND salon_id = ${salonId}
    `)).rows;
    res.json({ isFavorite: !!row });
  } catch (err) {
    req.log.error({ err }, "GET /users/favorites/check/:salonId failed");
    res.status(500).json({ message: "Internal error" });
  }
});

export default router;
