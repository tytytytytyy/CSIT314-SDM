// Entity support: LocalStore
// Stand-in for the database while the team has none. Each "table" is a JSON array in
// the browser's localStorage, filled with dummy data the first time it is read.
// Replace readTable / writeTable with real queries later; the entity methods stay the same.
//
// Database tables: idp, idp_photo, idp_like, idp_view, idp_sequence (next-ID counter for idp)
//
// The hand-made rows below are the special cases the unit tests and demo rely on. The large set
// of generated dummy data (entity/DummyData.js) is added to them the first time the app runs.
//
// Bump KEY_PREFIX when the seed data or the row shapes change, so old browser data is ignored.

import { generateDummyData, placeholderPhoto } from "./DummyData";

const KEY_PREFIX = "idp_platform_v4_";

const HAND_MADE = {
  // IDP 4 is not in this table: the designer deleted it (a hard delete), but customer C1's
  // like of it is still in idp_like, so the favourites list has to leave it out.
  idp: [
    {
      idpID: 1,
      designerID: "D1",
      title: "Bright Scandinavian Living Room",
      description:
        "Light woods, soft textiles and plenty of natural light for a 3-room flat.",
      style: "Scandinavian",
      propertyType: "HDB",
      category: "Residential",
      budget: 18000,
      status: "completed",
    },
    {
      idpID: 2,
      designerID: "D1",
      title: "Industrial Loft Conversion",
      description:
        "Exposed brick, black steel and warm lighting for a condo loft.",
      style: "Industrial",
      propertyType: "Condo",
      category: "Residential",
      budget: 42000,
      status: "ongoing",
    },
    {
      idpID: 3,
      designerID: "D2",
      title: "Minimalist Co-working Office",
      description: "Clean lines and neutral tones for a 20-seat office.",
      style: "Minimalist",
      propertyType: "Office",
      category: "Commercial",
      budget: 65000,
      status: "completed",
    },
  ],
  idp_photo: [
    {
      photoID: "P1",
      idpID: 1,
      photoURL: placeholderPhoto("Scandinavian - main", "#8aa5b8"),
      caption: "Living room",
      sortOrder: 1,
      uploadedAt: "2026-09-01T10:00:00.000Z",
    },
    {
      photoID: "P2",
      idpID: 1,
      photoURL: placeholderPhoto("Scandinavian - detail", "#a8bfa0"),
      caption: "Reading corner",
      sortOrder: 2,
      uploadedAt: "2026-09-01T10:00:00.000Z",
    },
    {
      photoID: "P3",
      idpID: 2,
      photoURL: placeholderPhoto("Industrial - main", "#6b5b52"),
      caption: "Loft",
      sortOrder: 1,
      uploadedAt: "2026-09-01T10:00:00.000Z",
    },
    {
      photoID: "P4",
      idpID: 3,
      photoURL: placeholderPhoto("Minimalist - main", "#9a9a9a"),
      caption: "Open office",
      sortOrder: 1,
      uploadedAt: "2026-09-01T10:00:00.000Z",
    },
  ],
  // Demo customer C1 already likes IDP 2 and the deleted IDP 4.
  idp_like: [
    {
      likeID: "L1",
      customerID: "C1",
      idpID: 4,
      likedAt: "2026-10-02T09:00:00.000Z",
    },
    {
      likeID: "L2",
      customerID: "C1",
      idpID: 2,
      likedAt: "2026-10-05T09:00:00.000Z",
    },
  ],
  // Last idpID handed out, like a database AUTOINCREMENT counter. It is 4 because the deleted
  // IDP 4 once existed: a new IDP must not reuse 4, or it would pick up C1's old like.
  idp_sequence: [{ lastIDPID: 4 }],
  idp_view: [],
};

// Hand-made rows plus the generated dummy data, built once per page load.
let seedCache = null;
function seed() {
  if (seedCache) return seedCache;
  const extra = generateDummyData();
  seedCache = {
    idp: [...HAND_MADE.idp, ...(extra.idp ?? [])],
    idp_photo: [...HAND_MADE.idp_photo, ...(extra.idp_photo ?? [])],
    idp_like: [...HAND_MADE.idp_like, ...(extra.idp_like ?? [])],
    idp_view: [...HAND_MADE.idp_view, ...(extra.idp_view ?? [])],
    idp_sequence: [{ lastIDPID: Math.max(HAND_MADE.idp_sequence[0].lastIDPID, extra.lastIDPID ?? 0) }],
  };
  return seedCache;
}

// The first time any table is read, every table gets its starting data at once,
// so views, likes and IDPs all share the same dates.
function seedAllTables() {
  for (const [table, rows] of Object.entries(seed())) {
    const key = KEY_PREFIX + table;
    if (window.localStorage.getItem(key) === null) window.localStorage.setItem(key, JSON.stringify(rows));
  }
}

export function readTable(table) {
  if (typeof window === "undefined") return [];
  const key = KEY_PREFIX + table;
  try {
    const raw = window.localStorage.getItem(key);
    if (raw) return JSON.parse(raw);
    seedAllTables();
    return JSON.parse(window.localStorage.getItem(key) ?? "[]");
  } catch {
    // storage blocked or corrupted: fall back to the seed data
  }
  return seed()[table] ?? [];
}

export function writeTable(table, rows) {
  window.localStorage.setItem(KEY_PREFIX + table, JSON.stringify(rows));
}
