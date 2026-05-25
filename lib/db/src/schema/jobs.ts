import { pgTable, serial, integer, text, real, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const serviceTypeEnum = pgEnum("service_type", ["haircut", "beard", "nails", "full_grooming"]);
export const jobStatusEnum = pgEnum("job_status", ["open", "in_progress", "completed", "cancelled"]);

export const jobsTable = pgTable("jobs", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").notNull().references(() => usersTable.id),
  service: serviceTypeEnum("service").notNull(),
  budget: real("budget").notNull(),
  location: text("location").notNull(),
  scheduledTime: timestamp("scheduled_time"),
  status: jobStatusEnum("status").notNull().default("open"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  clientLat: real("client_lat"),
  clientLng: real("client_lng"),
  proLat: real("pro_lat"),
  proLng: real("pro_lng"),
});

export const insertJobSchema = createInsertSchema(jobsTable).omit({ id: true, createdAt: true });
export type InsertJob = z.infer<typeof insertJobSchema>;
export type Job = typeof jobsTable.$inferSelect;
