const DESIGNERS = 100;
const IDPS_PER_DESIGNER = 10;
const CUSTOMERS = 100;
const DAYS_OF_ACTIVITY = 90;
const FIRST_NEW_IDP_ID = 5; // 1 to 3 are hand-made, 4 was deleted
const HAND_MADE_DESIGNERS = 5; // D1 to D5 already have accounts and company info in LocalStore
const UNVERIFIED_DESIGNERS = ["D4"]; // waiting for verification, so cannot have IDPs yet

// The hand-made designers' specialties, matching their company descriptions in LocalStore.
const HAND_MADE_SPECIALTIES = {
  D1: ["Scandinavian", "Industrial"], // "Warm, light-filled homes with Scandinavian and industrial touches."
  D2: ["Minimalist"], // "Minimalist offices and retail spaces that work hard."
  D3: ["Tropical", "Japandi"], // "Tropical and Japandi homes for young families."
  D5: ["Industrial"], // "Bold industrial lofts and bars."
};
const COMMERCIAL_ONLY = ["D2"]; // D2 only does offices and retail spaces

// Dates of the hand-made rows in LocalStore that generated rows must come after.
// (tests/entity/DummyData.test.js checks the generated data against LocalStore itself.)
const HAND_MADE_DATES = {
  verifiedAt: { D1: "2026-03-03T09:00:00.000Z", D2: "2026-05-12T09:00:00.000Z", D3: "2026-08-22T09:00:00.000Z", D5: "2026-02-13T09:00:00.000Z" },
  customerJoinedAt: { C1: "2026-01-15T08:00:00.000Z", C2: "2026-02-03T08:00:00.000Z", C3: "2026-04-22T08:00:00.000Z" },
  idpCreatedAt: { 1: "2026-03-05T08:00:00.000Z", 2: "2026-03-05T08:00:00.000Z", 3: "2026-05-14T08:00:00.000Z" },
};

const COMPANY_WORDS = {
  first: ["Nordic", "Urban", "Haven", "Oak", "Lumen", "Terra", "Atelier", "Canvas", "Maple", "Willow", "Slate", "Ember", "Harbour", "Cove", "Linen", "Stone"],
  second: ["Interiors", "Design Studio", "Living", "Spaces", "& Co", "Design House", "Home Studio", "Concepts"],
};
const LOCATIONS = ["Tampines", "Jurong East", "Woodlands", "Bishan", "Toa Payoh", "Punggol", "Raffles Place", "Bukit Timah", "Ang Mo Kio", "Pasir Ris", "Clementi", "Serangoon", "Novena", "Bedok", "Yishun"];

const STYLES = {
  Scandinavian: "#8aa5b8", Industrial: "#6b5b52", Minimalist: "#9a9a9a", "Modern Luxury": "#7a6a4f",
  Japandi: "#a08c6d", Contemporary: "#5f7a8a", Tropical: "#4f8a5b", "Mid-Century Modern": "#b0703c", Peranakan: "#3f7f86",
};
const PROPERTY = {
  Residential: { types: ["HDB", "Condo", "Landed"], rooms: ["Living Room", "Kitchen", "Master Bedroom", "Study", "Bathroom", "Balcony", "Whole Unit"], budget: [8000, 120000] },
  Commercial: { types: ["Office", "Retail", "F&B"], rooms: ["Reception", "Meeting Room", "Open Office", "Shopfront", "Dining Area", "Bar Counter"], budget: [30000, 300000] },
};
const HOME_SIZES = { HDB: ["3-Room", "4-Room", "5-Room", "Executive"], Condo: ["1-Bedroom", "2-Bedroom", "3-Bedroom", "Penthouse"], Landed: ["Terrace", "Semi-D", "Bungalow"], Office: ["20-Seat", "50-Seat", "Startup"], Retail: ["Boutique", "Mall Unit"], "F&B": ["Cafe", "Bistro", "Hawker Stall"] };

// A small repeatable random number generator (mulberry32), so everyone gets the same data.
function makeRandom(seed) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Makes text safe to put inside an SVG image (e.g. "&" would otherwise break it).
function escapeXML(text) {
  return String(text).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/'/g, "&apos;");
}

