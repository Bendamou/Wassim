import { pgTable, serial, integer, real, text, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { jobsTable } from "./jobs";

export const bidStatusEnum = pgEnum("bid_status", ["pending", "accepted", "rejected"]);

export const bidsTable = pgTable("bids", {
  id: serial("id").primaryKey(),
  jobId: integer("job_id").notNull().references(() => jobsTable.id),
  professionalId: integer("professional_id").notNull().references(() => usersTable.id),
  price: real("price").notNull(),
  estimatedArrival: text("estimated_arrival"),
  status: bidStatusEnum("status").notNull().default("pending"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertBidSchema = createInsertSchema(bidsTable).omit({ id: true, createdAt: true });
export type InsertBid = z.infer<typeof insertBidSchema>;
export type Bid = typeof bidsTable.$inferSelect;
