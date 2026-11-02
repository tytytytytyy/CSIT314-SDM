// Shared database connection for every entity class.
//
// - Uses SQLite (one file, no server to install): data/app.db
// - Tables are created automatically the first time the app runs.
// - Unit tests call useTestDatabase() to get a fresh in-memory database,
//   so tests never touch the real data file.

import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

export type DB = Database.Database;

const DEFAULT_DB_PATH = path.join(process.cwd(), "data", "app.db");

const SCHEMA = `
  CREATE TABLE IF NOT EXISTS user_profile (
    profileID   INTEGER PRIMARY KEY,
    name        TEXT NOT NULL UNIQUE
  );

  CREATE TABLE IF NOT EXISTS user_account (
    accountID   INTEGER PRIMARY KEY AUTOINCREMENT,
    email       TEXT NOT NULL UNIQUE,
    password    TEXT NOT NULL,
    profileID   INTEGER NOT NULL REFERENCES user_profile(profileID),
    status      TEXT NOT NULL CHECK (status IN ('pending', 'active', 'suspended', 'rejected')),
    createdAt   TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS idp_category (
    categoryID  INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT NOT NULL UNIQUE,
    isActive    INTEGER NOT NULL DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS idp (
    idpID       INTEGER PRIMARY KEY AUTOINCREMENT,
    designerID  INTEGER NOT NULL REFERENCES user_account(accountID),
    title       TEXT NOT NULL,
    description TEXT NOT NULL,
    categoryID  INTEGER NOT NULL REFERENCES idp_category(categoryID),
    budget      REAL,
    createdAt   TEXT NOT NULL,
    updatedAt   TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS idp_photo (
    photoID     INTEGER PRIMARY KEY AUTOINCREMENT,
    idpID       INTEGER NOT NULL REFERENCES idp(idpID) ON DELETE CASCADE,
    photoURL    TEXT NOT NULL,
    caption     TEXT,
    sortOrder   INTEGER NOT NULL,
    uploadedAt  TEXT NOT NULL
  );
`;

// The four fixed user profiles (roles) from the project spec.
export const PROFILE = {
  USER_ADMIN: 1,
  INTERIOR_DESIGNER: 2,
  CUSTOMER: 3,
  PLATFORM_MANAGEMENT: 4,
} as const;

export function createDatabase(filePath: string = DEFAULT_DB_PATH): DB {
  if (filePath !== ":memory:") {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
  }
  const db = new Database(filePath);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  db.exec(SCHEMA);
  db.prepare(
    `INSERT OR IGNORE INTO user_profile (profileID, name) VALUES
       (1, 'User Admin'), (2, 'Interior Designer'), (3, 'Customer'), (4, 'Platform Management')`
  ).run();
  return db;
}

let current: DB | null = null;

// Every entity calls this to get the connection.
export function getDb(): DB {
  if (!current) current = createDatabase(process.env.DB_PATH ?? DEFAULT_DB_PATH);
  return current;
}

// For unit tests only: swap in a fresh in-memory database.
export function useTestDatabase(): DB {
  current = createDatabase(":memory:");
  return current;
}

export function nowISO(): string {
  return new Date().toISOString();
}