export function placeholderPhoto(label, colour) {
  const svg =
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 160 100'>` +
    `<rect width='160' height='100' fill='${colour}'/>` +
    `<text x='80' y='54' font-size='11' text-anchor='middle' fill='white' font-family='Arial'>${escapeXML(label)}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export function placeholderLogo(initials, colour) {
  const svg =
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'>` +
    `<rect width='100' height='100' rx='16' fill='${colour}'/>` +
    `<text x='50' y='61' font-size='34' text-anchor='middle' fill='white' font-family='Arial' font-weight='bold'>${escapeXML(initials)}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

// File names match the team's photo download guide exactly: lowercase, hyphenated, "<style>-<room>.jpg"
// for residential, "commercial-<room>-<1 or 2>.jpg" for commercial. Real files live in public/demo-photos/;
// Next.js serves that folder at the site root, so this path alone is enough to show one once it's added.
const STYLE_SLUG = {
  Scandinavian: "scandinavian",
  Industrial: "industrial",
  Minimalist: "minimalist",
  "Modern Luxury": "modern-luxury",
  Japandi: "japandi",
  Contemporary: "contemporary",
  Tropical: "tropical",
  "Mid-Century Modern": "mid-century-modern",
  Peranakan: "peranakan",
};
const RESIDENTIAL_ROOM_SLUGS = ["living-room", "kitchen", "bedroom", "bathroom", "study"];
const RESIDENTIAL_ROOM_SLUG = {
  "Living Room": "living-room",
  Kitchen: "kitchen",
  "Master Bedroom": "bedroom",
  Study: "study",
  Bathroom: "bathroom",
  Balcony: "living-room", // no dedicated photo in the guide; closest match
  "Whole Unit": "living-room",
};
const COMMERCIAL_ROOM_SLUG = {
  Reception: "reception",
  "Meeting Room": "meeting-room",
  "Open Office": "office",
  Shopfront: "retail",
  "Dining Area": "cafe",
  "Bar Counter": "cafe",
};

export function demoPhotoURL(category, style, room, variant = 1) {
  if (category === "Commercial") {
    const slug = COMMERCIAL_ROOM_SLUG[room] ?? "office";
    return `/demo-photos/commercial-${slug}-${variant === 2 ? 2 : 1}.jpg`;
  }
  const primarySlug = RESIDENTIAL_ROOM_SLUG[room] ?? "living-room";
  const roomSlug =
    variant === 2
      ? RESIDENTIAL_ROOM_SLUGS[(RESIDENTIAL_ROOM_SLUGS.indexOf(primarySlug) + 1) % RESIDENTIAL_ROOM_SLUGS.length]
      : primarySlug;
  return `/demo-photos/${STYLE_SLUG[style]}-${roomSlug}.jpg`;
}

// Moves dates that are too early (e.g. an IDP created before its designer was verified) later.
// Uses no random numbers, so every other value in the data stays exactly the same.
// Each date keeps its relative place in its window, just squeezed to start at the earliest allowed time.
function putDatesInOrder({ end, idp, idp_photo, idp_view, idp_like, user_account, designer_verification }) {
  const DAY = 86_400_000;
  const endMs = end.getTime();
  const ms = (iso) => new Date(iso).getTime();
  // t was picked between windowStart and the end; move it to the same place between earliest and the end.
  const squeeze = (iso, windowStart, earliest) => {
    if (earliest <= windowStart) return iso;
    const share = Math.max(0, Math.min(1, (ms(iso) - windowStart) / (endMs - windowStart)));
    return new Date(earliest + share * (endMs - earliest)).toISOString();
  };

  const verifiedAt = { ...HAND_MADE_DATES.verifiedAt };
  for (const v of designer_verification) verifiedAt[v.designerID] = v.reviewedAt;
  const joinedAt = {};
  for (const a of user_account) joinedAt[a.accountID] = a.createdAt;
  Object.assign(joinedAt, HAND_MADE_DATES.customerJoinedAt); // the hand-made C1 to C3 replace the generated ones

  // IDPs: picked in the last 365 days, but not before the designer was verified.
  const createdAt = { ...HAND_MADE_DATES.idpCreatedAt };
  for (const row of idp) {
    row.createdAt = squeeze(row.createdAt, endMs - 365 * DAY, ms(verifiedAt[row.designerID]));
    createdAt[row.idpID] = row.createdAt;
  }
  // Photos are uploaded when the IDP is created, one minute apart.
  for (const photo of idp_photo) {
    photo.uploadedAt = new Date(Math.min(ms(createdAt[photo.idpID]) + photo.sortOrder * 60_000, endMs)).toISOString();
  }
  // Views and likes: picked in the last 90 days, but not before the IDP or the customer's account existed.
  const activityStart = endMs - DAYS_OF_ACTIVITY * DAY;
  const earliest = (idpID, customerID) =>
    Math.max(activityStart, ms(createdAt[idpID]), customerID ? ms(joinedAt[customerID]) : 0);
  for (const v of idp_view) v.viewedAt = squeeze(v.viewedAt, activityStart, earliest(v.idpID, v.customerID));
  for (const l of idp_like) l.likedAt = squeeze(l.likedAt, activityStart, earliest(l.idpID, l.customerID));
}

export function generateDummyData(today = new Date()) {
  const random = makeRandom(314);
  const pick = (list) => list[Math.floor(random() * list.length)];
  const between = (min, max) => min + Math.floor(random() * (max - min + 1));
  const end = new Date(today);
  const randomTimeInLast = (days) => new Date(end.getTime() - random() * days * 86_400_000).toISOString();

  // Each designer's 1 to 3 specialty styles, chosen once and reused for their IDPs and company description.
  const specialtiesByDesigner = {};
  const specialtiesOf = (designerID) => {
    if (!specialtiesByDesigner[designerID]) {
      const shuffled = [...Object.keys(STYLES)].sort(() => random() - 0.5);
      specialtiesByDesigner[designerID] = HAND_MADE_SPECIALTIES[designerID] ?? shuffled.slice(0, between(1, 3));
    }
    return specialtiesByDesigner[designerID];
  };

  // Hand-made IDPs already owned by D1 and D2 (see LocalStore): they count towards the 10 each.
  const handMade = { D1: { completed: 1, ongoing: 1 }, D2: { completed: 1, ongoing: 0 } };

  const idp = [];
  const idp_photo = [];
  let nextIDP = FIRST_NEW_IDP_ID;
  let nextPhoto = 5; // P1 to P4 are hand-made

  for (let d = 1; d <= DESIGNERS; d++) {
    const designerID = `D${d}`;
    if (UNVERIFIED_DESIGNERS.includes(designerID)) continue;
    const already = handMade[designerID] ?? { completed: 0, ongoing: 0 };
    const specialties = specialtiesOf(designerID);
    const toMake = IDPS_PER_DESIGNER - already.completed - already.ongoing;
    // Exactly one In Progress IDP per designer.
    const ongoingSlot = already.ongoing > 0 ? -1 : Math.floor(random() * toMake);

    for (let i = 0; i < toMake; i++) {
      const category = COMMERCIAL_ONLY.includes(designerID) ? "Commercial" : random() < 0.8 ? "Residential" : "Commercial";
      const { types, rooms, budget } = PROPERTY[category];
      const propertyType = pick(types);
      const style = pick(specialties);
      const room = pick(rooms);
      const size = pick(HOME_SIZES[propertyType]);
      const idpID = nextIDP++;
      idp.push({
        idpID,
        designerID,
        createdAt: randomTimeInLast(365),
        title: `${style} ${room} - ${size} ${propertyType}`,
        description: `A ${style.toLowerCase()} design for the ${room.toLowerCase()} of a ${size.toLowerCase()} ${propertyType}.`,
        style,
        propertyType,
        category,
        budget: Math.round(between(budget[0], budget[1]) / 500) * 500,
        status: i === ongoingSlot ? "ongoing" : "completed",
      });
      const photoCount = between(1, 2);
      for (let p = 1; p <= photoCount; p++) {
        idp_photo.push({
          photoID: `P${nextPhoto++}`,
          idpID,
          photoURL: demoPhotoURL(category, style, room, p),
          caption: p === 1 ? room : `${room} detail`,
          sortOrder: p,
          uploadedAt: randomTimeInLast(180),
        });
      }
    }
  }

  // Views and likes. Most IDPs get a few views; the demo designer D1's get more.
  const allIDPs = [
    { idpID: 1, designerID: "D1" },
    { idpID: 2, designerID: "D1" },
    { idpID: 3, designerID: "D2" },
    ...idp,
  ];
  const idp_view = [];
  const idp_like = [];
  const liked = new Set(["C1-4", "C1-2", "C2-3", "C3-3"]); // the hand-made likes L1 to L4
  let nextView = 1;
  let nextLike = 5; // L1 to L4 are hand-made

  for (const { idpID, designerID } of allIDPs) {
    const isDemoDesigner = designerID === "D1";
    const viewCount = isDemoDesigner ? between(40, 140) : Math.floor(random() ** 3 * 16);
    const likeChance = isDemoDesigner ? 0.18 : 0.12;
    for (let v = 0; v < viewCount; v++) {
      const viewedAt = randomTimeInLast(DAYS_OF_ACTIVITY);
      const customerID = random() < 0.25 ? null : `C${between(1, CUSTOMERS)}`;
      idp_view.push({ viewID: `V${nextView++}`, idpID, customerID, viewedAt });

      // Some logged-in viewers like the IDP (once per customer per IDP), a few minutes later.
      const key = `${customerID}-${idpID}`;
      if (customerID && !liked.has(key) && random() < likeChance) {
        liked.add(key);
        const likedAt = new Date(Math.min(new Date(viewedAt).getTime() + between(1, 30) * 60_000, end.getTime())).toISOString();
        idp_like.push({ likeID: `L${nextLike++}`, customerID, idpID, likedAt });
      }
    }
  }

  // Accounts, verification and company info for the generated designers (D6 to D100),
  // and accounts for the generated customers (C2 to C100). All active and verified.
  const user_account = [];
  const designer_verification = [];
  const company_information = [];
  const styleColours = Object.values(STYLES);
  for (let d = HAND_MADE_DESIGNERS + 1; d <= DESIGNERS; d++) {
    const designerID = `D${d}`;
    const createdAt = randomTimeInLast(365);
    const name = `${pick(COMPANY_WORDS.first)} ${pick(COMPANY_WORDS.second)}`;
    const companyName = `${name} ${d}`; // the number keeps every name unique
    const slug = name.toLowerCase().replace(/[^a-z]+/g, "");
    const reviewedAt = new Date(new Date(createdAt).getTime() + between(1, 5) * 86_400_000).toISOString();
    user_account.push({ accountID: designerID, email: `hello@${slug}${d}.example.com`, profileID: "designer", status: "active", createdAt });
    designer_verification.push({
      verificationID: `V${d}`, designerID, status: "approved", submittedAt: createdAt,
      reviewedBy: "A1", reviewedAt: reviewedAt > end.toISOString() ? end.toISOString() : reviewedAt, rejectReason: null,
    });
    const myStyles = specialtiesOf(designerID);
    const styleText = myStyles.length === 1 ? myStyles[0] : `${myStyles.slice(0, -1).join(", ")} and ${myStyles.at(-1)}`;
    company_information.push({
      companyID: `CO${d}`,
      designerID,
      companyName,
      registrationNumber: `20${between(10, 26)}${String(between(0, 99999)).padStart(5, "0")}${"ABCDEFGHJKLMNPQRSTUVWXYZ"[between(0, 23)]}`,
      description: `${styleText} interiors for homes and businesses.`,
      location: pick(LOCATIONS),
      phone: `+65 6${between(100, 999)} ${between(1000, 9999)}`,
      website: `https://${slug}${d}.example.com`,
      logoURL: placeholderLogo(name.split(" ").filter((w) => /^[A-Za-z]/.test(w)).map((w) => w[0]).join("").slice(0, 2).toUpperCase(), pick(styleColours)),
    });
  }
  for (let c = 2; c <= CUSTOMERS; c++) {
    user_account.push({ accountID: `C${c}`, email: `customer${c}@example.com`, profileID: "customer", status: "active", createdAt: randomTimeInLast(365) });
  }

  putDatesInOrder({ end, idp, idp_photo, idp_view, idp_like, user_account, designer_verification });

  // Simulated ACRA register: every generated company is registered (live) under its own name,
  // a month before its account was created. No random numbers, so the rest of the data is unchanged.
  const acra_registry = company_information.map((company) => {
    const account = user_account.find((a) => a.accountID === company.designerID);
    return {
      uen: company.registrationNumber,
      entityName: `${company.companyName.toUpperCase()} PTE. LTD.`,
      status: "live",
      registeredAt: new Date(new Date(account.createdAt).getTime() - 30 * 86_400_000).toISOString().slice(0, 10),
    };
  });

  // Sample promotions by the platform manager (M12345), relative to today: 3 running now (so the
  // home feed shows Featured IDPs straight away), 1 finished and 1 upcoming. No random numbers.
  const dayKey = (days) => {
    const d = new Date(end.getTime() + days * 86_400_000);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  };
  const firstIDPOf = (designerID) => idp.find((i) => i.designerID === designerID).idpID;
  const promotion = [
    [1, -3, 27], // D1's "Bright Scandinavian Living Room"
    [3, -10, 20], // D2's office
    [firstIDPOf("D3"), -1, 13],
    [firstIDPOf("D5"), -40, -20], // finished
    [firstIDPOf("D6"), 7, 21], // upcoming
  ].map(([idpID, from, to], i) => ({
    promotionID: i + 1, idpID, startDate: dayKey(from), endDate: dayKey(to), createdBy: "M12345",
  }));

  return {
    idp, idp_photo, idp_view, idp_like, promotion,
    user_account, designer_verification, company_information, acra_registry,
    lastIDPID: nextIDP - 1,
  };
}
