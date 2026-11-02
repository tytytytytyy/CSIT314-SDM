// Fills data/app.db with test data for development and the live demo.
// Run with:  npm run seed
//
// Deletes the old database first, then creates:
// - 10 IDP categories (one inactive)
// - 100 user accounts across the four profiles
//     account 1 = verified (active) interior designer  -> the default demo login
//     account 2 = pending (unverified) interior designer
// - 100 IDPs owned by active interior designers
//
// Add more tables here as the group builds more features.

import fs from "node:fs";
import path from "node:path";
import { createDatabase, PROFILE } from "../lib/db";

const DB_PATH = process.env.DB_PATH ?? path.join(process.cwd(), "data", "app.db");
for (const suffix of ["", "-wal", "-shm"]) fs.rmSync(DB_PATH + suffix, { force: true });
const db = createDatabase(DB_PATH);

// Simple repeatable random numbers, so everyone gets the same data.
let seed = 314;
const random = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
const pick = <T>(items: T[]): T => items[Math.floor(random() * items.length)];
const daysAgo = (days: number) => new Date(Date.now() - days * 86_400_000).toISOString();

const CATEGORIES = [
  "Scandinavian", "Industrial", "Minimalist", "Modern Luxury", "Japandi",
  "Contemporary", "Tropical", "Mid-Century Modern", "Peranakan", "Victorian",
];
const insertCategory = db.prepare("INSERT INTO idp_category (name, isActive) VALUES (?, ?)");
CATEGORIES.forEach((name) => insertCategory.run(name, name === "Victorian" ? 0 : 1));

const insertAccount = db.prepare(
  "INSERT INTO user_account (email, password, profileID, status, createdAt) VALUES (?, ?, ?, ?, ?)"
);
const designerIDs: number[] = [];
for (let i = 1; i <= 100; i++) {
  let profileID: number;
  let status: string;
  if (i === 1) [profileID, status] = [PROFILE.INTERIOR_DESIGNER, "active"];
  else if (i === 2) [profileID, status] = [PROFILE.INTERIOR_DESIGNER, "pending"];
  else if (i <= 4) [profileID, status] = [PROFILE.USER_ADMIN, "active"];
  else if (i <= 6) [profileID, status] = [PROFILE.PLATFORM_MANAGEMENT, "active"];
  else if (i <= 40) [profileID, status] = [PROFILE.INTERIOR_DESIGNER, pick(["active", "active", "active", "pending", "suspended"])];
  else [profileID, status] = [PROFILE.CUSTOMER, pick(["active", "active", "active", "suspended"])];

  // Demo password for every account is "password123" (hashing comes with the login feature).
  insertAccount.run(`user${i}@example.com`, "password123", profileID, status, daysAgo(Math.floor(random() * 180)));
  if (profileID === PROFILE.INTERIOR_DESIGNER && status === "active") designerIDs.push(i);
}

const ROOMS = ["Living Room", "Kitchen", "Master Bedroom", "Study", "Bathroom", "Balcony", "Whole Flat"];
const HOMES = ["4-Room HDB", "5-Room HDB", "Condo", "Executive Maisonette", "Landed Terrace", "Studio Apartment"];
const activeCategoryIDs = CATEGORIES.map((name, i) => ({ name, id: i + 1 })).filter((c) => c.name !== "Victorian");

const insertIDP = db.prepare(
  `INSERT INTO idp (designerID, title, description, categoryID, budget, createdAt, updatedAt)
   VALUES (?, ?, ?, ?, ?, ?, ?)`
);
for (let i = 1; i <= 100; i++) {
  const category = pick(activeCategoryIDs);
  const home = pick(HOMES);
  const room = pick(ROOMS);
  const created = daysAgo(Math.floor(random() * 120));
  insertIDP.run(
    pick(designerIDs),
    `${category.name} ${room} - ${home}`,
    `A ${category.name.toLowerCase()} makeover of the ${room.toLowerCase()} in a ${home}.`,
    category.id,
    Math.round((10_000 + random() * 140_000) / 500) * 500,
    created,
    created
  );
}

const count = (table: string) => (db.prepare(`SELECT COUNT(*) AS n FROM ${table}`).get() as { n: number }).n;
console.log(`Seeded ${DB_PATH}`);
console.log(`  categories: ${count("idp_category")}, accounts: ${count("user_account")}, IDPs: ${count("idp")}`);
db.close();
