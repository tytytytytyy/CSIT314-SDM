// Entity support: DummyData
// Generates the large set of test data the project spec asks for ("e.g. 100 records to each
// datatype"), so the live demo looks like a real platform. LocalStore adds these rows to its
// small hand-made data the first time the app runs in a browser.
//
// What it makes (same every time, because it uses a fixed random seed):
// - 100 interior designers (D1 to D100) with 10 IDPs each = 1,000 IDPs.
//   9 of each designer's 10 IDPs are Completed and 1 is In Progress (90% completed).
//   D1's and D2's hand-made IDPs (1, 2 and 3) count towards their 10.
// - 1 or 2 placeholder photos per IDP.
// - 100 customers (C1 to C100) viewing and liking IDPs over the last 90 days.
//   The demo designer D1's IDPs get more activity, so the Performance Dashboard has something to show.
//
// Dates are counted back from the day the data is first created, so the last 90 days always have data.
//
// Methods:
// - generateDummyData(today)       extra rows per table, plus lastIDPID for the ID counter
// - placeholderPhoto(label, colour)   a small coloured image with a label, as a data URL

const DESIGNERS = 100;
const IDPS_PER_DESIGNER = 10;
const CUSTOMERS = 100;
const DAYS_OF_ACTIVITY = 90;
const FIRST_NEW_IDP_ID = 5; // 1 to 3 are hand-made, 4 was deleted

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

export function placeholderPhoto(label, colour) {
  const svg =
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 160 100'>` +
    `<rect width='160' height='100' fill='${colour}'/>` +
    `<text x='80' y='54' font-size='11' text-anchor='middle' fill='white' font-family='Arial'>${label}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export function generateDummyData(today = new Date()) {
  const random = makeRandom(314);
  const pick = (list) => list[Math.floor(random() * list.length)];
  const between = (min, max) => min + Math.floor(random() * (max - min + 1));
  const end = new Date(today);
  const randomTimeInLast = (days) => new Date(end.getTime() - random() * days * 86_400_000).toISOString();

  // Hand-made IDPs already owned by D1 and D2 (see LocalStore): they count towards the 10 each.
  const handMade = { D1: { completed: 1, ongoing: 1 }, D2: { completed: 1, ongoing: 0 } };

  const idp = [];
  const idp_photo = [];
  let nextIDP = FIRST_NEW_IDP_ID;
  let nextPhoto = 5; // P1 to P4 are hand-made

  for (let d = 1; d <= DESIGNERS; d++) {
    const designerID = `D${d}`;
    const already = handMade[designerID] ?? { completed: 0, ongoing: 0 };
    const toMake = IDPS_PER_DESIGNER - already.completed - already.ongoing;
    // Exactly one In Progress IDP per designer.
    const ongoingSlot = already.ongoing > 0 ? -1 : Math.floor(random() * toMake);

    for (let i = 0; i < toMake; i++) {
      const category = random() < 0.8 ? "Residential" : "Commercial";
      const { types, rooms, budget } = PROPERTY[category];
      const propertyType = pick(types);
      const style = pick(Object.keys(STYLES));
      const room = pick(rooms);
      const size = pick(HOME_SIZES[propertyType]);
      const idpID = nextIDP++;
      idp.push({
        idpID,
        designerID,
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
          photoURL: placeholderPhoto(p === 1 ? style : `${style} ${p}`, STYLES[style]),
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
  const liked = new Set(["C1-4", "C1-2"]); // the hand-made likes L1 and L2
  let nextView = 1;
  let nextLike = 3; // L1 and L2 are hand-made

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

  return { idp, idp_photo, idp_view, idp_like, lastIDPID: nextIDP - 1 };
}
