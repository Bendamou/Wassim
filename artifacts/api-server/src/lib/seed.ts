import { db } from "@workspace/db";
import { sql } from "drizzle-orm";
import { logger } from "./logger";
import crypto from "crypto";

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password + "wassem_salt").digest("hex");
}

async function upsertUser(name: string, email: string, phone: string, role: string, location: string, bio: string, verified: boolean, rating: number) {
  const rows = (await db.execute(sql`
    INSERT INTO users (name, email, password_hash, phone, role, location, bio, is_verified, rating)
    VALUES (${name}, ${email}, ${hashPassword("demo123")}, ${phone}, ${role}, ${location}, ${bio}, ${verified}, ${rating})
    ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name
    RETURNING *
  `)).rows;
  return rows[0] as any;
}

async function upsertSalon(ownerId: number, name: string, description: string, address: string, lat: number, lng: number, isLive: boolean, avgPrice: number, categories: string) {
  const rows = (await db.execute(sql`
    INSERT INTO salons (owner_id, name, description, address, lat, lng, is_live, avg_service_price, categories)
    VALUES (${ownerId}, ${name}, ${description}, ${address}, ${lat}, ${lng}, ${isLive}, ${avgPrice}, ${categories})
    ON CONFLICT DO NOTHING
    RETURNING *
  `)).rows;
  if (rows[0]) return rows[0] as any;
  // Already existed — fetch and update categories
  await db.execute(sql`UPDATE salons SET categories = ${categories} WHERE owner_id = ${ownerId} AND name = ${name}`);
  const existing = (await db.execute(sql`SELECT * FROM salons WHERE owner_id = ${ownerId} AND name = ${name} LIMIT 1`)).rows;
  return existing[0] as any;
}

