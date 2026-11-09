// Unit tests for the generated dummy data (entity/DummyData.js).
// tests/setup.js switches the generator off for the other tests, so this file loads the real one.

import { describe, it, expect, vi } from "vitest";

const { generateDummyData } = await vi.importActual("@/entity/DummyData");

const TODAY = new Date("2026-11-05T12:00:00.000Z");
const data = generateDummyData(TODAY);
// The hand-made IDPs in LocalStore: D1 owns 1 (completed, Scandinavian) and 2 (in progress, Industrial),
// D2 owns 3 (completed, Minimalist office).
const allIDPs = [
  { idpID: 1, designerID: "D1", status: "completed", style: "Scandinavian", category: "Residential" },
  { idpID: 2, designerID: "D1", status: "ongoing", style: "Industrial", category: "Residential" },
  { idpID: 3, designerID: "D2", status: "completed", style: "Minimalist", category: "Commercial" },
  ...data.idp,
];

describe("generateDummyData", () => {
  it("gives every verified designer exactly 10 IDPs (99 designers, 990 IDPs)", () => {
    expect(allIDPs).toHaveLength(990);
    const perDesigner = {};
    for (const idp of allIDPs) perDesigner[idp.designerID] = (perDesigner[idp.designerID] ?? 0) + 1;
    expect(Object.keys(perDesigner)).toHaveLength(99);
    expect(new Set(Object.values(perDesigner))).toEqual(new Set([10]));
  });

  it("keeps every designer to 1 to 3 specialty styles, like a real firm", () => {
    const stylesOf = {};
    for (const idp of allIDPs) (stylesOf[idp.designerID] ??= new Set()).add(idp.style);
    for (const styles of Object.values(stylesOf)) {
      expect(styles.size).toBeGreaterThanOrEqual(1);
      expect(styles.size).toBeLessThanOrEqual(3);
    }
  });

  it("matches the hand-made designers' company descriptions", () => {
    const stylesOf = (id) => [...new Set(allIDPs.filter((i) => i.designerID === id).map((i) => i.style))].sort();
    expect(stylesOf("D1")).toEqual(["Industrial", "Scandinavian"]); // "Scandinavian and industrial touches"
    expect(stylesOf("D2")).toEqual(["Minimalist"]); // "Minimalist offices and retail spaces"
    expect(stylesOf("D3")).toEqual(["Japandi", "Tropical"]); // "Tropical and Japandi homes"
    expect(stylesOf("D5")).toEqual(["Industrial"]); // "Bold industrial lofts and bars"
    // D2 only does offices and retail spaces
    expect(allIDPs.filter((i) => i.designerID === "D2").every((i) => i.category === "Commercial")).toBe(true);
  });

  it("describes each generated company by its real specialty styles", () => {
    for (const company of data.company_information) {
      const styles = new Set(data.idp.filter((i) => i.designerID === company.designerID).map((i) => i.style));
      for (const style of styles) expect(company.description).toContain(style);
    }
  });

  it("gives no IDPs to D4, who is still waiting for verification", () => {
    expect(allIDPs.some((idp) => idp.designerID === "D4")).toBe(false);
  });

  it("creates accounts, verification and company info for designers D6 to D100", () => {
    const designerAccounts = data.user_account.filter((a) => a.profileID === "designer");
    expect(designerAccounts.map((a) => a.accountID)).toEqual(Array.from({ length: 95 }, (_, i) => `D${i + 6}`));
    expect(designerAccounts.every((a) => a.status === "active")).toBe(true);
    expect(data.designer_verification).toHaveLength(95);
    expect(data.designer_verification.every((v) => v.status === "approved")).toBe(true);
    expect(data.company_information).toHaveLength(95);
    expect(new Set(data.company_information.map((c) => c.companyName)).size).toBe(95);
  });

  it("creates customer accounts C2 to C100 (C1 is hand-made)", () => {
    const customers = data.user_account.filter((a) => a.profileID === "customer");
    expect(customers.map((a) => a.accountID)).toEqual(Array.from({ length: 99 }, (_, i) => `C${i + 2}`));
  });

  it("makes 90% of every designer's IDPs Completed (9 of 10)", () => {
    const completed = {};
    for (const idp of allIDPs) if (idp.status === "completed") completed[idp.designerID] = (completed[idp.designerID] ?? 0) + 1;
    expect(new Set(Object.values(completed))).toEqual(new Set([9]));
  });

  it("starts new IDP numbers at 5 (4 was deleted) and never repeats one", () => {
    const ids = data.idp.map((idp) => idp.idpID);
    expect(Math.min(...ids)).toBe(5);
    expect(new Set(ids).size).toBe(ids.length);
    expect(data.lastIDPID).toBe(Math.max(...ids));
  });

  it("records creation timestamps for generated IDPs", () => {
    for (const idp of data.idp) {
      expect(Number.isNaN(new Date(idp.createdAt).getTime())).toBe(false);
    }
  });

  it("gives every generated IDP 1 or 2 photos, the first as the main photo", () => {
    for (const idp of data.idp) {
      const photos = data.idp_photo.filter((p) => p.idpID === idp.idpID);
      expect(photos.length).toBeGreaterThanOrEqual(1);
      expect(photos.length).toBeLessThanOrEqual(2);
      expect(photos[0].sortOrder).toBe(1);
    }
  });

  it("only uses property types that match the category", () => {
    const residential = ["HDB", "Condo", "Landed"];
    for (const idp of data.idp) {
      expect(residential.includes(idp.propertyType)).toBe(idp.category === "Residential");
    }
  });

  it("creates enough views and likes to simulate real use (at least 100 each)", () => {
    expect(data.idp_view.length).toBeGreaterThanOrEqual(100);
    expect(data.idp_like.length).toBeGreaterThanOrEqual(100);
  });

  it("puts all activity in the last 90 days, never in the future", () => {
    const earliest = TODAY.getTime() - 90 * 86_400_000;
    for (const v of data.idp_view) {
      const t = new Date(v.viewedAt).getTime();
      expect(t).toBeGreaterThanOrEqual(earliest);
      expect(t).toBeLessThanOrEqual(TODAY.getTime());
    }
    for (const l of data.idp_like) expect(new Date(l.likedAt).getTime()).toBeLessThanOrEqual(TODAY.getTime());
  });

  it("lets each customer like an IDP only once (including the hand-made likes)", () => {
    const keys = data.idp_like.map((l) => `${l.customerID}-${l.idpID}`);
    expect(new Set(keys).size).toBe(keys.length);
    for (const handMade of ["C1-2", "C1-4", "C2-3", "C3-3"]) expect(keys).not.toContain(handMade);
  });

  it("never reuses the hand-made like IDs L1 to L4", () => {
    const ids = data.idp_like.map((l) => l.likeID);
    for (const handMade of ["L1", "L2", "L3", "L4"]) expect(ids).not.toContain(handMade);
  });

  it("gives the demo designer D1 activity on every one of their IDPs", () => {
    const d1IDs = allIDPs.filter((idp) => idp.designerID === "D1").map((idp) => idp.idpID);
    for (const id of d1IDs) expect(data.idp_view.some((v) => v.idpID === id)).toBe(true);
  });

  it("registers every generated company with ACRA under its own name and UEN (live)", () => {
    expect(data.acra_registry).toHaveLength(95);
    for (const company of data.company_information) {
      const record = data.acra_registry.find((r) => r.uen === company.registrationNumber);
      expect(record).toMatchObject({ entityName: `${company.companyName.toUpperCase()} PTE. LTD.`, status: "live" });
    }
  });

  it("makes the same data every time", () => {
    expect(generateDummyData(TODAY)).toEqual(data);
  });
});
