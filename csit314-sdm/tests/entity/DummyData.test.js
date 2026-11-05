// Unit tests for the generated dummy data (entity/DummyData.js).
// tests/setup.js switches the generator off for the other tests, so this file loads the real one.

import { describe, it, expect, vi } from "vitest";

const { generateDummyData } = await vi.importActual("@/entity/DummyData");

const TODAY = new Date("2026-11-05T12:00:00.000Z");
const data = generateDummyData(TODAY);
// The hand-made IDPs in LocalStore: D1 owns 1 (completed) and 2 (in progress), D2 owns 3 (completed).
const allIDPs = [
  { idpID: 1, designerID: "D1", status: "completed" },
  { idpID: 2, designerID: "D1", status: "ongoing" },
  { idpID: 3, designerID: "D2", status: "completed" },
  ...data.idp,
];

describe("generateDummyData", () => {
  it("gives 100 designers exactly 10 IDPs each (1,000 IDPs)", () => {
    expect(allIDPs).toHaveLength(1000);
    const perDesigner = {};
    for (const idp of allIDPs) perDesigner[idp.designerID] = (perDesigner[idp.designerID] ?? 0) + 1;
    expect(Object.keys(perDesigner)).toHaveLength(100);
    expect(new Set(Object.values(perDesigner))).toEqual(new Set([10]));
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
    expect(keys).not.toContain("C1-2");
    expect(keys).not.toContain("C1-4");
  });

  it("gives the demo designer D1 activity on every one of their IDPs", () => {
    const d1IDs = allIDPs.filter((idp) => idp.designerID === "D1").map((idp) => idp.idpID);
    for (const id of d1IDs) expect(data.idp_view.some((v) => v.idpID === id)).toBe(true);
  });

  it("makes the same data every time", () => {
    expect(generateDummyData(TODAY)).toEqual(data);
  });
});
