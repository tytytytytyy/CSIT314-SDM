// Unit tests for BrowseInteriorDesignersController (Customer: Browse Interior Designers).
// Uses the dummy data in entity/LocalStore.js:
// - D1 Nordic Nest Interiors (Tampines): IDP 1 Scandinavian + IDP 2 Industrial, both Residential;
//   1 like (on IDP 2; C1's like on the deleted IDP 4 does not count). Joined 2026-03-01.
// - D2 Studio Linea (Raffles Place): IDP 3 Minimalist, Commercial; 2 likes. Joined 2026-05-10.
// - D3 Habitat & Co (Jurong East): no IDPs, 0 likes. Joined 2026-08-20.
// - D4 Fresh Start Design: verification still pending -> hidden.
// - D5 Urban Edge Interiors (Tampines): account suspended -> hidden.
// localStorage is cleared before each test, so every test starts from that same data.

import { describe, it, expect, beforeEach } from "vitest";
import { BrowseInteriorDesignersController } from "@/controller/BrowseInteriorDesignersController";

beforeEach(() => {
  window.localStorage.clear();
});

const browse = (filters, sortBy) =>
  BrowseInteriorDesignersController.browseDesigners(filters, sortBy);
const ids = (result) => result.designers.map((d) => d.designerID);

describe("browseDesigners - who is shown", () => {
  it("lists only verified designers with active accounts, sorted by name", async () => {
    const result = await browse({}, "name");
    expect(result.status).toBe("ok");
    expect(ids(result)).toEqual(["D3", "D1", "D2"]); // Habitat, Nordic, Studio
  });

  it("hides a designer whose verification is still pending", async () => {
    expect(ids(await browse({ keyword: "Fresh Start" }, "name"))).toEqual([]);
  });

  it("hides a suspended designer even though they were verified", async () => {
    expect(ids(await browse({ keyword: "Urban Edge" }, "name"))).toEqual([]);
  });
});

describe("browseDesigners - designer card", () => {
  it("combines company details, IDP count, styles and total likes", async () => {
    const result = await browse({}, "name");
    const d1 = result.designers.find((d) => d.designerID === "D1");
    expect(d1).toMatchObject({
      companyName: "Nordic Nest Interiors",
      location: "Tampines",
      styles: ["Scandinavian", "Industrial"],
      categories: ["Residential"],
      idpCount: 2,
      totalLikes: 1,
    });
    expect(d1.logoURL).toMatch(/^data:image\/svg\+xml/);
  });

  it("gives each card the main photo of the designer's IDPs", async () => {
    const result = await browse({}, "name");
    const d1 = result.designers.find((d) => d.designerID === "D1");
    expect(d1.samplePhotos.map((p) => p.idpID)).toEqual([1, 2]);
    expect(d1.samplePhotos[0].photoURL).toMatch(/^\/demo-photos\/.+\.jpg$/);
  });

  it("shows a designer with no IDPs with zero counts and no photos", async () => {
    const result = await browse({}, "name");
    const d3 = result.designers.find((d) => d.designerID === "D3");
    expect(d3).toMatchObject({
      idpCount: 0,
      totalLikes: 0,
      styles: [],
      samplePhotos: [],
    });
  });
});

describe("browseDesigners - filters", () => {
  it("matches the keyword against company name, ignoring case", async () => {
    expect(ids(await browse({ keyword: "linea" }, "name"))).toEqual(["D2"]);
  });

  it("matches the keyword against the description", async () => {
    expect(ids(await browse({ keyword: "offices" }, "name"))).toEqual(["D2"]);
  });

  it("filters by part of the location", async () => {
    // D5 is also in Tampines but is suspended.
    expect(ids(await browse({ location: "tamp" }, "name"))).toEqual(["D1"]);
  });

  it("filters by style using any of the designer's IDPs", async () => {
    expect(ids(await browse({ style: "Industrial" }, "name"))).toEqual(["D1"]);
    expect(ids(await browse({ style: "Minimalist" }, "name"))).toEqual(["D2"]);
  });

  it("filters by category", async () => {
    expect(ids(await browse({ category: "Commercial" }, "name"))).toEqual([
      "D2",
    ]);
  });

  it("combines filters", async () => {
    const result = await browse(
      { location: "Tampines", category: "Commercial" },
      "name",
    );
    expect(ids(result)).toEqual([]);
  });

  it("returns an empty list when nothing matches", async () => {
    const result = await browse({ keyword: "no such firm" }, "name");
    expect(result).toEqual({ status: "ok", designers: [] });
  });
});

describe("browseDesigners - sorting", () => {
  it("sorts by most IDPs, ties by name", async () => {
    expect(ids(await browse({}, "mostIDPs"))).toEqual(["D1", "D2", "D3"]);
  });

  it("sorts by most liked, ties by name", async () => {
    expect(ids(await browse({}, "mostLiked"))).toEqual(["D2", "D1", "D3"]);
  });

  it("sorts by newest account first", async () => {
    expect(ids(await browse({}, "newest"))).toEqual(["D3", "D2", "D1"]);
  });
});

describe("validateFilters", () => {
  it("accepts empty filters and every sort option", () => {
    for (const sortBy of BrowseInteriorDesignersController.SORT_OPTIONS)
      expect(
        BrowseInteriorDesignersController.validateFilters({}, sortBy),
      ).toBeNull();
  });

  it("rejects an unknown sort option", async () => {
    expect(await browse({}, "cheapest")).toEqual({
      status: "invalid",
      message: "Invalid sort option",
    });
  });

  it("rejects an unknown style or category", async () => {
    expect((await browse({ style: "Gothic" }, "name")).status).toBe("invalid");
    expect((await browse({ category: "Industrial" }, "name")).status).toBe(
      "invalid",
    );
  });

  it("rejects a keyword that is too long", async () => {
    const result = await browse({ keyword: "x".repeat(101) }, "name");
    expect(result.status).toBe("invalid");
  });
});