export async function seedDemoData() {
  // Guard: skip if demo user already fully seeded
  const check = (await db.execute(sql`SELECT id FROM users WHERE email = 'sara@tawoss.ma' LIMIT 1`)).rows;
  const salonCheck = (await db.execute(sql`SELECT COUNT(*) AS cnt FROM salons`)).rows[0] as any;
  if (check.length > 0 && Number(salonCheck.cnt) >= 4) {
    // Still update categories in case they were seeded before the column existed
    await db.execute(sql`UPDATE salons SET categories = 'barber,hair' WHERE name LIKE '%Barbershop%' OR name LIKE '%Barber Studio%'`);
    await db.execute(sql`UPDATE salons SET categories = 'hair,nails,skincare' WHERE name LIKE '%Beauty%'`);
    await db.execute(sql`UPDATE salons SET categories = 'hair,nails' WHERE name LIKE '%Coiffure%'`);
    return;
  }

  logger.info("Seeding demo data for Oujda & Berkane…");

  // ── Salon owners ──────────────────────────────────────────────────────────
  const ownerYassine = await upsertUser("Yassine Benali", "yassine@tawoss.ma", "+212612345601", "salon_owner", "Oujda",   "Propriétaire du Salon Prestige Oujda, 10 ans d'expérience.", true, 4.8);
  const ownerKarim   = await upsertUser("Karim Zoubeir",  "karim@tawoss.ma",   "+212612345602", "salon_owner", "Berkane", "Fondateur du Berkane Barber Studio.", true, 4.7);
  const ownerSara    = await upsertUser("Sara Ouali",     "sara@tawoss.ma",    "+212612345603", "salon_owner", "Oujda",   "Spécialiste coiffure féminine et soins capillaires.", true, 4.9);

  // ── Professionals ─────────────────────────────────────────────────────────
  const pro1 = await upsertUser("Hassan Miradi", "hassan@tawoss.ma", "+212612345610", "professional", "Oujda",   "Barbier mobile spécialisé coupe hommes & dégradé.", true, 4.6);
  const pro2 = await upsertUser("Rachid Afilal", "rachid@tawoss.ma", "+212612345611", "professional", "Berkane", "Expert barbe et taille moustache, déplacement rapide.", true, 4.5);
  const pro3 = await upsertUser("Mehdi Filali",  "mehdi@tawoss.ma",  "+212612345612", "professional", "Oujda",   "Coiffeur polyvalent, coupe + barbe + soins.", true, 4.3);

  // ── Clients ───────────────────────────────────────────────────────────────
  const client1 = await upsertUser("Amine Idrissi", "amine@tawoss.ma", "+212612345620", "client", "Oujda",   "", true, 0);
  const client2 = await upsertUser("Omar Benkiran", "omar@tawoss.ma",  "+212612345621", "client", "Berkane", "", true, 0);

  // ── Salons – Oujda ────────────────────────────────────────────────────────
  const salon1 = await upsertSalon(ownerYassine.id, "Prestige Barbershop Oujda",
    "Le salon haut de gamme d'Oujda. Coupes modernes, soins barbe, ambiance premium.",
    "Bd Mohammed V, Oujda 60000", 34.6814, -1.9086, true, 80, "barber,hair");

  const salon2 = await upsertSalon(ownerSara.id, "Sara Beauty & Hair Oujda",
    "Salon mixte spécialisé colorations, kératine et coiffure de mariage.",
    "Rue de Marrakech, Hay Qods, Oujda", 34.6891, -1.9120, true, 120, "hair,nails,skincare");

  // ── Salons – Berkane ──────────────────────────────────────────────────────
  const salon3 = await upsertSalon(ownerKarim.id, "Berkane Barber Studio",
    "Studio barbier tendance à Berkane. Dégradés et rasage traditionnel au savon.",
    "Centre Ville, Berkane 63300", 34.9200, -2.3200, true, 70, "barber,hair");

  const salon4 = await upsertSalon(ownerKarim.id, "Elite Coiffure Berkane",
    "Coiffeur unisexe moderne. Coupes hommes & femmes, extensions, soins capillaires.",
    "Hay El Massira, Berkane", 34.9150, -2.3280, false, 90, "hair,nails");

  // ── Chairs ────────────────────────────────────────────────────────────────
  for (const salonId of [salon1.id, salon2.id, salon3.id, salon4.id]) {
    const existing = (await db.execute(sql`SELECT COUNT(*) AS cnt FROM chairs WHERE salon_id = ${salonId}`)).rows[0] as any;
    if (Number(existing.cnt) === 0) {
      await db.execute(sql`INSERT INTO chairs (salon_id, name, status) VALUES (${salonId}, 'Chaise 1', 'available')`);
      await db.execute(sql`INSERT INTO chairs (salon_id, name, status) VALUES (${salonId}, 'Chaise 2', 'available')`);
      await db.execute(sql`INSERT INTO chairs (salon_id, name, status) VALUES (${salonId}, 'Chaise 3', 'available')`);
    }
  }

  // ── Services ──────────────────────────────────────────────────────────────
  const svcCheck = (await db.execute(sql`SELECT COUNT(*) AS cnt FROM salon_services`)).rows[0] as any;
  if (Number(svcCheck.cnt) === 0) {
    const svcRows: [number, string, number][] = [
      [salon1.id, "Coupe homme",        60],  [salon1.id, "Taille barbe",        40],
      [salon1.id, "Coupe + barbe",      90],  [salon2.id, "Coloration",         150],
      [salon2.id, "Kératine",          300],  [salon2.id, "Coupe femme",         80],
      [salon3.id, "Coupe homme",        50],  [salon3.id, "Rasage traditionnel",  35],
      [salon3.id, "Dégradé",            55],  [salon4.id, "Coupe homme",         55],
      [salon4.id, "Coupe femme",        90],
    ];
    for (const [sid, name, price] of svcRows) {
      await db.execute(sql`INSERT INTO salon_services (salon_id, name, price) VALUES (${sid}, ${name}, ${price})`);
    }
  }

  // ── Reviews ───────────────────────────────────────────────────────────────
  const revCheck = (await db.execute(sql`SELECT COUNT(*) AS cnt FROM reviews`)).rows[0] as any;
  if (Number(revCheck.cnt) === 0) {
    const reviews: [number, number, number, string][] = [
      [salon1.id, client1.id, 5, "Excellent service, ambiance top et coupe parfaite !"],
      [salon1.id, client2.id, 5, "Le meilleur barbier d'Oujda sans hésitation."],
      [salon3.id, client1.id, 4, "Très bonne coupe, je reviendrai."],
      [salon2.id, client2.id, 5, "Sara est une vraie artiste, coloration magnifique !"],
    ];
    for (const [sid, cid, rating, comment] of reviews) {
      await db.execute(sql`INSERT INTO reviews (salon_id, client_id, rating, comment) VALUES (${sid}, ${cid}, ${rating}, ${comment})`);
    }
  }

  // ── Flash offers ──────────────────────────────────────────────────────────
  const foCheck = (await db.execute(sql`SELECT COUNT(*) AS cnt FROM flash_offers`)).rows[0] as any;
  if (Number(foCheck.cnt) === 0) {
    await db.execute(sql`INSERT INTO flash_offers (salon_id, title, discount_pct, start_hour, end_hour, is_active) VALUES (${salon1.id}, '🔥 Happy Hour -20%', 20, 14, 17, true)`);
    await db.execute(sql`INSERT INTO flash_offers (salon_id, title, discount_pct, day_of_week, start_hour, end_hour, is_active) VALUES (${salon3.id}, '⚡ Lundi Barbe Gratuite', 100, 1, 9, 12, true)`);
  }

  // ── Open jobs ─────────────────────────────────────────────────────────────
  const jobCheck = (await db.execute(sql`SELECT COUNT(*) AS cnt FROM jobs`)).rows[0] as any;
  if (Number(jobCheck.cnt) === 0) {
    const j1 = (await db.execute(sql`INSERT INTO jobs (client_id, service, budget, location, status, client_lat, client_lng) VALUES (${client1.id}, 'haircut', 80, 'Hay Al Qods, Oujda', 'open', 34.6891, -1.9120) RETURNING id`)).rows[0] as any;
    const j2 = (await db.execute(sql`INSERT INTO jobs (client_id, service, budget, location, status, client_lat, client_lng) VALUES (${client1.id}, 'beard',   50, 'Centre Ville, Oujda', 'open', 34.6814, -1.9086) RETURNING id`)).rows[0] as any;
    const j3 = (await db.execute(sql`INSERT INTO jobs (client_id, service, budget, location, status, client_lat, client_lng) VALUES (${client2.id}, 'full_grooming', 120, 'Centre Ville, Berkane', 'open', 34.9200, -2.3200) RETURNING id`)).rows[0] as any;
    await db.execute(sql`INSERT INTO jobs (client_id, service, budget, location, status, client_lat, client_lng) VALUES (${client2.id}, 'haircut', 60, 'Hay El Massira, Berkane', 'open', 34.9150, -2.3280)`);

    await db.execute(sql`INSERT INTO bids (job_id, professional_id, price, estimated_arrival, status) VALUES (${j1.id}, ${pro1.id}, 70, '20 min', 'pending')`);
    await db.execute(sql`INSERT INTO bids (job_id, professional_id, price, estimated_arrival, status) VALUES (${j1.id}, ${pro3.id}, 75, '15 min', 'pending')`);
    await db.execute(sql`INSERT INTO bids (job_id, professional_id, price, estimated_arrival, status) VALUES (${j2.id}, ${pro1.id}, 45, '10 min', 'pending')`);
    await db.execute(sql`INSERT INTO bids (job_id, professional_id, price, estimated_arrival, status) VALUES (${j3.id}, ${pro2.id}, 110, '25 min', 'pending')`);
  }

  logger.info("Demo seed complete — 4 salons in Oujda & Berkane inserted.");
}
