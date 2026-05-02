import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable, bidsTable } from "@workspace/db";
import { eq, count } from "drizzle-orm";

const router = Router();

router.get("/professionals", async (req, res) => {
  const professionals = await db
    .select({
      id: usersTable.id,
      name: usersTable.name,
      email: usersTable.email,
      location: usersTable.location,
      bio: usersTable.bio,
      isVerified: usersTable.isVerified,
      rating: usersTable.rating,
      avatar: usersTable.avatar,
    })
    .from(usersTable)
    .where(eq(usersTable.role, "professional"));

  const result = await Promise.all(
    professionals.map(async (p) => {
      const [totalRow] = await db
        .select({ count: count() })
        .from(bidsTable)
        .where(eq(bidsTable.professionalId, p.id));
      const [acceptedRow] = await db
        .select({ count: count() })
        .from(bidsTable)
        .where(eq(bidsTable.professionalId, p.id));
      return {
        ...p,
        totalBids: totalRow?.count ?? 0,
        acceptedBids: acceptedRow?.count ?? 0,
      };
    })
  );

  res.json(result);
});

router.get("/professionals/:id", async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    res.status(400).json({ message: "Invalid ID" });
    return;
  }

  const [professional] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, id))
    .limit(1);

  if (!professional || professional.role !== "professional") {
    res.status(404).json({ message: "Professional not found" });
    return;
  }

  const [totalRow] = await db
    .select({ count: count() })
    .from(bidsTable)
    .where(eq(bidsTable.professionalId, id));

  const [acceptedRow] = await db
    .select({ count: count() })
    .from(bidsTable)
    .where(eq(bidsTable.professionalId, id));

  res.json({
    id: professional.id,
    name: professional.name,
    email: professional.email,
    location: professional.location,
    bio: professional.bio,
    isVerified: professional.isVerified,
    rating: professional.rating,
    avatar: professional.avatar,
    totalBids: totalRow?.count ?? 0,
    acceptedBids: acceptedRow?.count ?? 0,
  });
});

export default router;
