import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable, jobsTable, bidsTable } from "@workspace/db";
import { eq, count, desc } from "drizzle-orm";
import { getUserFromToken } from "./auth";

const router = Router();

router.get("/dashboard/client", async (req, res) => {
  const token = req.headers.authorization?.replace("Bearer ", "");
  const user = await getUserFromToken(token);

  const clientId = user?.id ?? 0;

  const allJobs = await db.select().from(jobsTable).where(eq(jobsTable.clientId, clientId)).orderBy(desc(jobsTable.createdAt));
  const activeJobs = allJobs.filter((j) => j.status === "open" || j.status === "in_progress").length;

  const [pendingBidsRow] = await db
    .select({ count: count() })
    .from(bidsTable)
    .innerJoin(jobsTable, eq(bidsTable.jobId, jobsTable.id))
    .where(eq(jobsTable.clientId, clientId));

  const topProfessionals = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.role, "professional"))
    .orderBy(desc(usersTable.rating))
    .limit(5);

  const recentJobs = allJobs.slice(0, 5);

  const formattedRecentJobs = await Promise.all(recentJobs.map(async (job) => {
    const [bidsCountRow] = await db.select({ count: count() }).from(bidsTable).where(eq(bidsTable.jobId, job.id));
    return {
      id: job.id,
      clientId: job.clientId,
      service: job.service,
      budget: job.budget,
      location: job.location,
      scheduledTime: job.scheduledTime?.toISOString(),
      status: job.status,
      bidsCount: bidsCountRow?.count ?? 0,
      createdAt: job.createdAt?.toISOString(),
    };
  }));

  res.json({
    activeJobs,
    totalJobs: allJobs.length,
    pendingBids: pendingBidsRow?.count ?? 0,
    topProfessionals: topProfessionals.map((p) => ({
      id: p.id,
      name: p.name,
      email: p.email,
      location: p.location,
      bio: p.bio,
      isVerified: p.isVerified,
      rating: p.rating,
      avatar: p.avatar,
      totalBids: 0,
      acceptedBids: 0,
    })),
    recentJobs: formattedRecentJobs,
  });
});

router.get("/dashboard/professional", async (req, res) => {
  const token = req.headers.authorization?.replace("Bearer ", "");
  const user = await getUserFromToken(token);

  const professionalId = user?.id ?? 0;

  const [availableJobsRow] = await db
    .select({ count: count() })
    .from(jobsTable)
    .where(eq(jobsTable.status, "open"));

  const [myBidsRow] = await db
    .select({ count: count() })
    .from(bidsTable)
    .where(eq(bidsTable.professionalId, professionalId));

  const [acceptedBidsRow] = await db
    .select({ count: count() })
    .from(bidsTable)
    .where(eq(bidsTable.professionalId, professionalId));

  const recentJobs = await db
    .select()
    .from(jobsTable)
    .where(eq(jobsTable.status, "open"))
    .orderBy(desc(jobsTable.createdAt))
    .limit(5);

  const formattedRecentJobs = await Promise.all(recentJobs.map(async (job) => {
    const [bidsCountRow] = await db.select({ count: count() }).from(bidsTable).where(eq(bidsTable.jobId, job.id));
    return {
      id: job.id,
      clientId: job.clientId,
      service: job.service,
      budget: job.budget,
      location: job.location,
      scheduledTime: job.scheduledTime?.toISOString(),
      status: job.status,
      bidsCount: bidsCountRow?.count ?? 0,
      createdAt: job.createdAt?.toISOString(),
    };
  }));

  res.json({
    availableJobs: availableJobsRow?.count ?? 0,
    myBids: myBidsRow?.count ?? 0,
    acceptedBids: acceptedBidsRow?.count ?? 0,
    recentJobs: formattedRecentJobs,
  });
});

export default router;
