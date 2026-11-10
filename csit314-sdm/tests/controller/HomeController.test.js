// Unit tests for HomeController (Customer: home page IDP feed).
// Uses the dummy data in entity/LocalStore.js:
// - IDP 1 and IDP 2 by D1 Nordic Nest Interiors, IDP 3 by D2 Studio Linea
// - IDP 4 was deleted
// localStorage is cleared before each test, so every test starts from that same data.

import { describe, it, expect, beforeEach } from "vitest";
import { HomeController } from "@/controller/HomeController";
import { readTable, writeTable } from "@/entity/LocalStore";
import { toDateKey } from "@/lib/dates";

beforeEach(() => {
  window.localStorage.clear();
});

const idpIDs = (page) => page.cards.map((c) => c.idpID);

// Adds one IDP per designer, with IDs 50, 51, ... (D4 is pending, D5 is suspended in LocalStore).
const addIDPsBy = (designerIDs) =>
  writeTable("idp", [
    ...readTable("idp"),
    ...designerIDs.map((designerID, i) => ({
      idpID: 50 + i,
      designerID,
      title: `Project by ${designerID}`,
      style: "Industrial",
      category: "Residential",
      propertyType: "Condo",
      budget: 10000,
      status: "completed",
      createdAt: "2026-03-01T08:00:00.000Z",
    })),
  ]);

describe("getIDPFeed", () => {
  it("returns the first page of IDPs in ID order", async () => {
    const page = await HomeController.getIDPFeed(0, 2);
    expect(idpIDs(page)).toEqual([1, 2]);
    expect(page.hasMore).toBe(true);
  });

  it("continues where the last page stopped, and says when there are no more", async () => {
    const page = await HomeController.getIDPFeed(2, 2);
    expect(idpIDs(page)).toEqual([3]);
    expect(page.hasMore).toBe(false);
  });

  it("leaves out deleted IDPs", async () => {
    const page = await HomeController.getIDPFeed(0, 10);
    expect(idpIDs(page)).toEqual([1, 2, 3]);
  });

  it("gives each card its title, main photo, style and designer", async () => {
    const [card] = (await HomeController.getIDPFeed(0, 1)).cards;
    expect(card).toMatchObject({
      idpID: 1,
      title: "Bright Scandinavian Living Room",
      style: "Scandinavian",
      designerID: "D1",
      companyName: "Nordic Nest Interiors",
    });
    expect(card.mainPhotoURL).toBeTruthy();
  });

  it("names the right designer for each IDP", async () => {
    const page = await HomeController.getIDPFeed(0, 3);
    expect(page.cards.map((c) => c.companyName)).toEqual([
      "Nordic Nest Interiors",
      "Nordic Nest Interiors",
      "Studio Linea",
    ]);
  });

  it("returns an empty last page past the end", async () => {
    expect(await HomeController.getIDPFeed(50, 12)).toEqual({ cards: [], hasMore: false });
  });

  it("leaves out IDPs whose designer is suspended (D5) or still pending verification (D4)", async () => {
    addIDPsBy(["D5", "D4"]);
    const page = await HomeController.getIDPFeed(0, 10);
    expect(idpIDs(page)).toEqual([1, 2, 3]);
    expect(page.hasMore).toBe(false);
  });

  it("uses a page of PAGE_SIZE when no size is given", async () => {
    expect(HomeController.PAGE_SIZE).toBe(12);
    const page = await HomeController.getIDPFeed(0);
    expect(page.cards.length).toBeLessThanOrEqual(HomeController.PAGE_SIZE);
  });
});

describe("featured IDPs", () => {
  const today = toDateKey(new Date());
  const promote = (rows) => writeTable("promotion", rows.map((r, i) => ({ promotionID: i + 1, createdBy: "M12345", ...r })));

  it("lists the IDPs with a promotion running today, as cards", async () => {
    promote([{ idpID: 3, startDate: today, endDate: "2099-12-31" }]);
    const featured = await HomeController.getFeaturedIDPs();
    expect(featured.map((c) => c.idpID)).toEqual([3]);
    expect(featured[0]).toMatchObject({ title: expect.any(String), designerID: "D2", companyName: "Studio Linea" });
  });

  it("ignores promotions that have finished or not started, and deleted IDPs", async () => {
    promote([
      { idpID: 3, startDate: "2000-01-01", endDate: "2000-01-31" },
      { idpID: 2, startDate: "2099-01-01", endDate: "2099-01-31" },
      { idpID: 4, startDate: today, endDate: "2099-12-31" },
    ]);
    expect(await HomeController.getFeaturedIDPs()).toEqual([]);
    expect(idpIDs(await HomeController.getIDPFeed(0, 10))).toEqual([1, 2, 3]);
  });

  it("leaves out promoted IDPs whose designer is suspended or not verified", async () => {
    addIDPsBy(["D5", "D4"]);
    promote([
      { idpID: 50, startDate: today, endDate: "2099-12-31" },
      { idpID: 51, startDate: today, endDate: "2099-12-31" },
    ]);
    expect(await HomeController.getFeaturedIDPs()).toEqual([]);
  });

  it("leaves featured IDPs out of the main feed, so no card shows twice", async () => {
    promote([{ idpID: 1, startDate: today, endDate: "2099-12-31" }]);
    const page = await HomeController.getIDPFeed(0, 1);
    expect(idpIDs(page)).toEqual([2]);
    expect(page.hasMore).toBe(true);
    const page2 = await HomeController.getIDPFeed(1, 1);
    expect(idpIDs(page2)).toEqual([3]);
    expect(page2.hasMore).toBe(false);
  });
});
