import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db";
import { RegisterBody, LoginBody } from "@workspace/api-zod";
import { eq } from "drizzle-orm";
import crypto from "crypto";

const router = Router();

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password + "wassem_salt").digest("hex");
}

function makeToken(userId: number): string {
  const payload = `${userId}:${Date.now()}`;
  return Buffer.from(payload).toString("base64");
}

router.post("/auth/register", async (req, res) => {
  const parsed = RegisterBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: "Invalid request body" });
    return;
  }

  const { name, email, password, role, location, bio } = parsed.data;

  const existing = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
  if (existing.length > 0) {
    res.status(409).json({ message: "Email already registered" });
    return;
  }

  const [user] = await db.insert(usersTable).values({
    name,
    email,
    passwordHash: hashPassword(password),
    role: role as "client" | "professional",
    location: location ?? null,
    bio: bio ?? null,
    isVerified: false,
    rating: 0,
  }).returning();

  const token = makeToken(user.id);

  res.status(201).json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      location: user.location,
      bio: user.bio,
      isVerified: user.isVerified,
      rating: user.rating,
      avatar: user.avatar,
      createdAt: user.createdAt,
    },
    token,
  });
});

router.post("/auth/login", async (req, res) => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: "Invalid request body" });
    return;
  }

  const { email, password } = parsed.data;

  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
  if (!user || user.passwordHash !== hashPassword(password)) {
    res.status(401).json({ message: "Invalid credentials" });
    return;
  }

  const token = makeToken(user.id);

  res.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      location: user.location,
      bio: user.bio,
      isVerified: user.isVerified,
      rating: user.rating,
      avatar: user.avatar,
      createdAt: user.createdAt,
    },
    token,
  });
});

router.post("/auth/phone-register", async (req, res) => {
  const { phone, name, role, gender_pref } = req.body;
  if (!phone || !name || !role) {
    res.status(400).json({ message: "phone, name and role are required" });
    return;
  }
  const email = `${phone.replace(/\+/g, "")}@wassem.app`;
  const existing = await db.select().from(usersTable).where(eq(usersTable.phone, phone)).limit(1);
  if (existing.length > 0) {
    res.status(409).json({ message: "Phone already registered" });
    return;
  }

  const { sql: rawSql } = await import("drizzle-orm");
  const validPref = ["men", "women", "all"].includes(gender_pref) ? gender_pref : "all";

  const [user] = await db.insert(usersTable).values({
    name,
    email,
    phone,
    passwordHash: hashPassword(phone),
    role: role as "client" | "professional" | "salon_owner",
    isVerified: false,
    rating: 0,
  }).returning();

  // Set gender_pref via raw SQL since it may not be in the Drizzle schema yet
  await db.execute(rawSql`UPDATE users SET gender_pref = ${validPref} WHERE id = ${user.id}`);

  const token = makeToken(user.id);
  res.status(201).json({
    user: { id: user.id, name: user.name, email: user.email, phone: user.phone, role: user.role, location: user.location, bio: user.bio, isVerified: user.isVerified, rating: user.rating, avatar: user.avatar, gender_pref: validPref, createdAt: user.createdAt },
    token,
  });
});

router.post("/auth/phone-login", async (req, res) => {
  const { phone } = req.body;
  if (!phone) {
    res.status(400).json({ message: "phone is required" });
    return;
  }
  const [user] = await db.select().from(usersTable).where(eq(usersTable.phone, phone)).limit(1);
  if (!user) {
    res.status(404).json({ message: "User not found" });
    return;
  }
  const token = makeToken(user.id);
  res.json({
    user: { id: user.id, name: user.name, email: user.email, phone: user.phone, role: user.role, location: user.location, bio: user.bio, isVerified: user.isVerified, rating: user.rating, avatar: user.avatar, createdAt: user.createdAt },
    token,
  });
});

router.post("/auth/logout", (req, res) => {
  res.json({ message: "Logged out" });
});

export async function getUserFromToken(token: string | undefined) {
  if (!token) return null;
  try {
    const decoded = Buffer.from(token, "base64").toString("utf-8");
    const userId = parseInt(decoded.split(":")[0], 10);
    if (isNaN(userId)) return null;
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
    return user ?? null;
  } catch {
    return null;
  }
}

router.get("/auth/me", async (req, res) => {
  const token = req.headers.authorization?.replace("Bearer ", "");
  const user = await getUserFromToken(token);
  if (!user) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }
  res.json({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    location: user.location,
    bio: user.bio,
    isVerified: user.isVerified,
    rating: user.rating,
    avatar: user.avatar,
    createdAt: user.createdAt,
  });
});

export default router;
