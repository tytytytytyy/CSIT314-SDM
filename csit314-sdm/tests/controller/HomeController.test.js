// Unit tests for HomeController (Customer: home page IDP feed).
// Uses the dummy data in entity/LocalStore.js:
// - IDP 1 and IDP 2 by D1 Nordic Nest Interiors, IDP 3 by D2 Studio Linea
// - IDP 4 was deleted
// localStorage is cleared before each test, so every test starts from that same data.

import { describe, it, expect, beforeEach } from "vitest";
import { HomeController } from "@/controller/HomeController";

beforeEach(() => {
  window.localStorage.clear();
});

const idpIDs = (page) => page.cards.map((c) => c.idpID);

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

  it("uses a page of PAGE_SIZE when no size is given", async () => {
    expect(HomeController.PAGE_SIZE).toBe(12);
    const page = await HomeController.getIDPFeed(0);
    expect(page.cards.length).toBeLessThanOrEqual(HomeController.PAGE_SIZE);
  });
});
