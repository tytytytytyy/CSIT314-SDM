import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GeneratePlatformReportController } from "@/controller/GeneratePlatformReportController";
import { IDP } from "@/entity/IDP";
import { writeTable } from "@/entity/LocalStore";

beforeEach(() => {
  window.localStorage.clear();
});

describe("validateReportRequest", () => {
  afterEach(() => vi.useRealTimers());

  it("accepts today's date early in the morning (before 8 am in Singapore)", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 10, 10, 1, 30)); // 10 Nov 2026, 1:30 am local time
    expect(GeneratePlatformReportController.validateReportRequest("daily", "2026-11-10")).toBeNull();
  });

  it("refuses a date after today", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 10, 10, 23, 30)); // 10 Nov 2026, 11:30 pm local time
    expect(GeneratePlatformReportController.validateReportRequest("daily", "2026-11-11")).toBe(
      "Reference date cannot be in the future",
    );
  });
});

describe("calculateChange", () => {
  const change = (current, previous) => GeneratePlatformReportController.calculateChange(current, previous);

  it("gives the rise or fall as a whole percentage of the previous period", () => {
    expect(change(12, 10)).toEqual({ direction: "up", percent: 20 });
    expect(change(5, 20)).toEqual({ direction: "down", percent: 75 });
    expect(change(2, 3)).toEqual({ direction: "down", percent: 33 });
  });

  it("says 'same' when nothing changed, including 0 to 0", () => {
    expect(change(7, 7)).toEqual({ direction: "same", percent: 0 });
    expect(change(0, 0)).toEqual({ direction: "same", percent: 0 });
  });

  it("has no percentage when the previous period was 0", () => {
    expect(change(4, 0)).toEqual({ direction: "up", percent: null });
  });
});

describe("generateReport", () => {
  it("counts records by their calendar date, including the end date", async () => {
    writeTable("user_account", [
      { accountID: "C10", profileID: "customer", createdAt: "2026-11-05T15:59:00.000Z" },
      { accountID: "C11", profileID: "customer", createdAt: "2026-11-05T16:00:00.000Z" },
    ]);
    writeTable("designer_verification", [
      { verificationID: "V10", status: "approved", reviewedAt: "2026-11-05T15:00:00.000Z" },
    ]);
    writeTable("idp", [
      { idpID: 10, createdAt: "2026-11-05T09:00:00.000Z" },
      { idpID: 11, createdAt: "2026-11-06T00:00:00.000Z" },
    ]);
    writeTable("idp_view", [
      { viewID: "W10", idpID: 10, viewedAt: "2026-11-05T15:59:00.000Z" },
    ]);
    writeTable("idp_like", [
      { likeID: "L10", idpID: 10, likedAt: "2026-11-05T15:59:00.000Z" },
    ]);
    const report = await GeneratePlatformReportController.generateReport(
      "daily",
      "2026-11-05",
    );

    expect(report.status).toBe("ok");
    expect(report.periods).toHaveLength(5);
    expect(report.periods.map(({ range }) => range.startDate)).toEqual([
      new Date("2026-11-01"),
      new Date("2026-11-02"),
      new Date("2026-11-03"),
      new Date("2026-11-04"),
      new Date("2026-11-05"),
    ]);
    expect(report.periods.at(-1)).toMatchObject({
      customerAccounts: 1,
      verifiedDesigners: 1,
      idps: 1,
      views: 1,
      likes: 1,
    });
  });

  it("returns the period it was generated for, so the page labels the columns correctly", async () => {
    const report = await GeneratePlatformReportController.generateReport("weekly", "2026-11-05");
    expect(report.period).toBe("weekly");
  });

  it("assigns a creation timestamp when a new IDP is saved", async () => {
    const created = await IDP.createIDP({
      designerID: "D1",
      title: "Test project",
      description: "Test",
      style: "Modern",
      propertyType: "HDB",
      category: "Residential",
      budget: 10000,
      status: "completed",
    });

    expect(Number.isNaN(new Date(created.createdAt).getTime())).toBe(false);
  });

  it("counts older IDPs using their first saved photo date", async () => {
    window.localStorage.setItem(
      "idp_platform_v12_idp",
      JSON.stringify([{ idpID: 20, title: "Older project" }]),
    );
    window.localStorage.setItem(
      "idp_platform_v12_idp_photo",
      JSON.stringify([
        { idpID: 20, uploadedAt: "2026-11-05T09:00:00.000Z" },
      ]),
    );

    await expect(IDP.countIDPs(new Date("2026-11-05"), new Date("2026-11-05"))).resolves.toBe(1);
    expect(await IDP.getIDP(20)).toMatchObject({
      idpID: 20,
      title: "Older project",
      createdAt: "2026-11-05T09:00:00.000Z",
    });
  });
});
