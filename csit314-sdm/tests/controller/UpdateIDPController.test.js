// Unit tests for UpdateIDPController (Interior Designer: Update IDP).
// Uses the dummy data in entity/LocalStore.js:
// - IDP 1 (D1, completed) has photos P1 (main) and P2
// - IDP 2 (D1, ongoing) has photo P3
// - IDP 3 belongs to designer D2
// localStorage is cleared before each test, so every test starts from that same data.

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { UpdateIDPController } from "@/controller/UpdateIDPController";
import { IDP } from "@/entity/IDP";
import { IDPPhoto } from "@/entity/IDPPhoto";
import { readTable, writeTable } from "@/entity/LocalStore";

const C = UpdateIDPController;

function validInput(overrides = {}) {
  return {
    title: "Industrial Loft Conversion",
    description:
      "Exposed brick, black steel and warm lighting for a condo loft.",
    style: "Industrial",
    propertyType: "Condo",
    category: "Residential",
    budget: 42000,
    status: "ongoing",
    ...overrides,
  };
}

function newPhoto(overrides = {}) {
  return {
    fileName: "kitchen.jpg",
    dataURL: "data:image/jpeg;base64,AAAA",
    ...overrides,
  };
}

beforeEach(() => {
  window.localStorage.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("getIDPForUpdate", () => {
  it("returns the IDP and photos to its owner", async () => {
    const result = await C.getIDPForUpdate("D1", 2);
    expect(result.status).toBe("ok");
    expect(result.details?.idp.title).toBe("Industrial Loft Conversion");
    expect(result.details?.photos.map((p) => p.photoID)).toEqual(["P3"]);
  });

  it("blocks another designer", async () => {
    expect(await C.getIDPForUpdate("D1", 3)).toEqual({ status: "notOwner" });
  });

  it("reports a deleted IDP as not found", async () => {
    expect(await C.getIDPForUpdate("D1", 4)).toEqual({ status: "notFound" });
  });
});

describe("getUpdateFormData", () => {
  it("gives the choices for each dropdown", () => {
    const data = C.getUpdateFormData();
    expect(data.categories).toEqual(["Residential", "Commercial"]);
    expect(data.propertyTypesByCategory.Residential).toContain("HDB");
    expect(data.propertyTypesByCategory.Commercial).toContain("Office");
    expect(data.styles).toContain("Scandinavian");
    expect(data.statuses).toEqual([
      { value: "ongoing", label: "In Progress" },
      { value: "completed", label: "Completed" },
    ]);
  });
});

describe("validateIDP", () => {
  it("returns no errors for valid input", () => {
    expect(C.validateIDP(validInput(), 1, [])).toEqual([]);
  });

  it("requires a title", () => {
    expect(C.validateIDP(validInput({ title: "  " }), 1, [])).toContain(
      "Title is required",
    );
  });

  it("rejects a title that is too long", () => {
    const title = "a".repeat(C.MAX_TITLE_LENGTH + 1);
    expect(C.validateIDP(validInput({ title }), 1, [])).toContain(
      `Title must be at most ${C.MAX_TITLE_LENGTH} characters`,
    );
  });

  it("requires a description", () => {
    expect(C.validateIDP(validInput({ description: "" }), 1, [])).toContain(
      "Description is required",
    );
  });

  it("rejects a description that is too long", () => {
    const description = "a".repeat(C.MAX_DESCRIPTION_LENGTH + 1);
    expect(C.validateIDP(validInput({ description }), 1, [])).toContain(
      `Description must be at most ${C.MAX_DESCRIPTION_LENGTH} characters`,
    );
  });

  it("only accepts styles, categories and statuses from the list", () => {
    expect(C.validateIDP(validInput({ style: "Gothic" }), 1, [])).toContain(
      "Please choose a style from the list",
    );
    expect(
      C.validateIDP(validInput({ category: "Industrial" }), 1, []),
    ).toContain("Please choose Residential or Commercial");
    expect(C.validateIDP(validInput({ status: "paused" }), 1, [])).toContain(
      "Please choose In Progress or Completed",
    );
  });

  it("rejects a property type that does not match the category", () => {
    expect(
      C.validateIDP(
        validInput({ propertyType: "Office", category: "Residential" }),
        1,
        [],
      ),
    ).toContain("Office is not a Residential property type");
    expect(
      C.validateIDP(
        validInput({ propertyType: "Office", category: "Commercial" }),
        1,
        [],
      ),
    ).toEqual([]);
  });

  it("requires a budget greater than 0", () => {
    for (const budget of [0, -100, NaN]) {
      expect(C.validateIDP(validInput({ budget }), 1, [])).toContain(
        "Budget must be a number greater than 0",
      );
    }
  });

  it("requires at least one photo to remain", () => {
    expect(C.validateIDP(validInput(), 0, [])).toContain(
      "At least one photo is required",
    );
    expect(C.validateIDP(validInput(), 0, [newPhoto()])).toEqual([]);
  });

  it("rejects more than the maximum number of photos", () => {
    const photos = Array.from({ length: 2 }, () => newPhoto());
    expect(
      C.validateIDP(validInput(), C.MAX_PHOTOS_PER_IDP - 1, photos),
    ).toContain(`Too many photos (maximum ${C.MAX_PHOTOS_PER_IDP})`);
  });

  it("only accepts JPG, PNG or WebP images", () => {
    const pdf = newPhoto({
      fileName: "plan.pdf",
      dataURL: "data:application/pdf;base64,AAAA",
    });
    expect(C.validateIDP(validInput(), 1, [pdf])).toContain(
      "plan.pdf is not a JPG, PNG or WebP image",
    );
  });

  it("rejects a photo that is too large", () => {
    const big = newPhoto({
      fileName: "huge.jpg",
      dataURL: "data:image/jpeg;base64," + "A".repeat(C.MAX_PHOTO_LENGTH),
    });
    expect(C.validateIDP(validInput(), 1, [big])).toContain(
      "huge.jpg is too large",
    );
  });
});

describe("updateIDP", () => {
  it("keeps the IDP's creation date, even when every photo is replaced", async () => {
    // An older IDP created on 10 Jan, with one photo uploaded that day.
    writeTable("idp", [...readTable("idp"), { ...validInput({ status: "completed" }), idpID: 50, designerID: "D1", createdAt: "2026-01-10T08:00:00.000Z" }]);
    writeTable("idp_photo", [...readTable("idp_photo"), { photoID: "P50", idpID: 50, photoURL: "/demo-photos/industrial-kitchen.jpg", caption: "", sortOrder: 1, uploadedAt: "2026-01-10T08:01:00.000Z" }]);

    const result = await C.updateIDP("D1", 50, validInput({ title: "Updated title" }), ["P50"], [newPhoto()]);

    expect(result.success).toBe(true);
    const idp = await IDP.getIDP(50);
    expect(idp.title).toBe("Updated title");
    expect(idp.createdAt).toBe("2026-01-10T08:00:00.000Z");
  });

  it("saves the changed details and status", async () => {
    const result = await C.updateIDP(
      "D1",
      2,
      validInput({
        title: "  Industrial Loft (Phase 2)  ",
        status: "completed",
        budget: 55000,
        propertyType: "Landed",
      }),
      [],
      [],
    );
    expect(result).toEqual({ success: true, errors: [] });

    const saved = await IDP.getIDP(2);
    expect(saved).toMatchObject({
      title: "Industrial Loft (Phase 2)",
      status: "completed",
      budget: 55000,
      propertyType: "Landed",
      designerID: "D1",
    });
  });

  it("adds new photos after the existing ones, using the file name as caption", async () => {
    await C.updateIDP(
      "D1",
      2,
      validInput(),
      [],
      [
        newPhoto({ fileName: "kitchen.jpg" }),
        newPhoto({
          fileName: "bath.png",
          dataURL: "data:image/png;base64,BBBB",
        }),
      ],
    );
    const photos = await IDPPhoto.getPhotos(2);
    expect(photos.map((p) => p.caption)).toEqual(["Loft", "kitchen", "bath"]);
    expect(photos.map((p) => p.sortOrder)).toEqual([1, 2, 3]);
    expect(photos[2].photoURL).toBe("data:image/png;base64,BBBB");
  });

  it("removes photos, and the next photo becomes the main photo", async () => {
    await C.updateIDP(
      "D1",
      1,
      validInput({ style: "Scandinavian", propertyType: "HDB" }),
      ["P1"],
      [],
    );
    const photos = await IDPPhoto.getPhotos(1);
    expect(photos.map((p) => p.photoID)).toEqual(["P2"]);
  });

  it("can replace the only photo in one save", async () => {
    const result = await C.updateIDP(
      "D1",
      2,
      validInput(),
      ["P3"],
      [newPhoto()],
    );
    expect(result.success).toBe(true);
    expect((await IDPPhoto.getPhotos(2)).map((p) => p.caption)).toEqual([
      "kitchen",
    ]);
  });

  it("ignores photo IDs that belong to another IDP", async () => {
    await C.updateIDP("D1", 2, validInput(), ["P4"], []);
    expect((await IDPPhoto.getPhotos(3)).map((p) => p.photoID)).toEqual(["P4"]);
  });

  it("does not change another designer's IDP", async () => {
    const result = await C.updateIDP(
      "D1",
      3,
      validInput({ title: "Hacked" }),
      [],
      [],
    );
    expect(result).toEqual({
      success: false,
      errors: ["You can only update your own IDPs"],
    });
    expect((await IDP.getIDP(3))?.title).toBe("Minimalist Co-working Office");
  });

  it("reports a deleted IDP", async () => {
    expect(await C.updateIDP("D1", 4, validInput(), [], [])).toEqual({
      success: false,
      errors: ["IDP not found"],
    });
  });

  it("does not save anything when the input is invalid", async () => {
    const result = await C.updateIDP(
      "D1",
      2,
      validInput({ title: "", status: "completed" }),
      ["P3"],
      [],
    );
    expect(result.success).toBe(false);
    expect(result.errors).toEqual([
      "Title is required",
      "At least one photo is required",
    ]);
    expect((await IDP.getIDP(2))?.status).toBe("ongoing");
    expect((await IDPPhoto.getPhotos(2)).length).toBe(1);
  });

  it("undoes everything if the browser runs out of storage space", async () => {
    await IDPPhoto.getPhotos(2); // load the dummy data before storage "fills up"
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("full", "QuotaExceededError");
    });

    const result = await C.updateIDP(
      "D1",
      2,
      validInput({ status: "completed" }),
      [],
      [newPhoto()],
    );
    expect(result).toEqual({
      success: false,
      errors: [
        "Not enough storage space for these photos. Try fewer or smaller photos.",
      ],
    });

    vi.restoreAllMocks();
    expect((await IDP.getIDP(2))?.status).toBe("ongoing");
    expect((await IDPPhoto.getPhotos(2)).map((p) => p.photoID)).toEqual(["P3"]);
  });
});
