import { Router } from "express";
import { db } from "@workspace/db";
import { sql } from "drizzle-orm";
import { getUserFromToken } from "./auth";

const router = Router();

router.get("/users/favorites", async (req, res) => {
  const user = await getUserFromToken(req);
  if (!user) { res.status(401).json({ message: "Unauthorized" }); return; }
  try {
    const rows = await db.execute(sql`
      SELECT
        s.*,
        u.name AS owner_name,
        COUNT(c.id) FILTER (WHERE c.status = 'available') AS free_chairs,
        COUNT(c.id) AS total_chairs,
        COUNT(cc.id) FILTER (WHERE cc.status IN ('pending','confirmed')) AS active_claims,
        f.created_at AS favorited_at
      FROM user_favorites f
      JOIN salons s ON s.id = f.salon_id
      LEFT JOIN users u ON u.id = s.owner_id
      LEFT JOIN chairs c ON c.salon_id = s.id
      LEFT JOIN chair_claims cc ON cc.salon_id = s.id AND cc.expires_at > now()
      WHERE f.user_id = ${user.id}
      GROUP BY s.id, u.name, f.created_at
      ORDER BY f.created_at DESC
    `);
    res.json(rows.rows);
  } catch (err) {
    req.log.error({ err }, "GET /users/favorites failed");
    res.status(500).json({ message: "Internal error" });
  }
});

router.post("/users/favorites/:salonId", async (req, res) => {
  const user = await getUserFromToken(req);
  if (!user) { res.status(401).json({ message: "Unauthorized" }); return; }
  const salonId = parseInt(req.params.salonId);
  if (isNaN(salonId)) { res.status(400).json({ message: "Invalid salon ID" }); return; }
  try {
    await db.execute(sql`
      INSERT INTO user_favorites (user_id, salon_id)
      VALUES (${user.id}, ${salonId})
      ON CONFLICT (user_id, salon_id) DO NOTHING
    `);
    res.status(201).json({ ok: true });
  } catch (err) {
    req.log.error({ err }, "POST /users/favorites/:salonId failed");
    res.status(500).json({ message: "Internal error" });
  }
});

router.delete("/users/favorites/:salonId", async (req, res) => {
  const user = await getUserFromToken(req);
  if (!user) { res.status(401).json({ message: "Unauthorized" }); return; }
  const salonId = parseInt(req.params.salonId);
  if (isNaN(salonId)) { res.status(400).json({ message: "Invalid salon ID" }); return; }
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

router.get("/users/favorites/ids", async (req, res) => {
  const user = await getUserFromToken(req);
  if (!user) { res.status(401).json({ message: "Unauthorized" }); return; }
  try {
    const rows = await db.execute(sql`
      SELECT salon_id FROM user_favorites WHERE user_id = ${user.id}
    `);
    res.json(rows.rows.map((r: any) => r.salon_id));
  } catch (err) {
    req.log.error({ err }, "GET /users/favorites/ids failed");
    res.status(500).json({ message: "Internal error" });
  }
});

export default router;
