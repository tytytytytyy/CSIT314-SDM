// Unit tests for CreateIDPController (Interior Designer: Create IDP).
// Uses the dummy data in entity/LocalStore.js:
// - designer D1 owns IDP 1 and 2, designer D2 owns IDP 3
// - IDP 4 was deleted, but customer C1's like of it is still stored
// localStorage is cleared before each test, so every test starts from that same data.

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { CreateIDPController } from "@/controller/CreateIDPController";
import { IDViewIDPDetailsController } from "@/controller/IDViewIDPDetailsController";
import { ViewFavouritesListController } from "@/controller/ViewFavouritesListController";
import { IDP } from "@/entity/IDP";
import { IDPPhoto } from "@/entity/IDPPhoto";

const C = CreateIDPController;

function validInput(overrides = {}) {
  return {
    title: "Tropical Balcony Garden",
    description:
      "Lush plants, teak decking and outdoor lighting for a condo balcony.",
    style: "Tropical",
    propertyType: "Condo",
    category: "Residential",
    budget: 15000,
    status: "completed",
    ...overrides,
  };
}

function photo(fileName = "balcony.jpg") {
  return { fileName, dataURL: "data:image/jpeg;base64,AAAA" };
}

beforeEach(() => {
  window.localStorage.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("getCreateFormData", () => {
  it("gives the same dropdown choices as Update IDP", () => {
    const data = C.getCreateFormData();
    expect(data.categories).toEqual(["Residential", "Commercial"]);
    expect(data.statuses.map((s) => s.label)).toEqual([
      "In Progress",
      "Completed",
    ]);
    expect(data.styles).toContain("Tropical");
  });
});

describe("validateIDP", () => {
  it("returns no errors for valid input with a photo", () => {
    expect(C.validateIDP(validInput(), [photo()])).toEqual([]);
  });

  it("requires at least one photo", () => {
    expect(C.validateIDP(validInput(), [])).toContain(
      "At least one photo is required",
    );
  });

  it("allows at most 10 photos", () => {
    const photos = Array.from({ length: 11 }, () => photo());
    expect(C.validateIDP(validInput(), photos)).toContain(
      "Too many photos (maximum 10)",
    );
  });

  it("uses the same field rules as Update IDP", () => {
    const errors = C.validateIDP(
      validInput({ title: "", propertyType: "Office", budget: 0 }),
      [photo()],
    );
    expect(errors).toEqual([
      "Title is required",
      "Office is not a Residential property type",
      "Budget must be a number greater than 0",
    ]);
  });
});

describe("createIDP", () => {
  it("saves the IDP for the logged-in designer and returns its new ID", async () => {
    const result = await C.createIDP(
      "D1",
      validInput({ title: "  Tropical Balcony Garden  " }),
      [photo()],
    );
    expect(result.success).toBe(true);

    const saved = await IDP.getIDP(result.idpID);
    expect(saved).toMatchObject({
      designerID: "D1",
      title: "Tropical Balcony Garden",
      style: "Tropical",
      propertyType: "Condo",
      category: "Residential",
      budget: 15000,
      status: "completed",
    });
  });

  it("never reuses the ID of a deleted IDP", async () => {
    const first = await C.createIDP("D1", validInput(), [photo()]);
    const second = await C.createIDP("D1", validInput(), [photo()]);
    expect(first.idpID).toBe(5); // 4 was used by the deleted IDP
    expect(second.idpID).toBe(6);
  });

  it("does not show up in a customer's favourites just because an old like used the same ID", async () => {
    await C.createIDP("D1", validInput(), [photo()]);
    const favourites = await ViewFavouritesListController.getFavourites("C1");
    expect(favourites.map((f) => f.idpID)).toEqual([2]);
  });

  it("saves the photos in order, first one as the main photo", async () => {
    const result = await C.createIDP("D1", validInput(), [
      photo("balcony.jpg"),
      photo("lights.png"),
    ]);
    const photos = await IDPPhoto.getPhotos(result.idpID);
    expect(photos.map((p) => p.caption)).toEqual(["balcony", "lights"]);
    expect(photos.map((p) => p.sortOrder)).toEqual([1, 2]);
  });

  it("adds the new IDP to the designer's My IDPs list", async () => {
    const result = await C.createIDP("D1", validInput(), [photo()]);
    const list = await IDViewIDPDetailsController.getMyIDPs("D1");
    expect(list.map((item) => item.idpID)).toEqual([1, 2, result.idpID]);
  });

  it("does not save anything when the input is invalid", async () => {
    const result = await C.createIDP("D1", validInput({ description: "" }), []);
    expect(result).toEqual({
      success: false,
      errors: ["Description is required", "At least one photo is required"],
    });
    expect((await IDP.getIDPsByDesigner("D1")).length).toBe(2);
  });

  it("undoes everything if the browser runs out of storage space", async () => {
    await IDP.getIDPsByDesigner("D1"); // load the dummy data before storage "fills up"
    await IDPPhoto.getPhotos(1);
    const realSetItem = Storage.prototype.setItem;
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(
      function (key, value) {
        if (key.endsWith("idp_photo"))
          throw new DOMException("full", "QuotaExceededError");
        return realSetItem.call(this, key, value);
      },
    );

    const result = await C.createIDP("D1", validInput(), [photo()]);
    expect(result).toEqual({
      success: false,
      errors: [
        "Not enough storage space for these photos. Try fewer or smaller photos.",
      ],
    });
    expect((await IDP.getIDPsByDesigner("D1")).map((idp) => idp.idpID)).toEqual(
      [1, 2],
    );
  });
});
