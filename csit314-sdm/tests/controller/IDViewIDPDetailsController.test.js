// Unit tests for IDViewIDPDetailsController (Interior Designer: View IDP details).
// Uses the dummy data in entity/LocalStore.js:
// - IDP 1 and IDP 2 belong to designer D1
// - IDP 3 belongs to designer D2
// - IDP 4 was deleted
// localStorage is cleared before each test, so every test starts from that same data.

import { describe, it, expect, beforeEach } from "vitest";
import { IDViewIDPDetailsController } from "@/controller/IDViewIDPDetailsController";

beforeEach(() => {
  window.localStorage.clear();
});

describe("getMyIDPs", () => {
  it("lists only the logged-in designer's own IDPs", async () => {
    const list = await IDViewIDPDetailsController.getMyIDPs("D1");
    expect(list.map((item) => item.idpID)).toEqual([1, 2]);
  });

  it("gives each IDP its status and main photo", async () => {
    const list = await IDViewIDPDetailsController.getMyIDPs("D1");
    expect(list[0]).toMatchObject({
      idpID: 1,
      status: "completed",
      propertyType: "HDB",
    });
    expect(list[0].mainPhotoURL).toMatch(/^\/demo-photos\/.+\.jpg$/);
    expect(list[1]).toMatchObject({ idpID: 2, status: "ongoing" });
  });

  it("does not show other designers' IDPs", async () => {
    const list = await IDViewIDPDetailsController.getMyIDPs("D2");
    expect(list.map((item) => item.idpID)).toEqual([3]);
  });

  it("returns an empty list for a designer with no IDPs", async () => {
    expect(await IDViewIDPDetailsController.getMyIDPs("D99")).toEqual([]);
  });
});

describe("getStatusLabel", () => {
  it("shows ongoing as In Progress", () => {
    expect(IDViewIDPDetailsController.getStatusLabel("ongoing")).toBe(
      "In Progress",
    );
    expect(IDViewIDPDetailsController.getStatusLabel("completed")).toBe(
      "Completed",
    );
  });
});

describe("viewIDPDetails", () => {
  it("returns the IDP and its photos to the designer who owns it", async () => {
    const result = await IDViewIDPDetailsController.viewIDPDetails("D1", 1);

    expect(result.status).toBe("ok");
    expect(result.details?.idp.title).toBe("Bright Scandinavian Living Room");
    expect(result.details?.idp.status).toBe("completed");
    expect(result.details?.photos.map((p) => p.photoID)).toEqual(["P1", "P2"]);
  });

  it("returns photos in display order, main photo first", async () => {
    const result = await IDViewIDPDetailsController.viewIDPDetails("D1", 1);
    expect(result.details?.photos.map((p) => p.sortOrder)).toEqual([1, 2]);
  });

  it("works for every IDP the designer owns", async () => {
    const result = await IDViewIDPDetailsController.viewIDPDetails("D1", 2);
    expect(result.status).toBe("ok");
    expect(result.details?.idp.title).toBe("Industrial Loft Conversion");
  });

  it("blocks a designer from viewing another designer's IDP", async () => {
    const result = await IDViewIDPDetailsController.viewIDPDetails("D1", 3);
    expect(result).toEqual({ status: "notOwner" });
  });

  it("reports a deleted IDP as not found", async () => {
    const result = await IDViewIDPDetailsController.viewIDPDetails("D1", 4);
    expect(result).toEqual({ status: "notFound" });
  });

  it("reports an IDP that never existed as not found", async () => {
    const result = await IDViewIDPDetailsController.viewIDPDetails("D1", 999);
    expect(result).toEqual({ status: "notFound" });
  });
});
