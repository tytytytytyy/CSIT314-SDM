// Unit tests for IDPPerformanceDashboardController (Interior Designer: IDP Performance Dashboard).
// Uses the small hand-made data in entity/LocalStore.js (the big generated dummy data is
// switched off for tests in tests/setup.js):
// - designer D1 owns IDP 1 and IDP 2, designer D2 owns IDP 3
// Each test writes its own view and like events, so the numbers are exact.

import { describe, it, expect, beforeEach } from "vitest";
import { IDPPerformanceDashboardController as C } from "@/controller/IDPPerformanceDashboardController";
import { writeTable } from "@/entity/LocalStore";

// Events at 04:00 UTC = 12:00 noon in Singapore, so the date is the same in both time zones.
const at = (date) => `${date}T04:00:00.000Z`;
const view = (id, idpID, date) => ({ viewID: id, idpID, customerID: "C1", viewedAt: at(date) });
const like = (id, idpID, date) => ({ likeID: id, idpID, customerID: "C1", likedAt: at(date) });

beforeEach(() => {
  window.localStorage.clear();
});

describe("validateDateRange", () => {
  it("accepts a normal range", () => {
    expect(C.validateDateRange("2026-10-01", "2026-10-31")).toBe(true);
  });

  it("accepts a one-day range", () => {
    expect(C.validateDateRange("2026-10-10", "2026-10-10")).toBe(true);
  });

  it("rejects an end date before the start date", () => {
    expect(C.validateDateRange("2026-10-31", "2026-10-01")).toBe(false);
  });

  it("rejects missing or invalid dates", () => {
    expect(C.validateDateRange("", "2026-10-01")).toBe(false);
    expect(C.validateDateRange("2026-10-01", "not a date")).toBe(false);
  });
});

describe("calculateLikeRate", () => {
  it("is likes divided by views", () => {
    expect(C.calculateLikeRate(18, 120)).toBe(0.15);
  });

  it("is 0 when there are no views, instead of dividing by zero", () => {
    expect(C.calculateLikeRate(0, 0)).toBe(0);
    expect(C.calculateLikeRate(3, 0)).toBe(0);
  });
});

describe("groupEventsByDay", () => {
  it("counts views and likes per day, in date order", () => {
    const views = [view("V1", 1, "2026-10-11"), view("V2", 1, "2026-10-10"), view("V3", 1, "2026-10-11")];
    const likes = [like("L9", 1, "2026-10-11")];
    expect(C.groupEventsByDay(views, likes)).toEqual([
      { date: "2026-10-10", views: 1, likes: 0 },
      { date: "2026-10-11", views: 2, likes: 1 },
    ]);
  });
});

describe("fillMissingDays", () => {
  it("adds 0-view, 0-like days so every day in the range is there", () => {
    const filled = C.fillMissingDays([{ date: "2026-10-11", views: 2, likes: 1 }], "2026-10-10", "2026-10-12");
    expect(filled).toEqual([
      { date: "2026-10-10", views: 0, likes: 0 },
      { date: "2026-10-11", views: 2, likes: 1 },
      { date: "2026-10-12", views: 0, likes: 0 },
    ]);
  });
});

describe("rankIDPs", () => {
  it("ranks by total likes, then total views to break ties", () => {
    const ranked = C.rankIDPs([
      { idpID: 1, totalLikes: 18, totalViews: 120 },
      { idpID: 2, totalLikes: 18, totalViews: 200 },
      { idpID: 3, totalLikes: 2, totalViews: 40 },
      { idpID: 4, totalLikes: 25, totalViews: 90 },
    ]);
    expect(ranked.map((s) => [s.idpID, s.rank])).toEqual([
      [4, 1],
      [2, 2],
      [1, 3],
      [3, 4],
    ]);
  });
});

describe("getDashboard", () => {
  beforeEach(() => {
    writeTable("idp_view", [
      view("V1", 1, "2026-10-10"),
      view("V2", 1, "2026-10-10"),
      view("V3", 1, "2026-10-12"),
      view("V4", 2, "2026-10-11"),
      view("V5", 3, "2026-10-11"), // IDP 3 belongs to D2, so D1 must not see it
      view("V6", 1, "2026-10-09"), // before the range
      view("V7", 1, "2026-10-13"), // after the range
    ]);
    writeTable("idp_like", [
      like("L1", 2, "2026-10-11"),
      like("L2", 1, "2026-10-12"),
      like("L3", 2, "2026-10-12"),
      like("L4", 3, "2026-10-12"), // D2's IDP
    ]);
  });

  it("returns null for a designer with no IDPs", async () => {
    expect(await C.getDashboard("D99", "2026-10-10", "2026-10-12")).toBeNull();
  });

  it("counts only this designer's events inside the date range", async () => {
    const dashboard = await C.getDashboard("D1", "2026-10-10", "2026-10-12");
    const byID = Object.fromEntries(dashboard.idpStats.map((s) => [s.idpID, s]));

    expect(Object.keys(byID)).toEqual(["1", "2"]);
    expect(byID[1]).toMatchObject({ totalViews: 3, totalLikes: 1 });
    expect(byID[2]).toMatchObject({ totalViews: 1, totalLikes: 2 });
  });

  it("gives every IDP a day-by-day count with no gaps", async () => {
    const dashboard = await C.getDashboard("D1", "2026-10-10", "2026-10-12");
    const idp1 = dashboard.idpStats.find((s) => s.idpID === 1);
    expect(idp1.dailyCounts).toEqual([
      { date: "2026-10-10", views: 2, likes: 0 },
      { date: "2026-10-11", views: 0, likes: 0 },
      { date: "2026-10-12", views: 1, likes: 1 },
    ]);
  });

  it("adds up all IDPs per day for the chart", async () => {
    const dashboard = await C.getDashboard("D1", "2026-10-10", "2026-10-12");
    expect(dashboard.dailyTotals).toEqual([
      { date: "2026-10-10", views: 2, likes: 0 },
      { date: "2026-10-11", views: 1, likes: 1 },
      { date: "2026-10-12", views: 1, likes: 2 },
    ]);
  });

  it("works out each IDP's like rate and ranks them", async () => {
    const dashboard = await C.getDashboard("D1", "2026-10-10", "2026-10-12");
    expect(dashboard.idpStats.map((s) => ({ idpID: s.idpID, rank: s.rank, likeRate: s.likeRate }))).toEqual([
      { idpID: 2, rank: 1, likeRate: 2 }, // 2 likes, 1 view
      { idpID: 1, rank: 2, likeRate: 1 / 3 }, // 1 like, 3 views
    ]);
  });

  it("still lists IDPs with no activity, with 0 views, 0 likes and a 0 like rate", async () => {
    writeTable("idp_view", []);
    writeTable("idp_like", []);
    const dashboard = await C.getDashboard("D1", "2026-10-10", "2026-10-11");
    expect(dashboard.idpStats).toHaveLength(2);
    for (const stats of dashboard.idpStats) {
      expect(stats).toMatchObject({ totalViews: 0, totalLikes: 0, likeRate: 0 });
      expect(stats.dailyCounts).toHaveLength(2);
    }
  });
});
