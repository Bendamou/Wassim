import { db } from "@workspace/db";
import { jobsTable, bidsTable, usersTable } from "@workspace/db";
import { eq, and, lt, count, inArray } from "drizzle-orm";
import { logger } from "./logger";

const GHOST_PRO_EMAILS = [
  "hamza@wassem.app",
  "elite@wassem.app",
  "mocoif@wassem.app",
  "hassan@wassem.app",
  "tariq@wassem.app",
  "rachid@wassem.app",
  "luxecasa@wassem.app",
  "anas@wassem.app",
  "younese@wassem.app",
  "karimo@wassem.app",
  "karim@wassem.ma",
  "younes@wassem.ma",
];

const ETAS = ["5 mins", "8 mins", "10 mins", "12 mins", "15 mins", "18 mins", "20 mins"];

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pickRandom<T>(arr: T[], n: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}

async function getGhostPros() {
  return db
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(
      and(
        eq(usersTable.role, "professional"),
        inArray(usersTable.email, GHOST_PRO_EMAILS),
      ),
    );
}

async function processNewJobs() {
  // Find open jobs created in the last 5 minutes with fewer than 3 ghost bids
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

  const openJobs = await db
    .select()
    .from(jobsTable)
    .where(and(eq(jobsTable.status, "open"), lt(jobsTable.createdAt, new Date())));

  if (openJobs.length === 0) return;

  const ghostPros = await getGhostPros();
  if (ghostPros.length === 0) return;
  const ghostProIds = ghostPros.map((p) => p.id);

  for (const job of openJobs) {
    // Only auto-bid on recently created jobs (last 5 min)
    if (!job.createdAt || job.createdAt < fiveMinutesAgo) continue;

    // Count how many ghost bids already exist for this job
    const [existingBidsRow] = await db
      .select({ count: count() })
      .from(bidsTable)
      .where(and(eq(bidsTable.jobId, job.id), inArray(bidsTable.professionalId, ghostProIds)));

    const existingBidCount = Number(existingBidsRow?.count ?? 0);
    if (existingBidCount >= 4) continue;

    // Pick 1-2 ghost pros who haven't bid yet
    const biddedProRows = await db
      .select({ professionalId: bidsTable.professionalId })
      .from(bidsTable)
      .where(eq(bidsTable.jobId, job.id));

    const biddedProIds = biddedProRows.map((r) => r.professionalId);
    const availablePros = ghostProIds.filter((id) => !biddedProIds.includes(id));
    if (availablePros.length === 0) continue;

    const numBidders = randomInt(1, Math.min(2, availablePros.length));
    const selectedPros = pickRandom(availablePros, numBidders);

    for (const proId of selectedPros) {
      // 40% chance: accept exact price, 60% chance: counter 10-20 MAD higher
      const acceptsPrice = Math.random() < 0.4;
      const counterOffset = acceptsPrice ? 0 : randomInt(10, 20);
      const bidPrice = job.budget + counterOffset;
      const eta = ETAS[randomInt(0, ETAS.length - 1)];

      await db.insert(bidsTable).values({
        jobId: job.id,
        professionalId: proId,
        price: bidPrice,
        estimatedArrival: eta,
        status: "pending",
      });

      logger.info({ jobId: job.id, proId, bidPrice, eta }, "Ghost bid placed");
    }
  }
}

export function startGhostBidder() {
  logger.info("Ghost bidder started — checking for new jobs every 8s");

  // Initial delay 6s then every 8s
  setTimeout(() => {
    processNewJobs().catch((err) => logger.error({ err }, "Ghost bidder error"));
    setInterval(() => {
      processNewJobs().catch((err) => logger.error({ err }, "Ghost bidder error"));
    }, 8000);
  }, 6000);
}
