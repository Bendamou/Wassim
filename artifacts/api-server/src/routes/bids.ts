import { Router } from "express";
import { db } from "@workspace/db";
import { bidsTable, usersTable, jobsTable } from "@workspace/db";
import { CreateBidBody, UpdateBidStatusBody } from "@workspace/api-zod";
import { eq, count, desc } from "drizzle-orm";
import { getUserFromToken } from "./auth";

const router = Router();

async function formatBid(bid: typeof bidsTable.$inferSelect) {
  const [professional] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, bid.professionalId))
    .limit(1);

  const [totalRow] = await db.select({ count: count() }).from(bidsTable).where(eq(bidsTable.professionalId, bid.professionalId));

  return {
    id: bid.id,
    jobId: bid.jobId,
    professionalId: bid.professionalId,
    professional: professional ? {
      id: professional.id,
      name: professional.name,
      email: professional.email,
      location: professional.location,
      bio: professional.bio,
      isVerified: professional.isVerified,
      rating: professional.rating,
      avatar: professional.avatar,
      totalBids: totalRow?.count ?? 0,
      acceptedBids: 0,
    } : undefined,
    price: bid.price,
    estimatedArrival: bid.estimatedArrival,
    status: bid.status,
    createdAt: bid.createdAt?.toISOString(),
  };
}

router.get("/jobs/:id/bids", async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    res.status(400).json({ message: "Invalid ID" });
    return;
  }

  const bids = await db
    .select()
    .from(bidsTable)
    .where(eq(bidsTable.jobId, id))
    .orderBy(desc(bidsTable.createdAt));

  const formatted = await Promise.all(bids.map(formatBid));
  res.json(formatted);
});

router.get("/bids", async (req, res) => {
  const token = req.headers.authorization?.replace("Bearer ", "");
  const user = await getUserFromToken(token);
  if (!user) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  const bids = await db
    .select()
    .from(bidsTable)
    .where(eq(bidsTable.professionalId, user.id))
    .orderBy(desc(bidsTable.createdAt));

  const formatted = await Promise.all(bids.map(formatBid));
  res.json(formatted);
});

router.post("/bids", async (req, res) => {
  const token = req.headers.authorization?.replace("Bearer ", "");
  const user = await getUserFromToken(token);
  if (!user) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  const parsed = CreateBidBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: "Invalid request body" });
    return;
  }

  const { jobId, price, estimatedArrival } = parsed.data;

  const [job] = await db.select().from(jobsTable).where(eq(jobsTable.id, jobId)).limit(1);
  if (!job) {
    res.status(404).json({ message: "Job not found" });
    return;
  }

  const [bid] = await db.insert(bidsTable).values({
    jobId,
    professionalId: user.id,
    price,
    estimatedArrival: estimatedArrival ?? null,
    status: "pending",
  }).returning();

  const formatted = await formatBid(bid);
  res.status(201).json(formatted);
});

router.patch("/bids/:id/status", async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    res.status(400).json({ message: "Invalid ID" });
    return;
  }

  const parsed = UpdateBidStatusBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: "Invalid request body" });
    return;
  }

  const [bid] = await db
    .update(bidsTable)
    .set({ status: parsed.data.status as "accepted" | "rejected" })
    .where(eq(bidsTable.id, id))
    .returning();

  if (!bid) {
    res.status(404).json({ message: "Bid not found" });
    return;
  }

  if (parsed.data.status === "accepted") {
    await db
      .update(jobsTable)
      .set({ status: "in_progress" })
      .where(eq(jobsTable.id, bid.jobId));
  }

  const formatted = await formatBid(bid);
  res.json(formatted);
});

export default router;
