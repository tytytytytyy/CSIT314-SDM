// Entity support: LocalStore
// Stand-in for the database while the team has none. Each "table" is a JSON array in
// the browser's localStorage, filled with dummy data the first time it is read.
// Replace readTable / writeTable with real queries later; the entity methods stay the same.
//
// Database tables: idp, idp_photo, idp_like, idp_view, idp_sequence (next-ID counter for idp),
//                  user_account, designer_verification, company_information
//
// The hand-made rows below are the special cases the unit tests and demo rely on. The large set
// of generated dummy data (entity/DummyData.js) is added to them the first time the app runs.
//
// Bump KEY_PREFIX when the seed data or the row shapes change, so old browser data is ignored.

import { generateDummyData, placeholderPhoto, placeholderLogo } from "./DummyData";

const KEY_PREFIX = "idp_platform_v6_";

const HAND_MADE = {
  // Login accounts. Passwords are left out until the Login feature exists.
  // D1-D3 are verified designers. D4 is still waiting for verification and D5 was suspended,
  // so Browse Interior Designers must hide both.
  user_account: [
    {
      accountID: "C1",
      email: "customer1@example.com",
      profileID: "customer",
      status: "active",
      createdAt: "2026-01-15T08:00:00.000Z",
    },
    {
      accountID: "D1",
      email: "hello@nordicnest.example.com",
      profileID: "designer",
      status: "active",
      createdAt: "2026-03-01T08:00:00.000Z",
    },
    {
      accountID: "D2",
      email: "studio@linea.example.com",
      profileID: "designer",
      status: "active",
      createdAt: "2026-05-10T08:00:00.000Z",
    },
    {
      accountID: "D3",
      email: "team@habitatco.example.com",
      profileID: "designer",
      status: "active",
      createdAt: "2026-08-20T08:00:00.000Z",
    },
    {
      accountID: "D4",
      email: "hi@freshstart.example.com",
      profileID: "designer",
      status: "pending",
      createdAt: "2026-10-28T08:00:00.000Z",
    },
    {
      accountID: "D5",
      email: "info@urbanedge.example.com",
      profileID: "designer",
      status: "suspended",
      createdAt: "2026-02-11T08:00:00.000Z",
    },
  ],
  designer_verification: [
    {
      verificationID: "V1",
      designerID: "D1",
      status: "approved",
      submittedAt: "2026-03-01T09:00:00.000Z",
      reviewedBy: "A1",
      reviewedAt: "2026-03-03T09:00:00.000Z",
      rejectReason: null,
    },
    {
      verificationID: "V2",
      designerID: "D2",
      status: "approved",
      submittedAt: "2026-05-10T09:00:00.000Z",
      reviewedBy: "A1",
      reviewedAt: "2026-05-12T09:00:00.000Z",
      rejectReason: null,
    },
    {
      verificationID: "V3",
      designerID: "D3",
      status: "approved",
      submittedAt: "2026-08-20T09:00:00.000Z",
      reviewedBy: "A1",
      reviewedAt: "2026-08-22T09:00:00.000Z",
      rejectReason: null,
    },
    {
      verificationID: "V4",
      designerID: "D4",
      status: "pending",
      submittedAt: "2026-10-28T09:00:00.000Z",
      reviewedBy: null,
      reviewedAt: null,
      rejectReason: null,
    },
    {
      verificationID: "V5",
      designerID: "D5",
      status: "approved",
      submittedAt: "2026-02-11T09:00:00.000Z",
      reviewedBy: "A1",
      reviewedAt: "2026-02-13T09:00:00.000Z",
      rejectReason: null,
    },
  ],
  company_information: [
    {
      companyID: "CO1",
      designerID: "D1",
      companyName: "Nordic Nest Interiors",
      registrationNumber: "202601234A",
      description:
        "Warm, light-filled homes with Scandinavian and industrial touches.",
      location: "Tampines",
      phone: "+65 6123 4501",
      website: "https://nordicnest.example.com",
      logoURL: placeholderLogo("NN", "#5b7f95"),
    },
    {
      companyID: "CO2",
      designerID: "D2",
      companyName: "Studio Linea",
      registrationNumber: "202605678B",
      description: "Minimalist offices and retail spaces that work hard.",
      location: "Raffles Place",
      phone: "+65 6123 4502",
      website: "https://linea.example.com",
      logoURL: placeholderLogo("SL", "#4a4a4a"),
    },
    {
      companyID: "CO3",
      designerID: "D3",
      companyName: "Habitat & Co",
      registrationNumber: "202608765C",
      description: "Tropical and Japandi homes for young families.",
      location: "Jurong East",
      phone: "+65 6123 4503",
      website: "https://habitatco.example.com",
      logoURL: placeholderLogo("H&", "#6f8f5e"),
    },
    {
      companyID: "CO4",
      designerID: "D4",
      companyName: "Fresh Start Design",
      registrationNumber: "202610001D",
      description: "New studio specialising in HDB makeovers.",
      location: "Woodlands",
      phone: "+65 6123 4504",
      website: "https://freshstart.example.com",
      logoURL: placeholderLogo("FS", "#c08a3e"),
    },
    {
      companyID: "CO5",
      designerID: "D5",
      companyName: "Urban Edge Interiors",
      registrationNumber: "202602222E",
      description: "Bold industrial lofts and bars.",
      location: "Tampines",
      phone: "+65 6123 4505",
      website: "https://urbanedge.example.com",
      logoURL: placeholderLogo("UE", "#8b3a3a"),
    },
  ],
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
  // Customers C2 and C3 like IDP 3, so D2 has the most likes while D1 has the most IDPs.
  idp_like: [
    {
      likeID: "L3",
      customerID: "C2",
      idpID: 3,
      likedAt: "2026-10-06T09:00:00.000Z",
    },
    {
      likeID: "L4",
      customerID: "C3",
      idpID: 3,
      likedAt: "2026-10-07T09:00:00.000Z",
    },
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
  const { lastIDPID, ...extraTables } = generateDummyData();
  seedCache = {};
  for (const table of new Set([...Object.keys(HAND_MADE), ...Object.keys(extraTables)])) {
    seedCache[table] = [...(HAND_MADE[table] ?? []), ...(extraTables[table] ?? [])];
  }
  seedCache.idp_sequence = [{ lastIDPID: Math.max(HAND_MADE.idp_sequence[0].lastIDPID, lastIDPID ?? 0) }];
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
