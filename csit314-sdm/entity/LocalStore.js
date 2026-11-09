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

import { generateDummyData, placeholderLogo, demoPhotoURL } from "./DummyData";

const KEY_PREFIX = "idp_platform_v12_";

// Password of every demo login account below (TEST data: a real system stores a hash, never
// the password itself). Generated accounts (C4+, D6+) have no password, so they cannot log in.
const DEMO_PASSWORD = "password123";

const HAND_MADE = {
  // Login accounts. C1-C3, D1-D3, A1 and M12345 are the demo logins listed on the login page.
  // D1-D3 are verified designers. D4 is still waiting for verification and D5 was suspended,
  // so Browse Interior Designers must hide both, and Log in must turn both away.
  user_account: [
    {
      accountID: "M12345",
      email: "manager@example.com",
      password: DEMO_PASSWORD,
      profileID: "platformManager",
      status: "active",
      createdAt: "2026-01-01T00:00:00.000Z",
    },
    { 
      accountID: "A1", 
      email: "admin@example.com", 
      password: DEMO_PASSWORD, 
      profileID: "admin", 
      status: "active", 
      createdAt: "2026-01-01T00:00:00.000Z" 
    },
    {
      accountID: "C1",
      email: "customer1@example.com",
      password: DEMO_PASSWORD,
      profileID: "customer",
      status: "active",
      createdAt: "2026-01-15T08:00:00.000Z",
    },
    {
      accountID: "C2",
      email: "customer2@example.com",
      password: DEMO_PASSWORD,
      profileID: "customer",
      status: "active",
      createdAt: "2026-02-03T08:00:00.000Z",
    },
    {
      accountID: "C3",
      email: "customer3@example.com",
      password: DEMO_PASSWORD,
      profileID: "customer",
      status: "active",
      createdAt: "2026-04-22T08:00:00.000Z",
    },
    {
      accountID: "D1",
      email: "hello@nordicnest.example.com",
      password: DEMO_PASSWORD,
      profileID: "designer",
      status: "active",
      createdAt: "2026-03-01T08:00:00.000Z",
    },
    {
      accountID: "D2",
      email: "studio@linea.example.com",
      password: DEMO_PASSWORD,
      profileID: "designer",
      status: "active",
      createdAt: "2026-05-10T08:00:00.000Z",
    },
    {
      accountID: "D3",
      email: "team@habitatco.example.com",
      password: DEMO_PASSWORD,
      profileID: "designer",
      status: "active",
      createdAt: "2026-08-20T08:00:00.000Z",
    },
    {
      accountID: "D4",
      email: "hi@freshstart.example.com",
      password: DEMO_PASSWORD,
      profileID: "designer",
      status: "pending",
      createdAt: "2026-10-28T08:00:00.000Z",
    },
    {
      accountID: "D5",
      email: "info@urbanedge.example.com",
      password: DEMO_PASSWORD,
      profileID: "designer",
      status: "suspended",
      createdAt: "2026-02-11T08:00:00.000Z",
    },
    // D101-D103 also signed up recently. Each one fails the ACRA check in a different way
    // (see acra_registry below), so the User Admin has something to review by hand.
    {
      accountID: "D101",
      email: "hello@coastlineliving.example.com",
      password: DEMO_PASSWORD,
      profileID: "designer",
      status: "pending",
      createdAt: "2026-11-02T08:00:00.000Z",
    },
    {
      accountID: "D102",
      email: "studio@brightwall.example.com",
      password: DEMO_PASSWORD,
      profileID: "designer",
      status: "pending",
      createdAt: "2026-11-04T08:00:00.000Z",
    },
    {
      accountID: "D103",
      email: "info@oakline.example.com",
      password: DEMO_PASSWORD,
      profileID: "designer",
      status: "pending",
      createdAt: "2026-11-06T08:00:00.000Z",
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
    {
      verificationID: "V101",
      designerID: "D101",
      status: "pending",
      submittedAt: "2026-11-02T09:00:00.000Z",
      reviewedBy: null,
      reviewedAt: null,
      rejectReason: null,
    },
    {
      verificationID: "V102",
      designerID: "D102",
      status: "pending",
      submittedAt: "2026-11-04T09:00:00.000Z",
      reviewedBy: null,
      reviewedAt: null,
      rejectReason: null,
    },
    {
      verificationID: "V103",
      designerID: "D103",
      status: "pending",
      submittedAt: "2026-11-06T09:00:00.000Z",
      reviewedBy: null,
      reviewedAt: null,
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
    {
      companyID: "CO101",
      designerID: "D101",
      companyName: "Coastline Living",
      registrationNumber: "202610102F",
      description: "Breezy coastal homes with natural textures.",
      location: "Pasir Ris",
      phone: "+65 6123 4601",
      website: "https://coastlineliving.example.com",
      logoURL: placeholderLogo("CL", "#3e7c8f"),
    },
    {
      companyID: "CO102",
      designerID: "D102",
      companyName: "Brightwall Studio",
      registrationNumber: "202610203G",
      description: "Colourful feature walls and kids' rooms.",
      location: "Punggol",
      phone: "+65 6123 4602",
      website: "https://brightwall.example.com",
      logoURL: placeholderLogo("BS", "#b5654a"),
    },
    {
      companyID: "CO103",
      designerID: "D103",
      companyName: "Oakline Interiors",
      registrationNumber: "201912345H",
      description: "Solid timber kitchens and wardrobes.",
      location: "Bukit Timah",
      phone: "+65 6123 4603",
      website: "https://oakline.example.com",
      logoURL: placeholderLogo("OI", "#7a5a3a"),
    },
  ],
  // SIMULATED copy of ACRA's business register (shaped like ACRA's open data on data.gov.sg).
  // Not real ACRA data. Looked up by UEN in the Verify ID Accounts ACRA check.
  // D102's UEN (202610203G) is left out on purpose: "UEN not found".
  acra_registry: [
    { uen: "202601234A", entityName: "NORDIC NEST INTERIORS PTE. LTD.", status: "live", registeredAt: "2026-01-20" },
    { uen: "202605678B", entityName: "STUDIO LINEA PTE. LTD.", status: "live", registeredAt: "2026-04-28" },
    { uen: "202608765C", entityName: "HABITAT & CO. PTE. LTD.", status: "live", registeredAt: "2026-08-03" },
    { uen: "202610001D", entityName: "FRESH START DESIGN PTE. LTD.", status: "live", registeredAt: "2026-10-12" },
    { uen: "202602222E", entityName: "URBAN EDGE INTERIORS PTE. LTD.", status: "live", registeredAt: "2026-01-29" },
    // Same UEN as Coastline Living, but registered under another name: "name mismatch".
    { uen: "202610102F", entityName: "SEASIDE HOMES PTE. LTD.", status: "live", registeredAt: "2026-10-15" },
    // Oakline Interiors exists but has been struck off the register.
    { uen: "201912345H", entityName: "OAKLINE INTERIORS PTE. LTD.", status: "struck off", registeredAt: "2019-06-10" },
  ],
  // IDP 4 is not in this table: the designer deleted it (a hard delete), but customer C1's
  // like of it is still in idp_like, so the favourites list has to leave it out.
  idp: [
    {
      idpID: 1,
      designerID: "D1",
      createdAt: "2026-03-05T08:00:00.000Z",
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
      createdAt: "2026-03-05T08:00:00.000Z",
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
      createdAt: "2026-05-14T08:00:00.000Z",
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
      photoURL: demoPhotoURL("Residential", "Scandinavian", "Living Room"),
      caption: "Living room",
      sortOrder: 1,
      uploadedAt: "2026-09-01T10:00:00.000Z",
    },
    {
      photoID: "P2",
      idpID: 1,
      photoURL: demoPhotoURL("Residential", "Scandinavian", "Study"),
      caption: "Reading corner",
      sortOrder: 2,
      uploadedAt: "2026-09-01T10:00:00.000Z",
    },
    {
      photoID: "P3",
      idpID: 2,
      photoURL: demoPhotoURL("Residential", "Industrial", "Living Room"),
      caption: "Loft",
      sortOrder: 1,
      uploadedAt: "2026-09-01T10:00:00.000Z",
    },
    {
      photoID: "P4",
      idpID: 3,
      photoURL: demoPhotoURL("Commercial", "Minimalist", "Open Office"),
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
  // DummyData also generates C2 and C3; the hand-made demo logins above replace those rows.
  const handMadeIDs = new Set(HAND_MADE.user_account.map((a) => a.accountID));
  seedCache.user_account = seedCache.user_account.filter(
    (a, i) => i < HAND_MADE.user_account.length || !handMadeIDs.has(a.accountID),
  );
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

function addLegacyIDPCreationDates(rows) {
  const knownSeedDates = {
    1: "2026-03-05T08:00:00.000Z",
    2: "2026-03-05T08:00:00.000Z",
    3: "2026-05-14T08:00:00.000Z",
  };
  const storedPhotos = window.localStorage.getItem(KEY_PREFIX + "idp_photo");
  const photos = storedPhotos ? JSON.parse(storedPhotos) : seed().idp_photo ?? [];
  const firstUploadByIDP = new Map();
  for (const photo of photos) {
    if (!photo.uploadedAt) continue;
    const firstUpload = firstUploadByIDP.get(photo.idpID);
    if (!firstUpload || photo.uploadedAt < firstUpload) {
      firstUploadByIDP.set(photo.idpID, photo.uploadedAt);
    }
  }

  return rows.map((row) => {
    if (row.createdAt) return row;
    const createdAt =
      knownSeedDates[row.idpID] ?? firstUploadByIDP.get(row.idpID);
    return createdAt ? { ...row, createdAt } : row;
  });
}

export function readTable(table) {
  if (typeof window === "undefined") return [];
  const key = KEY_PREFIX + table;
  try {
    const raw = window.localStorage.getItem(key);
    if (raw) {
      const rows = JSON.parse(raw);
      return table === "idp" ? addLegacyIDPCreationDates(rows) : rows;
    }
    seedAllTables();
    const rows = JSON.parse(window.localStorage.getItem(key) ?? "[]");
    return table === "idp" ? addLegacyIDPCreationDates(rows) : rows;
  } catch {
    // storage blocked or corrupted: fall back to the seed data
  }
  return seed()[table] ?? [];
}

export function writeTable(table, rows) {
  window.localStorage.setItem(KEY_PREFIX + table, JSON.stringify(rows));
}

// Save the account and its verification together; restore written rows if saving fails.
// Existing readTable / writeTable behavior is unchanged for other features.
export function writeTables(tables) {
  const updates = Object.entries(tables).map(([table, rows]) => ({
    key: KEY_PREFIX + table,
    value: JSON.stringify(rows),
    previous: window.localStorage.getItem(KEY_PREFIX + table),
  }));
  const written = [];
  try {
    for (const update of updates) {
      window.localStorage.setItem(update.key, update.value);
      written.push(update);
    }
  } catch (error) {
    for (const update of written.reverse()) {
      if (update.previous === null) window.localStorage.removeItem(update.key);
      else window.localStorage.setItem(update.key, update.previous);
    }
    throw error;
  }
}
