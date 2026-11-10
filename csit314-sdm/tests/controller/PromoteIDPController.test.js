// Unit tests for PromoteIDPController (Platform Manager: Promote IDP).
// Uses the hand-made data in entity/LocalStore.js (IDPs 1 to 3; IDP 4 was deleted).
// The promotion table starts empty in tests. Dates are fixed with fake timers: "today" is 10 Nov 2026.

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PromoteIDPController } from "@/controller/PromoteIDPController";
import { Promotion } from "@/entity/Promotion";
import { readTable, writeTable } from "@/entity/LocalStore";

beforeEach(() => {
  localStorage.clear();
  vi.useFakeTimers();
  vi.setSystemTime(new Date(2026, 10, 10, 10, 0)); // 10 Nov 2026, 10 am local time
});
afterEach(() => vi.useRealTimers());

const promotionsOn = (idpIDs, startDate, endDate) =>
  idpIDs.map((idpID, i) => ({ promotionID: i + 1, idpID, startDate, endDate, createdBy: "M12345" }));

describe("validatePromotion", () => {
  it("accepts an existing IDP with a future date range", async () => {
    expect(await PromoteIDPController.validatePromotion(1, "2026-11-10", "2026-11-20")).toEqual({ status: "ok" });
  });

  it("reports an IDP that does not exist (or was deleted)", async () => {
    expect((await PromoteIDPController.validatePromotion(4, "2026-11-10", "2026-11-20")).status).toBe("notFound");
    expect((await PromoteIDPController.validatePromotion(999, "2026-11-10", "2026-11-20")).status).toBe("notFound");
  });

  it("refuses a start date in the past", async () => {
    expect((await PromoteIDPController.validatePromotion(1, "2026-11-09", "2026-11-20")).status).toBe("invalidStartDate");
  });

  it("refuses an end date that is not after the start date", async () => {
    expect((await PromoteIDPController.validatePromotion(1, "2026-11-15", "2026-11-15")).status).toBe("invalidEndDate");
    expect((await PromoteIDPController.validatePromotion(1, "2026-11-15", "2026-11-12")).status).toBe("invalidEndDate");
  });

  it("allows at most 10 promotions on any one day", async () => {
    writeTable("promotion", promotionsOn([11, 12, 13, 14, 15, 16, 17, 18, 19, 20], "2026-11-12", "2026-11-14"));
    expect((await PromoteIDPController.validatePromotion(1, "2026-11-10", "2026-11-12")).status).toBe("maxPromotionsReached");
    expect((await PromoteIDPController.validatePromotion(1, "2026-11-15", "2026-11-20")).status).toBe("ok");
  });

  it("refuses empty or impossible dates", async () => {
    expect((await PromoteIDPController.validatePromotion(1, "", "")).status).toBe("invalidStartDate");
    expect((await PromoteIDPController.validatePromotion(1, "2026-11-12", "")).status).toBe("invalidEndDate");
    expect((await PromoteIDPController.validatePromotion(1, "2026-02-31", "2026-03-05")).status).toBe("invalidStartDate");
    expect((await PromoteIDPController.validatePromotion(1, "2026-11-12", "not a date")).status).toBe("invalidEndDate");
  });

  it("accepts today as the start date in a timezone behind UTC", async () => {
    const originalTZ = process.env.TZ;
    process.env.TZ = "America/New_York";
    try {
      vi.setSystemTime(new Date(2026, 10, 10, 10, 0)); // 10 Nov 2026, 10 am in New York
      expect((await PromoteIDPController.validatePromotion(1, "2026-11-10", "2026-11-20")).status).toBe("ok");
    } finally {
      process.env.TZ = originalTZ;
    }
  });

  it("refuses an IDP whose designer is suspended or not verified", async () => {
    writeTable("idp", [
      ...readTable("idp"),
      { idpID: 50, designerID: "D5", title: "Suspended designer's loft", category: "Residential", propertyType: "Condo", status: "completed" },
    ]);
    expect((await PromoteIDPController.validatePromotion(50, "2026-11-10", "2026-11-20")).status).toBe("designerNotVerified");
  });

  it("refuses dates that overlap another promotion of the same IDP", async () => {
    writeTable("promotion", promotionsOn([1], "2026-11-12", "2026-11-18"));
    expect((await PromoteIDPController.validatePromotion(1, "2026-11-15", "2026-11-25")).status).toBe("dateOverlap");
    expect((await PromoteIDPController.validatePromotion(2, "2026-11-15", "2026-11-25")).status).toBe("ok");
  });
});

describe("getIDPs", () => {
  it("lists only IDPs whose designer is active and verified", async () => {
    writeTable("idp", [
      ...readTable("idp"),
      { idpID: 50, designerID: "D5", title: "Suspended designer's loft" },
      { idpID: 51, designerID: "D4", title: "Pending designer's flat" },
    ]);
    expect((await PromoteIDPController.getIDPs()).map((idp) => idp.idpID)).toEqual([1, 2, 3]);
  });
});

describe("promoteIDP", () => {
  it("saves the promotion with the platform manager who created it", async () => {
    expect(await PromoteIDPController.promoteIDP(1, "2026-11-10", "2026-11-20", "M12345")).toEqual({ status: "ok" });
    expect(await Promotion.getPromotions()).toEqual([
      expect.objectContaining({ promotionID: 1, idpID: 1, startDate: "2026-11-10", endDate: "2026-11-20", createdBy: "M12345" }),
    ]);
  });

  it("saves nothing when the promotion is not valid", async () => {
    expect((await PromoteIDPController.promoteIDP(1, "2026-11-01", "2026-11-20", "M12345")).status).toBe("invalidStartDate");
    expect(await Promotion.getPromotions()).toEqual([]);
  });
});

describe("Promotion.getActivePromotions", () => {
  it("returns only promotions running on the given day, including their first and last day", async () => {
    writeTable("promotion", [
      { promotionID: 1, idpID: 1, startDate: "2026-11-01", endDate: "2026-11-10", createdBy: "M12345" }, // ends today
      { promotionID: 2, idpID: 2, startDate: "2026-11-10", endDate: "2026-11-30", createdBy: "M12345" }, // starts today
      { promotionID: 3, idpID: 3, startDate: "2026-10-01", endDate: "2026-10-31", createdBy: "M12345" }, // finished
      { promotionID: 4, idpID: 3, startDate: "2026-11-20", endDate: "2026-11-30", createdBy: "M12345" }, // not started
    ]);
    expect((await Promotion.getActivePromotions("2026-11-10")).map((p) => p.promotionID)).toEqual([1, 2]);
  });
});
