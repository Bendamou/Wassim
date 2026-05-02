import { Router } from "express";
import { db } from "@workspace/db";
import { jobsTable, usersTable, bidsTable } from "@workspace/db";
import { CreateJobBody, UpdateJobStatusBody } from "@workspace/api-zod";
import { eq, count, desc } from "drizzle-orm";
import { getUserFromToken } from "./auth";

const router = Router();

async function formatJob(job: typeof jobsTable.$inferSelect) {
  const [client] = await db.select().from(usersTable).where(eq(usersTable.id, job.clientId)).limit(1);
  const [bidsCountRow] = await db.select({ count: count() }).from(bidsTable).where(eq(bidsTable.jobId, job.id));

  return {
    id: job.id,
    clientId: job.clientId,
    client: client ? {
      id: client.id,
      name: client.name,
      email: client.email,
      role: client.role,
      location: client.location,
      bio: client.bio,
      isVerified: client.isVerified,
      rating: client.rating,
      avatar: client.avatar,
      createdAt: client.createdAt?.toISOString(),
    } : undefined,
    service: job.service,
    budget: job.budget,
    location: job.location,
    scheduledTime: job.scheduledTime?.toISOString(),
    status: job.status,
    bidsCount: bidsCountRow?.count ?? 0,
    createdAt: job.createdAt?.toISOString(),
  };
}

router.get("/jobs", async (req, res) => {
  const token = req.headers.authorization?.replace("Bearer ", "");
  const user = await getUserFromToken(token);

  let jobs;
  if (user?.role === "client") {
    jobs = await db.select().from(jobsTable).where(eq(jobsTable.clientId, user.id)).orderBy(desc(jobsTable.createdAt));
  } else {
    jobs = await db.select().from(jobsTable).where(eq(jobsTable.status, "open")).orderBy(desc(jobsTable.createdAt));
  }

  const formatted = await Promise.all(jobs.map(formatJob));
  res.json(formatted);
});

router.post("/jobs", async (req, res) => {
  const token = req.headers.authorization?.replace("Bearer ", "");
  const user = await getUserFromToken(token);
  if (!user) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  const parsed = CreateJobBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: "Invalid request body" });
    return;
  }

  const { service, budget, location, scheduledTime } = parsed.data;

  const [job] = await db.insert(jobsTable).values({
    clientId: user.id,
    service: service as "haircut" | "beard" | "nails" | "full_grooming",
    budget,
    location,
    scheduledTime: scheduledTime ? new Date(scheduledTime) : null,
    status: "open",
  }).returning();

  const formatted = await formatJob(job);
  res.status(201).json(formatted);
});

router.get("/jobs/:id", async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    res.status(400).json({ message: "Invalid ID" });
    return;
  }

  const [job] = await db.select().from(jobsTable).where(eq(jobsTable.id, id)).limit(1);
  if (!job) {
    res.status(404).json({ message: "Job not found" });
    return;
  }

  const formatted = await formatJob(job);
  res.json(formatted);
});

router.patch("/jobs/:id/status", async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    res.status(400).json({ message: "Invalid ID" });
    return;
  }

  const parsed = UpdateJobStatusBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: "Invalid request body" });
    return;
  }

  const [job] = await db
    .update(jobsTable)
    .set({ status: parsed.data.status as "open" | "in_progress" | "completed" | "cancelled" })
    .where(eq(jobsTable.id, id))
    .returning();

  if (!job) {
    res.status(404).json({ message: "Job not found" });
    return;
  }

  const formatted = await formatJob(job);
  res.json(formatted);
});

export default router;
