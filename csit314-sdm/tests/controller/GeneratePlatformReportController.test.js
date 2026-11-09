import { beforeEach, describe, expect, it } from "vitest";
import { GeneratePlatformReportController } from "@/controller/GeneratePlatformReportController";
import { IDP } from "@/entity/IDP";
import { writeTable } from "@/entity/LocalStore";

beforeEach(() => {
  window.localStorage.clear();
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
      "idp_platform_v9_idp",
      JSON.stringify([{ idpID: 20, title: "Older project" }]),
    );
    window.localStorage.setItem(
      "idp_platform_v9_idp_photo",
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
