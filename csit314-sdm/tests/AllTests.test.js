// Unit tests for all controllers: one describe block per controller.
// Combined from the separate *.test.js files that were in this folder.

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { BrowseInteriorDesignersController } from "@/controller/BrowseInteriorDesignersController";
import { CreateIDPController } from "@/controller/CreateIDPController";
import { IDViewIDPDetailsController } from "@/controller/IDViewIDPDetailsController";
import { ViewFavouritesListController } from "@/controller/ViewFavouritesListController";
import { IDP } from "@/entity/IDP";
import { IDPPhoto } from "@/entity/IDPPhoto";
import { EditIDPController } from "@/controller/EditIDPController";
import { readTable, writeTable } from "@/entity/LocalStore";
import { GeneratePlatformReportController } from "@/controller/GeneratePlatformReportController";
import { GetDesignerRecommendationsController } from "@/controller/GetDesignerRecommendationsController";
import { IDPLike } from "@/entity/IDPLike";
import { ACRARegistry } from "@/entity/ACRARegistry";
import { HomeController } from "@/controller/HomeController";
import { toDateKey } from "@/lib/dates";
import { IDPPerformanceDashboardController } from "@/controller/IDPPerformanceDashboardController";
import { LikeIDPController } from "@/controller/LikeIDPController";
import { LoginController } from "@/controller/LoginController";
import { SessionController } from "@/controller/SessionController";
import { PromoteIDPController } from "@/controller/PromoteIDPController";
import { Promotion } from "@/entity/Promotion";
import React, { act } from "react";
import { createRoot } from "react-dom/client";
import NavBar from "@/boundary/NavBar";
import VerifyIDAccountsPg from "@/boundary/VerifyIDAccountsPg";
import { VerifyIDAccountsController } from "@/controller/VerifyIDAccountsController";
import { ViewIDPController } from "@/controller/ViewIDPController";

vi.mock('next/navigation', () => ({ usePathname: () => '/user-admin/verify-id-accounts', useRouter: () => ({replace: vi.fn()}) }));
vi.mock('next/link', async () => {
  const React = await import('react');
  return {default: ({children, ...props}) => React.createElement('a', props, children)};
});
vi.mock('@/boundary/DesignerNavBar', () => ({default: () => null}));

// Unit tests for BrowseInteriorDesignersController (Customer: Browse Interior Designers).
// Uses the dummy data in entity/LocalStore.js:
// - D1 Nordic Nest Interiors (Tampines): IDP 1 Scandinavian + IDP 2 Industrial, both Residential;
//   1 like (on IDP 2; C1's like on the deleted IDP 4 does not count). Joined 2026-03-01.
// - D2 Studio Linea (Raffles Place): IDP 3 Minimalist, Commercial; 2 likes. Joined 2026-05-10.
// - D3 Habitat & Co (Jurong East): no IDPs, 0 likes. Joined 2026-08-20.
// - D4 Fresh Start Design: verification still pending -> hidden.
// - D5 Urban Edge Interiors (Tampines): account suspended -> hidden.
// localStorage is cleared before each test, so every test starts from that same data.
describe("BrowseInteriorDesignersController", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  const browse = (filters, sortBy) =>
    BrowseInteriorDesignersController.browseDesigners(filters, sortBy);
  const ids = (result) => result.designers.map((d) => d.designerID);

  describe("browseDesigners - who is shown", () => {
    it("1. lists only verified designers with active accounts, sorted by name", async () => {
      const result = await browse({}, "name");
      expect(result.status).toBe("ok");
      expect(ids(result)).toEqual(["D3", "D1", "D2"]); // Habitat, Nordic, Studio
    });

    it("2. hides a designer whose verification is still pending", async () => {
      expect(ids(await browse({ keyword: "Fresh Start" }, "name"))).toEqual([]);
    });

    it("3. hides a suspended designer even though they were verified", async () => {
      expect(ids(await browse({ keyword: "Urban Edge" }, "name"))).toEqual([]);
    });
  });

  describe("browseDesigners - designer card", () => {
    it("4. combines company details, IDP count, styles and total likes", async () => {
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

    it("5. gives each card the main photo of the designer's IDPs", async () => {
      const result = await browse({}, "name");
      const d1 = result.designers.find((d) => d.designerID === "D1");
      expect(d1.samplePhotos.map((p) => p.idpID)).toEqual([1, 2]);
      expect(d1.samplePhotos[0].photoURL).toMatch(/^\/demo-photos\/.+\.jpg$/);
    });

    it("6. shows a designer with no IDPs with zero counts and no photos", async () => {
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
    it("7. matches the keyword against company name, ignoring case", async () => {
      expect(ids(await browse({ keyword: "linea" }, "name"))).toEqual(["D2"]);
    });

    it("8. matches the keyword against the description", async () => {
      expect(ids(await browse({ keyword: "offices" }, "name"))).toEqual(["D2"]);
    });

    it("9. filters by part of the location", async () => {
      // D5 is also in Tampines but is suspended.
      expect(ids(await browse({ location: "tamp" }, "name"))).toEqual(["D1"]);
    });

    it("10. filters by style using any of the designer's IDPs", async () => {
      expect(ids(await browse({ style: "Industrial" }, "name"))).toEqual(["D1"]);
      expect(ids(await browse({ style: "Minimalist" }, "name"))).toEqual(["D2"]);
    });

    it("11. filters by category", async () => {
      expect(ids(await browse({ category: "Commercial" }, "name"))).toEqual([
        "D2",
      ]);
    });

    it("12. combines filters", async () => {
      const result = await browse(
        { location: "Tampines", category: "Commercial" },
        "name",
      );
      expect(ids(result)).toEqual([]);
    });

    it("13. shows just one designer when asked for their designer ID (link from an IDP page)", async () => {
      expect(ids(await browse({ designerID: "D2" }, "name"))).toEqual(["D2"]);
    });

    it("14. still hides a hidden designer when asked for them by ID", async () => {
      expect(ids(await browse({ designerID: "D5" }, "name"))).toEqual([]);
    });

    it("15. matches a keyword that is a designer ID, ignoring case", async () => {
      expect(ids(await browse({ keyword: "d1" }, "name"))).toEqual(["D1"]);
    });

    it("16. returns an empty list when nothing matches", async () => {
      const result = await browse({ keyword: "no such firm" }, "name");
      expect(result).toEqual({ status: "ok", designers: [] });
    });
  });

  describe("browseDesigners - sorting", () => {
    it("17. sorts by most IDPs, ties by name", async () => {
      expect(ids(await browse({}, "mostIDPs"))).toEqual(["D1", "D2", "D3"]);
    });

    it("18. sorts by most liked, ties by name", async () => {
      expect(ids(await browse({}, "mostLiked"))).toEqual(["D2", "D1", "D3"]);
    });

    it("19. sorts by newest account first", async () => {
      expect(ids(await browse({}, "newest"))).toEqual(["D3", "D2", "D1"]);
    });
  });

  describe("validateFilters", () => {
    it("20. accepts empty filters and every sort option", () => {
      for (const sortBy of BrowseInteriorDesignersController.SORT_OPTIONS)
        expect(
          BrowseInteriorDesignersController.validateFilters({}, sortBy),
        ).toBeNull();
    });

    it("21. rejects an unknown sort option", async () => {
      expect(await browse({}, "cheapest")).toEqual({
        status: "invalid",
        message: "Invalid sort option",
      });
    });

    it("22. rejects an unknown style or category", async () => {
      expect((await browse({ style: "Gothic" }, "name")).status).toBe("invalid");
      expect((await browse({ category: "Industrial" }, "name")).status).toBe(
        "invalid",
      );
    });

    it("23. rejects a designer ID that is not text", async () => {
      expect(await browse({ designerID: 7 }, "name")).toEqual({
        status: "invalid",
        message: "Invalid designer",
      });
    });

    it("24. rejects a keyword that is too long", async () => {
      const result = await browse({ keyword: "x".repeat(101) }, "name");
      expect(result.status).toBe("invalid");
    });
  });
});

// Unit tests for CreateIDPController (Interior Designer: Create IDP).
// Uses the dummy data in entity/LocalStore.js:
// - designer D1 owns IDP 1 and 2, designer D2 owns IDP 3
// - IDP 4 was deleted, but customer C1's like of it is still stored
// localStorage is cleared before each test, so every test starts from that same data.
describe("CreateIDPController", () => {
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
    it("25. gives the same dropdown choices as Edit IDP", () => {
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
    it("26. returns no errors for valid input with a photo", () => {
      expect(C.validateIDP(validInput(), [photo()])).toEqual([]);
    });

    it("27. requires at least one photo", () => {
      expect(C.validateIDP(validInput(), [])).toContain(
        "At least one photo is required",
      );
    });

    it("28. allows at most 10 photos", () => {
      const photos = Array.from({ length: 11 }, () => photo());
      expect(C.validateIDP(validInput(), photos)).toContain(
        "Too many photos (maximum 10)",
      );
    });

    it("29. uses the same field rules as Edit IDP", () => {
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
    it("30. saves the IDP for the logged-in designer and returns its new ID", async () => {
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

    it("31. never reuses the ID of a deleted IDP", async () => {
      const first = await C.createIDP("D1", validInput(), [photo()]);
      const second = await C.createIDP("D1", validInput(), [photo()]);
      expect(first.idpID).toBe(5); // 4 was used by the deleted IDP
      expect(second.idpID).toBe(6);
    });

    it("32. does not show up in a customer's favourites just because an old like used the same ID", async () => {
      await C.createIDP("D1", validInput(), [photo()]);
      const favourites = await ViewFavouritesListController.getFavourites("C1");
      expect(favourites.map((f) => f.idpID)).toEqual([2]);
    });

    it("33. saves the photos in order, first one as the main photo", async () => {
      const result = await C.createIDP("D1", validInput(), [
        photo("balcony.jpg"),
        photo("lights.png"),
      ]);
      const photos = await IDPPhoto.getPhotos(result.idpID);
      expect(photos.map((p) => p.caption)).toEqual(["balcony", "lights"]);
      expect(photos.map((p) => p.sortOrder)).toEqual([1, 2]);
    });

    it("34. adds the new IDP to the designer's My Projects list", async () => {
      const result = await C.createIDP("D1", validInput(), [photo()]);
      const list = await IDViewIDPDetailsController.getMyIDPs("D1");
      expect(list.map((item) => item.idpID)).toContain(result.idpID);
    });

    it("35. does not save anything when the input is invalid", async () => {
      const result = await C.createIDP("D1", validInput({ description: "" }), []);
      expect(result).toEqual({
        success: false,
        errors: ["Description is required", "At least one photo is required"],
      });
      expect((await IDP.getIDPsByDesigner("D1")).length).toBe(2);
    });

    it("36. undoes everything if the browser runs out of storage space", async () => {
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
});

// Unit tests for EditIDPController (Interior Designer: Edit IDP).
// Uses the dummy data in entity/LocalStore.js:
// - IDP 1 (D1, completed) has photos P1 (main) and P2
// - IDP 2 (D1, ongoing) has photo P3
// - IDP 3 belongs to designer D2
// localStorage is cleared before each test, so every test starts from that same data.
describe("EditIDPController", () => {
  const C = EditIDPController;

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

  describe("getIDPForEdit", () => {
    it("37. returns the IDP and photos to its owner", async () => {
      const result = await C.getIDPForEdit("D1", 2);
      expect(result.status).toBe("ok");
      expect(result.details?.idp.title).toBe("Industrial Loft Conversion");
      expect(result.details?.photos.map((p) => p.photoID)).toEqual(["P3"]);
    });

    it("38. blocks another designer", async () => {
      expect(await C.getIDPForEdit("D1", 3)).toEqual({ status: "notOwner" });
    });

    it("39. reports a deleted IDP as not found", async () => {
      expect(await C.getIDPForEdit("D1", 4)).toEqual({ status: "notFound" });
    });
  });

  describe("getEditFormData", () => {
    it("40. gives the choices for each dropdown", () => {
      const data = C.getEditFormData();
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
    it("41. returns no errors for valid input", () => {
      expect(C.validateIDP(validInput(), 1, [])).toEqual([]);
    });

    it("42. requires a title", () => {
      expect(C.validateIDP(validInput({ title: "  " }), 1, [])).toContain(
        "Title is required",
      );
    });

    it("43. rejects a title that is too long", () => {
      const title = "a".repeat(C.MAX_TITLE_LENGTH + 1);
      expect(C.validateIDP(validInput({ title }), 1, [])).toContain(
        `Title must be at most ${C.MAX_TITLE_LENGTH} characters`,
      );
    });

    it("44. requires a description", () => {
      expect(C.validateIDP(validInput({ description: "" }), 1, [])).toContain(
        "Description is required",
      );
    });

    it("45. rejects a description that is too long", () => {
      const description = "a".repeat(C.MAX_DESCRIPTION_LENGTH + 1);
      expect(C.validateIDP(validInput({ description }), 1, [])).toContain(
        `Description must be at most ${C.MAX_DESCRIPTION_LENGTH} characters`,
      );
    });

    it("46. only accepts styles, categories and statuses from the list", () => {
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

    it("47. rejects a property type that does not match the category", () => {
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

    it("48. requires a budget greater than 0", () => {
      for (const budget of [0, -100, NaN]) {
        expect(C.validateIDP(validInput({ budget }), 1, [])).toContain(
          "Budget must be a number greater than 0",
        );
      }
    });

    it("49. requires at least one photo to remain", () => {
      expect(C.validateIDP(validInput(), 0, [])).toContain(
        "At least one photo is required",
      );
      expect(C.validateIDP(validInput(), 0, [newPhoto()])).toEqual([]);
    });

    it("50. rejects more than the maximum number of photos", () => {
      const photos = Array.from({ length: 2 }, () => newPhoto());
      expect(
        C.validateIDP(validInput(), C.MAX_PHOTOS_PER_IDP - 1, photos),
      ).toContain(`Too many photos (maximum ${C.MAX_PHOTOS_PER_IDP})`);
    });

    it("51. only accepts JPG, PNG or WebP images", () => {
      const pdf = newPhoto({
        fileName: "plan.pdf",
        dataURL: "data:application/pdf;base64,AAAA",
      });
      expect(C.validateIDP(validInput(), 1, [pdf])).toContain(
        "plan.pdf is not a JPG, PNG or WebP image",
      );
    });

    it("52. rejects a photo that is too large", () => {
      const big = newPhoto({
        fileName: "huge.jpg",
        dataURL: "data:image/jpeg;base64," + "A".repeat(C.MAX_PHOTO_LENGTH),
      });
      expect(C.validateIDP(validInput(), 1, [big])).toContain(
        "huge.jpg is too large",
      );
    });
  });

  describe("editIDP", () => {
    it("53. keeps the IDP's creation date, even when every photo is replaced", async () => {
      // An older IDP created on 10 Jan, with one photo uploaded that day.
      writeTable("idp", [...readTable("idp"), { ...validInput({ status: "completed" }), idpID: 50, designerID: "D1", createdAt: "2026-01-10T08:00:00.000Z" }]);
      writeTable("idp_photo", [...readTable("idp_photo"), { photoID: "P50", idpID: 50, photoURL: "/demo-photos/industrial-kitchen.jpg", caption: "", sortOrder: 1, uploadedAt: "2026-01-10T08:01:00.000Z" }]);

      const result = await C.editIDP("D1", 50, validInput({ title: "Updated title" }), ["P50"], [newPhoto()]);

      expect(result.success).toBe(true);
      const idp = await IDP.getIDP(50);
      expect(idp.title).toBe("Updated title");
      expect(idp.createdAt).toBe("2026-01-10T08:00:00.000Z");
    });

    it("54. saves the changed details and status", async () => {
      const result = await C.editIDP(
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

    it("55. adds new photos after the existing ones, using the file name as caption", async () => {
      await C.editIDP(
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

    it("56. removes photos, and the next photo becomes the main photo", async () => {
      await C.editIDP(
        "D1",
        1,
        validInput({ style: "Scandinavian", propertyType: "HDB" }),
        ["P1"],
        [],
      );
      const photos = await IDPPhoto.getPhotos(1);
      expect(photos.map((p) => p.photoID)).toEqual(["P2"]);
    });

    it("57. can replace the only photo in one save", async () => {
      const result = await C.editIDP(
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

    it("58. ignores photo IDs that belong to another IDP", async () => {
      await C.editIDP("D1", 2, validInput(), ["P4"], []);
      expect((await IDPPhoto.getPhotos(3)).map((p) => p.photoID)).toEqual(["P4"]);
    });

    it("59. does not change another designer's IDP", async () => {
      const result = await C.editIDP(
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

    it("60. reports a deleted IDP", async () => {
      expect(await C.editIDP("D1", 4, validInput(), [], [])).toEqual({
        success: false,
        errors: ["IDP not found"],
      });
    });

    it("61. does not save anything when the input is invalid", async () => {
      const result = await C.editIDP(
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

    it("62. undoes everything if the browser runs out of storage space", async () => {
      await IDPPhoto.getPhotos(2); // load the dummy data before storage "fills up"
      vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
        throw new DOMException("full", "QuotaExceededError");
      });

      const result = await C.editIDP(
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
});

describe("GeneratePlatformReportController", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  describe("validateReportRequest", () => {
    afterEach(() => vi.useRealTimers());

    it("63. accepts today's date early in the morning (before 8 am in Singapore)", () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date(2026, 10, 10, 1, 30)); // 10 Nov 2026, 1:30 am local time
      expect(GeneratePlatformReportController.validateReportRequest("daily", "2026-11-10")).toBeNull();
    });

    it("64. refuses a date after today", () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date(2026, 10, 10, 23, 30)); // 10 Nov 2026, 11:30 pm local time
      expect(GeneratePlatformReportController.validateReportRequest("daily", "2026-11-11")).toBe(
        "Reference date cannot be in the future",
      );
    });
  });

  describe("calculateChange", () => {
    const change = (current, previous) => GeneratePlatformReportController.calculateChange(current, previous);

    it("65. gives the rise or fall as a whole percentage of the previous period", () => {
      expect(change(12, 10)).toEqual({ direction: "up", percent: 20 });
      expect(change(5, 20)).toEqual({ direction: "down", percent: 75 });
      expect(change(2, 3)).toEqual({ direction: "down", percent: 33 });
    });

    it("66. says 'same' when nothing changed, including 0 to 0", () => {
      expect(change(7, 7)).toEqual({ direction: "same", percent: 0 });
      expect(change(0, 0)).toEqual({ direction: "same", percent: 0 });
    });

    it("67. has no percentage when the previous period was 0", () => {
      expect(change(4, 0)).toEqual({ direction: "up", percent: null });
    });
  });

  describe("generateReport", () => {
    it("68. counts records by their calendar date, including the end date", async () => {
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

    it("69. gives the same whole-month range for any day of that month (the page sends the 1st)", () => {
      const fromFirst = GeneratePlatformReportController.calculateDateRange("monthly", "2026-10-01");
      const fromLast = GeneratePlatformReportController.calculateDateRange("monthly", "2026-10-31");
      expect(fromFirst).toEqual(fromLast);
      expect(fromFirst.startDate.getDate()).toBe(1);
      expect(fromFirst.endDate.getDate()).toBe(31);
      expect(fromFirst.endDate.getMonth()).toBe(9); // October
    });

    it("70. returns the period it was generated for, so the page labels the columns correctly", async () => {
      const report = await GeneratePlatformReportController.generateReport("weekly", "2026-11-05");
      expect(report.period).toBe("weekly");
    });

    it("71. assigns a creation timestamp when a new IDP is saved", async () => {
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

    it("72. counts older IDPs using their first saved photo date", async () => {
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
});

// Unit tests for GetDesignerRecommendationsController (Customer: Get Designer Recommendations).
// Uses the dummy data in entity/LocalStore.js:
// - D1 Nordic Nest Interiors: IDP 1 Scandinavian, IDP 2 Industrial; 1 like in total.
// - D2 Studio Linea: IDP 3 Minimalist; 2 likes.
// - D3 Habitat & Co: no IDPs; 0 likes.
// - D4 pending verification, D5 suspended: never recommended.
// - Customer C1 likes IDP 2 and the deleted IDP 4, so C1 has only 1 like that counts.
// Tests that need more IDPs or likes add them with the entity methods.
// localStorage is cleared before each test, so every test starts from that same data.
describe("GetDesignerRecommendationsController", () => {
  const C = GetDesignerRecommendationsController;
  beforeEach(() => {
    window.localStorage.clear();
  });

  const ids = (result) => result.recommendations.map((r) => r.designerID);

  async function addIDP(designerID, style) {
    const idp = await IDP.createIDP({
      designerID,
      title: `${style} test project`,
      description: "Test",
      style,
      propertyType: "Condo",
      category: "Residential",
      budget: 10000,
      status: "completed",
    });
    return idp.idpID;
  }

  async function likeAll(customerID, idpIDs) {
    for (const idpID of idpIDs) await IDPLike.addLike(customerID, idpID);
  }

  describe("getRecommendations - cold start", () => {
    it("73. shows the most-liked verified designers when the customer has too few likes", async () => {
      const result = await C.getRecommendations("C1");
      expect(result.status).toBe("coldStart");
      expect(ids(result)).toEqual(["D2", "D1", "D3"]);
    });

    it("74. does not count likes on deleted IDPs", async () => {
      // C1 has 2 likes but IDP 4 was deleted, so only 1 counts.
      const result = await C.getRecommendations("C1");
      expect(result.likesNeeded).toBe(2);
    });

    it("75. asks a customer with no likes for 3 likes", async () => {
      const result = await C.getRecommendations("C_NEW");
      expect(result).toMatchObject({ status: "coldStart", likesNeeded: 3 });
    });

    it("76. gives cold start picks a popularity reason", async () => {
      const result = await C.getRecommendations("C1");
      expect(result.recommendations[0].reason).toBe(
        "Popular with customers: 2 likes",
      );
      expect(result.recommendations[2].reason).toBe("New on the platform");
    });
  });

  describe("getRecommendations - personalised", () => {
    it("77. recommends designers whose IDPs match the liked styles, best match first", async () => {
      await likeAll("C1", [1, 3]); // C1 now likes Industrial, Scandinavian, Minimalist
      const result = await C.getRecommendations("C1");
      expect(result.status).toBe("personalised");
      expect(ids(result)).toEqual(["D1", "D2"]); // D1 matches 2 styles, D2 matches 1
    });

    it("78. leaves out designers with no matching style", async () => {
      await likeAll("C1", [1, 3]);
      const result = await C.getRecommendations("C1");
      expect(ids(result)).not.toContain("D3");
    });

    it("79. explains each pick with the liked styles it matched", async () => {
      await likeAll("C1", [1, 3]);
      const result = await C.getRecommendations("C1");
      expect(result.recommendations[0].reason).toBe(
        "Because you liked Scandinavian and Industrial projects",
      );
      expect(result.recommendations[1].reason).toBe(
        "Because you liked Minimalist projects",
      );
    });

    it("80. ranks a designer with more IDPs in the customer's favourite style higher", async () => {
      const a = await addIDP("D3", "Minimalist");
      const b = await addIDP("D3", "Minimalist");
      await likeAll("C9", [3, a, b]); // all Minimalist
      const result = await C.getRecommendations("C9");
      expect(ids(result)).toEqual(["D3", "D2"]); // D3 has 2 Minimalist IDPs, D2 has 1
      expect(result.recommendations[0].score).toBe(2);
    });

    it("81. never recommends unverified or suspended designers", async () => {
      const pending = await addIDP("D4", "Minimalist");
      const suspended = await addIDP("D5", "Minimalist");
      await likeAll("C9", [3, pending, suspended]);
      const result = await C.getRecommendations("C9");
      expect(ids(result)).toEqual(["D2"]);
    });

    it("82. falls back to popular designers when no verified designer matches", async () => {
      const ids5 = [
        await addIDP("D5", "Tropical"),
        await addIDP("D5", "Tropical"),
        await addIDP("D5", "Tropical"),
      ];
      await likeAll("C9", ids5); // only likes a suspended designer's style
      const result = await C.getRecommendations("C9");
      expect(result).toMatchObject({ status: "coldStart", likesNeeded: 0 });
      expect(ids(result)).toEqual(["D2", "D1", "D3"]);
    });

    it("83. gives each pick its top styles and sample photos", async () => {
      await likeAll("C1", [1, 3]);
      const result = await C.getRecommendations("C1");
      const d1 = result.recommendations[0];
      expect(d1.topStyles).toEqual(["Industrial", "Scandinavian"]);
      expect(d1.samplePhotos.map((p) => p.idpID)).toEqual([1, 2]);
    });
  });

  describe("calculateStyleWeights", () => {
    it("84. weights each style by its share of the likes", () => {
      const weights = C.calculateStyleWeights([
        { style: "Scandinavian" },
        { style: "Scandinavian" },
        { style: "Minimalist" },
        { style: "Industrial" },
      ]);
      expect(weights).toEqual({
        Scandinavian: 0.5,
        Minimalist: 0.25,
        Industrial: 0.25,
      });
    });

    it("85. returns no weights for no likes", () => {
      expect(C.calculateStyleWeights([])).toEqual({});
    });
  });

  describe("calculateDesignerScore", () => {
    it("86. adds up the weight of every IDP's style", () => {
      const weights = { Scandinavian: 0.5, Minimalist: 0.25 };
      const score = C.calculateDesignerScore(weights, [
        { style: "Scandinavian" },
        { style: "Scandinavian" },
        { style: "Minimalist" },
        { style: "Tropical" },
      ]);
      expect(score).toBe(1.25);
    });
  });

  describe("rankDesigners", () => {
    const d = (designerID, score, totalLikes, companyName = designerID) => ({
      designerID,
      score,
      totalLikes,
      companyName,
    });

    it("87. sorts by score, then total likes, then name", () => {
      const ranked = C.rankDesigners([
        d("A", 0.5, 0, "Zebra Studio"),
        d("B", 1, 0),
        d("C", 0.5, 3),
        d("E", 0.5, 0, "Aardvark Design"),
      ]);
      expect(ranked.map((x) => x.designerID)).toEqual(["B", "C", "E", "A"]);
    });

    it("88. drops designers with score 0 and keeps at most 5", () => {
      const ranked = C.rankDesigners([
        d("Z", 0, 9),
        ...[1, 2, 3, 4, 5, 6, 7].map((n) => d(`D${n}`, n, 0)),
      ]);
      expect(ranked.map((x) => x.designerID)).toEqual([
        "D7",
        "D6",
        "D5",
        "D4",
        "D3",
      ]);
    });
  });
});

// Unit tests for HomeController (Customer: home page IDP feed).
// Uses the dummy data in entity/LocalStore.js:
// - IDP 1 and IDP 2 by D1 Nordic Nest Interiors, IDP 3 by D2 Studio Linea
// - IDP 4 was deleted
// localStorage is cleared before each test, so every test starts from that same data.
describe("HomeController", () => {
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
    it("89. returns the first page of IDPs in ID order", async () => {
      const page = await HomeController.getIDPFeed(0, 2);
      expect(idpIDs(page)).toEqual([1, 2]);
      expect(page.hasMore).toBe(true);
    });

    it("90. continues where the last page stopped, and says when there are no more", async () => {
      const page = await HomeController.getIDPFeed(2, 2);
      expect(idpIDs(page)).toEqual([3]);
      expect(page.hasMore).toBe(false);
    });

    it("91. leaves out deleted IDPs", async () => {
      const page = await HomeController.getIDPFeed(0, 10);
      expect(idpIDs(page)).toEqual([1, 2, 3]);
    });

    it("92. gives each card its title, main photo, style and designer", async () => {
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

    it("93. names the right designer for each IDP", async () => {
      const page = await HomeController.getIDPFeed(0, 3);
      expect(page.cards.map((c) => c.companyName)).toEqual([
        "Nordic Nest Interiors",
        "Nordic Nest Interiors",
        "Studio Linea",
      ]);
    });

    it("94. returns an empty last page past the end", async () => {
      expect(await HomeController.getIDPFeed(50, 12)).toEqual({ cards: [], hasMore: false });
    });

    it("95. leaves out IDPs whose designer is suspended (D5) or still pending verification (D4)", async () => {
      addIDPsBy(["D5", "D4"]);
      const page = await HomeController.getIDPFeed(0, 10);
      expect(idpIDs(page)).toEqual([1, 2, 3]);
      expect(page.hasMore).toBe(false);
    });

    it("96. uses a page of PAGE_SIZE when no size is given", async () => {
      expect(HomeController.PAGE_SIZE).toBe(12);
      const page = await HomeController.getIDPFeed(0);
      expect(page.cards.length).toBeLessThanOrEqual(HomeController.PAGE_SIZE);
    });
  });

  describe("featured IDPs", () => {
    const today = toDateKey(new Date());
    const promote = (rows) => writeTable("promotion", rows.map((r, i) => ({ promotionID: i + 1, createdBy: "M12345", ...r })));

    it("97. lists the IDPs with a promotion running today, as cards", async () => {
      promote([{ idpID: 3, startDate: today, endDate: "2099-12-31" }]);
      const featured = await HomeController.getFeaturedIDPs();
      expect(featured.map((c) => c.idpID)).toEqual([3]);
      expect(featured[0]).toMatchObject({ title: expect.any(String), designerID: "D2", companyName: "Studio Linea" });
    });

    it("98. ignores promotions that have finished or not started, and deleted IDPs", async () => {
      promote([
        { idpID: 3, startDate: "2000-01-01", endDate: "2000-01-31" },
        { idpID: 2, startDate: "2099-01-01", endDate: "2099-01-31" },
        { idpID: 4, startDate: today, endDate: "2099-12-31" },
      ]);
      expect(await HomeController.getFeaturedIDPs()).toEqual([]);
      expect(idpIDs(await HomeController.getIDPFeed(0, 10))).toEqual([1, 2, 3]);
    });

    it("99. leaves out promoted IDPs whose designer is suspended or not verified", async () => {
      addIDPsBy(["D5", "D4"]);
      promote([
        { idpID: 50, startDate: today, endDate: "2099-12-31" },
        { idpID: 51, startDate: today, endDate: "2099-12-31" },
      ]);
      expect(await HomeController.getFeaturedIDPs()).toEqual([]);
    });

    it("100. leaves featured IDPs out of the main feed, so no card shows twice", async () => {
      promote([{ idpID: 1, startDate: today, endDate: "2099-12-31" }]);
      const page = await HomeController.getIDPFeed(0, 1);
      expect(idpIDs(page)).toEqual([2]);
      expect(page.hasMore).toBe(true);
      const page2 = await HomeController.getIDPFeed(1, 1);
      expect(idpIDs(page2)).toEqual([3]);
      expect(page2.hasMore).toBe(false);
    });
  });
});

// Unit tests for IDPPerformanceDashboardController (Interior Designer: IDP Performance Dashboard).
// Uses the small hand-made data in entity/LocalStore.js (the big generated dummy data is
// switched off for tests in tests/setup.js):
// - designer D1 owns IDP 1 and IDP 2, designer D2 owns IDP 3
// Each test writes its own view and like events, so the numbers are exact.
describe("IDPPerformanceDashboardController", () => {
  const C = IDPPerformanceDashboardController;
  // Events at 04:00 UTC = 12:00 noon in Singapore, so the date is the same in both time zones.
  const at = (date) => `${date}T04:00:00.000Z`;
  const view = (id, idpID, date) => ({ viewID: id, idpID, customerID: "C1", viewedAt: at(date) });
  const like = (id, idpID, date) => ({ likeID: id, idpID, customerID: "C1", likedAt: at(date) });

  beforeEach(() => {
    window.localStorage.clear();
  });

  describe("validateDateRange", () => {
    it("101. accepts a normal range", () => {
      expect(C.validateDateRange("2026-10-01", "2026-10-31")).toBe(true);
    });

    it("102. accepts a one-day range", () => {
      expect(C.validateDateRange("2026-10-10", "2026-10-10")).toBe(true);
    });

    it("103. rejects an end date before the start date", () => {
      expect(C.validateDateRange("2026-10-31", "2026-10-01")).toBe(false);
    });

    it("104. rejects missing or invalid dates", () => {
      expect(C.validateDateRange("", "2026-10-01")).toBe(false);
      expect(C.validateDateRange("2026-10-01", "not a date")).toBe(false);
    });
  });

  describe("calculateLikeRate", () => {
    it("105. is likes divided by views", () => {
      expect(C.calculateLikeRate(18, 120)).toBe(0.15);
    });

    it("106. is 0 when there are no views, instead of dividing by zero", () => {
      expect(C.calculateLikeRate(0, 0)).toBe(0);
      expect(C.calculateLikeRate(3, 0)).toBe(0);
    });
  });

  describe("groupEventsByDay", () => {
    it("107. counts views and likes per day, in date order", () => {
      const views = [view("V1", 1, "2026-10-11"), view("V2", 1, "2026-10-10"), view("V3", 1, "2026-10-11")];
      const likes = [like("L9", 1, "2026-10-11")];
      expect(C.groupEventsByDay(views, likes)).toEqual([
        { date: "2026-10-10", views: 1, likes: 0 },
        { date: "2026-10-11", views: 2, likes: 1 },
      ]);
    });
  });

  describe("fillMissingDays", () => {
    it("108. adds 0-view, 0-like days so every day in the range is there", () => {
      const filled = C.fillMissingDays([{ date: "2026-10-11", views: 2, likes: 1 }], "2026-10-10", "2026-10-12");
      expect(filled).toEqual([
        { date: "2026-10-10", views: 0, likes: 0 },
        { date: "2026-10-11", views: 2, likes: 1 },
        { date: "2026-10-12", views: 0, likes: 0 },
      ]);
    });
  });

  describe("rankIDPs", () => {
    it("109. ranks by total likes, then total views to break ties", () => {
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

    it("110. returns null for a designer with no IDPs", async () => {
      expect(await C.getDashboard("D99", "2026-10-10", "2026-10-12")).toBeNull();
    });

    it("111. counts only this designer's events inside the date range", async () => {
      const dashboard = await C.getDashboard("D1", "2026-10-10", "2026-10-12");
      const byID = Object.fromEntries(dashboard.idpStats.map((s) => [s.idpID, s]));

      expect(Object.keys(byID)).toEqual(["1", "2"]);
      expect(byID[1]).toMatchObject({ totalViews: 3, totalLikes: 1 });
      expect(byID[2]).toMatchObject({ totalViews: 1, totalLikes: 2 });
    });

    it("112. gives every IDP a day-by-day count with no gaps", async () => {
      const dashboard = await C.getDashboard("D1", "2026-10-10", "2026-10-12");
      const idp1 = dashboard.idpStats.find((s) => s.idpID === 1);
      expect(idp1.dailyCounts).toEqual([
        { date: "2026-10-10", views: 2, likes: 0 },
        { date: "2026-10-11", views: 0, likes: 0 },
        { date: "2026-10-12", views: 1, likes: 1 },
      ]);
    });

    it("113. adds up all IDPs per day for the chart", async () => {
      const dashboard = await C.getDashboard("D1", "2026-10-10", "2026-10-12");
      expect(dashboard.dailyTotals).toEqual([
        { date: "2026-10-10", views: 2, likes: 0 },
        { date: "2026-10-11", views: 1, likes: 1 },
        { date: "2026-10-12", views: 1, likes: 2 },
      ]);
    });

    it("114. works out each IDP's like rate and ranks them", async () => {
      const dashboard = await C.getDashboard("D1", "2026-10-10", "2026-10-12");
      expect(dashboard.idpStats.map((s) => ({ idpID: s.idpID, rank: s.rank, likeRate: s.likeRate }))).toEqual([
        { idpID: 2, rank: 1, likeRate: 2 }, // 2 likes, 1 view
        { idpID: 1, rank: 2, likeRate: 1 / 3 }, // 1 like, 3 views
      ]);
    });

    it("115. still lists IDPs with no activity, with 0 views, 0 likes and a 0 like rate", async () => {
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
});

// Unit tests for IDViewIDPDetailsController (Interior Designer: View IDP details).
// Uses the dummy data in entity/LocalStore.js:
// - IDP 1 and IDP 2 belong to designer D1
// - IDP 3 belongs to designer D2
// - IDP 4 was deleted
// localStorage is cleared before each test, so every test starts from that same data.
describe("IDViewIDPDetailsController", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  describe("getMyIDPs", () => {
    it("116. lists only the logged-in designer's own IDPs", async () => {
      const list = await IDViewIDPDetailsController.getMyIDPs("D1");
      expect(list.map((item) => item.idpID).sort()).toEqual([1, 2]);
    });

    it("117. lists In Progress IDPs first, then Completed", async () => {
      // IDP 1 is completed and IDP 2 is ongoing, so 2 comes first.
      const list = await IDViewIDPDetailsController.getMyIDPs("D1");
      expect(list.map((item) => item.status)).toEqual(["ongoing", "completed"]);
      expect(list.map((item) => item.idpID)).toEqual([2, 1]);
    });

    it("118. gives each IDP its status and main photo", async () => {
      const list = await IDViewIDPDetailsController.getMyIDPs("D1");
      const idp1 = list.find((item) => item.idpID === 1);
      expect(idp1).toMatchObject({
        idpID: 1,
        status: "completed",
        propertyType: "HDB",
      });
      expect(idp1.mainPhotoURL).toMatch(/^\/demo-photos\/.+\.jpg$/);
      expect(list.find((item) => item.idpID === 2)).toMatchObject({ status: "ongoing" });
    });

    it("119. does not show other designers' IDPs", async () => {
      const list = await IDViewIDPDetailsController.getMyIDPs("D2");
      expect(list.map((item) => item.idpID)).toEqual([3]);
    });

    it("120. returns an empty list for a designer with no IDPs", async () => {
      expect(await IDViewIDPDetailsController.getMyIDPs("D99")).toEqual([]);
    });
  });

  describe("getStatusLabel", () => {
    it("121. shows ongoing as In Progress", () => {
      expect(IDViewIDPDetailsController.getStatusLabel("ongoing")).toBe(
        "In Progress",
      );
      expect(IDViewIDPDetailsController.getStatusLabel("completed")).toBe(
        "Completed",
      );
    });
  });

  describe("viewIDPDetails", () => {
    it("122. returns the IDP and its photos to the designer who owns it", async () => {
      const result = await IDViewIDPDetailsController.viewIDPDetails("D1", 1);

      expect(result.status).toBe("ok");
      expect(result.details?.idp.title).toBe("Bright Scandinavian Living Room");
      expect(result.details?.idp.status).toBe("completed");
      expect(result.details?.photos.map((p) => p.photoID)).toEqual(["P1", "P2"]);
    });

    it("123. returns photos in display order, main photo first", async () => {
      const result = await IDViewIDPDetailsController.viewIDPDetails("D1", 1);
      expect(result.details?.photos.map((p) => p.sortOrder)).toEqual([1, 2]);
    });

    it("124. works for every IDP the designer owns", async () => {
      const result = await IDViewIDPDetailsController.viewIDPDetails("D1", 2);
      expect(result.status).toBe("ok");
      expect(result.details?.idp.title).toBe("Industrial Loft Conversion");
    });

    it("125. blocks a designer from viewing another designer's IDP", async () => {
      const result = await IDViewIDPDetailsController.viewIDPDetails("D1", 3);
      expect(result).toEqual({ status: "notOwner" });
    });

    it("126. reports a deleted IDP as not found", async () => {
      const result = await IDViewIDPDetailsController.viewIDPDetails("D1", 4);
      expect(result).toEqual({ status: "notFound" });
    });

    it("127. reports an IDP that never existed as not found", async () => {
      const result = await IDViewIDPDetailsController.viewIDPDetails("D1", 999);
      expect(result).toEqual({ status: "notFound" });
    });
  });
});

// Unit tests for LikeIDPController (Customer: Like IDP / Unlike IDP).
describe("LikeIDPController", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  const favouriteIDs = async (customerID) =>
    (await ViewFavouritesListController.getFavourites(customerID)).map((f) => f.idpID);

  describe("likeIDP / unlikeIDP", () => {
    it("128. adds an IDP to favourites once only", async () => {
      await LikeIDPController.unlikeIDP("C1", 2); // start from a known state
      expect(await LikeIDPController.likeIDP("C1", 2)).toBe(true);
      expect(await LikeIDPController.likeIDP("C1", 2)).toBe(false);
      expect(await LikeIDPController.isLiked("C1", 2)).toBe(true);
    });

    it("129. removes an IDP from the favourites list", async () => {
      await LikeIDPController.likeIDP("C1", 2);
      expect(await favouriteIDs("C1")).toContain(2);

      expect(await LikeIDPController.unlikeIDP("C1", 2)).toBe(true);
      expect(await LikeIDPController.isLiked("C1", 2)).toBe(false);
      expect(await favouriteIDs("C1")).not.toContain(2);
    });

    it("130. returns false when unliking an IDP that was not liked", async () => {
      await LikeIDPController.unlikeIDP("C1", 2);
      expect(await LikeIDPController.unlikeIDP("C1", 2)).toBe(false);
    });

    it("131. only removes the given customer's like", async () => {
      await LikeIDPController.likeIDP("C1", 2);
      await LikeIDPController.likeIDP("C2", 2);
      await LikeIDPController.unlikeIDP("C1", 2);
      expect(await LikeIDPController.isLiked("C2", 2)).toBe(true);
    });

    it("132. is never liked when nobody is logged in", async () => {
      expect(await LikeIDPController.isLiked(null, 2)).toBe(false);
    });
  });
});

// Unit tests for LoginController (all actors: Log in / Log out).
// Uses the hand-made accounts in entity/LocalStore.js:
// - customers C1, C2, C3 and designers D1, D2, D3 are active demo accounts
// - designer D4 is still waiting for verification, designer D5 is suspended
// localStorage is cleared before each test, so every test starts logged out with the same data.
describe("LoginController", () => {
  const PASSWORD = "password123";

  beforeEach(() => {
    window.localStorage.clear();
  });

  describe("login", () => {
    it("133. logs in a customer and sends them to the customer home page", async () => {
      const result = await LoginController.login("customer1@example.com", PASSWORD);
      expect(result).toEqual({ status: "ok", profileID: "customer", homePage: "/" });
      expect(SessionController.getLoggedInCustomerID()).toBe("C1");
      expect(SessionController.getLoggedInDesignerID()).toBeNull();
    });

    it("134. logs in a designer and sends them to My IDPs", async () => {
      const result = await LoginController.login("hello@nordicnest.example.com", PASSWORD);
      expect(result).toEqual({ status: "ok", profileID: "designer", homePage: "/designer/idp" });
      expect(SessionController.getLoggedInDesignerID()).toBe("D1");
      expect(SessionController.getLoggedInCustomerID()).toBeNull();
    });

    it("135. logs in the platform manager and sends them to the platform report", async () => {
      const result = await LoginController.login("manager@example.com", PASSWORD);
      expect(result).toEqual({
        status: "ok",
        profileID: "platformManager",
        homePage: "/platform-manager/report",
      });
      expect(SessionController.getLoggedInAccount()).toEqual({
        accountID: "M12345",
        profileID: "platformManager",
      });
    });

    it("136. works for all three demo customers and all three demo designers", async () => {
      const accounts = {
        "customer1@example.com": "C1",
        "customer2@example.com": "C2",
        "customer3@example.com": "C3",
        "hello@nordicnest.example.com": "D1",
        "studio@linea.example.com": "D2",
        "team@habitatco.example.com": "D3",
      };
      for (const [email, accountID] of Object.entries(accounts)) {
        expect((await LoginController.login(email, PASSWORD)).status).toBe("ok");
        expect(SessionController.getLoggedInAccount().accountID).toBe(accountID);
      }
    });

    it("137. ignores upper case and spaces around the email", async () => {
      const result = await LoginController.login("  Customer1@Example.com ", PASSWORD);
      expect(result.status).toBe("ok");
    });

    it("138. asks for both fields when one is empty", async () => {
      expect(await LoginController.login("", PASSWORD)).toEqual({
        status: "invalid",
        message: "Please enter your email and password",
      });
      expect((await LoginController.login("customer1@example.com", "")).status).toBe("invalid");
      expect(SessionController.getLoggedInAccount()).toBeNull();
    });

    it("139. rejects a wrong password without saying which field was wrong", async () => {
      expect(await LoginController.login("customer1@example.com", "wrong")).toEqual({
        status: "invalid",
        message: "Incorrect email or password",
      });
      expect(SessionController.getLoggedInAccount()).toBeNull();
    });

    it("140. gives the same message for an email that is not registered", async () => {
      const result = await LoginController.login("nobody@example.com", PASSWORD);
      expect(result.message).toBe("Incorrect email or password");
    });

    it("141. blocks a designer whose account is still waiting for verification", async () => {
      expect(await LoginController.login("hi@freshstart.example.com", PASSWORD)).toEqual({
        status: "blocked",
        message: "Your account is waiting for verification",
      });
      expect(SessionController.getLoggedInAccount()).toBeNull();
    });

    it("142. blocks a suspended account", async () => {
      const result = await LoginController.login("info@urbanedge.example.com", PASSWORD);
      expect(result).toEqual({ status: "blocked", message: "Your account has been suspended" });
      expect(SessionController.getLoggedInAccount()).toBeNull();
    });

    it("143. does not hand the password back to the page", async () => {
      const result = await LoginController.login("customer1@example.com", PASSWORD);
      expect(JSON.stringify(result)).not.toContain(PASSWORD);
      expect(JSON.stringify(SessionController.getLoggedInAccount())).not.toContain(PASSWORD);
    });
  });

  describe("logout", () => {
    it("144. ends the session", async () => {
      await LoginController.login("customer1@example.com", PASSWORD);
      LoginController.logout();
      expect(SessionController.getLoggedInAccount()).toBeNull();
      expect(SessionController.getLoggedInCustomerID()).toBeNull();
    });
  });

  describe("getHomePage", () => {
    it("145. is the login page when nobody is logged in", () => {
      expect(LoginController.getHomePage()).toBe("/login");
    });

    it("146. is the logged-in user's own home page", async () => {
      await LoginController.login("studio@linea.example.com", PASSWORD);
      expect(LoginController.getHomePage()).toBe("/designer/idp");
    });
  });

  describe("getLoggedInDesignerCompany", () => {
    it("147. gives the logged-in designer's company name and logo, for the menu bar", async () => {
      await LoginController.login("hello@nordicnest.example.com", PASSWORD);
      const company = await LoginController.getLoggedInDesignerCompany();
      expect(company.companyName).toBe("Nordic Nest Interiors");
      expect(company.logoURL).toBeTruthy();
    });

    it("148. gives null when no designer is logged in", async () => {
      expect(await LoginController.getLoggedInDesignerCompany()).toBeNull();
      await LoginController.login("customer1@example.com", PASSWORD);
      expect(await LoginController.getLoggedInDesignerCompany()).toBeNull();
    });
  });
});

// Unit tests for PromoteIDPController (Platform Manager: Promote IDP).
// Uses the hand-made data in entity/LocalStore.js (IDPs 1 to 3; IDP 4 was deleted).
// The promotion table starts empty in tests. Dates are fixed with fake timers: "today" is 10 Nov 2026.
describe("PromoteIDPController", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 10, 10, 10, 0)); // 10 Nov 2026, 10 am local time
  });
  afterEach(() => vi.useRealTimers());

  const promotionsOn = (idpIDs, startDate, endDate) =>
    idpIDs.map((idpID, i) => ({ promotionID: i + 1, idpID, startDate, endDate, createdBy: "M12345" }));

  describe("validatePromotion", () => {
    it("149. accepts an existing IDP with a future date range", async () => {
      expect(await PromoteIDPController.validatePromotion(1, "2026-11-10", "2026-11-20")).toEqual({ status: "ok" });
    });

    it("150. reports an IDP that does not exist (or was deleted)", async () => {
      expect((await PromoteIDPController.validatePromotion(4, "2026-11-10", "2026-11-20")).status).toBe("notFound");
      expect((await PromoteIDPController.validatePromotion(999, "2026-11-10", "2026-11-20")).status).toBe("notFound");
    });

    it("151. refuses a start date in the past", async () => {
      expect((await PromoteIDPController.validatePromotion(1, "2026-11-09", "2026-11-20")).status).toBe("invalidStartDate");
    });

    it("152. refuses an end date that is not after the start date", async () => {
      expect((await PromoteIDPController.validatePromotion(1, "2026-11-15", "2026-11-15")).status).toBe("invalidEndDate");
      expect((await PromoteIDPController.validatePromotion(1, "2026-11-15", "2026-11-12")).status).toBe("invalidEndDate");
    });

    it("153. allows at most 10 promotions on any one day", async () => {
      writeTable("promotion", promotionsOn([11, 12, 13, 14, 15, 16, 17, 18, 19, 20], "2026-11-12", "2026-11-14"));
      expect((await PromoteIDPController.validatePromotion(1, "2026-11-10", "2026-11-12")).status).toBe("maxPromotionsReached");
      expect((await PromoteIDPController.validatePromotion(1, "2026-11-15", "2026-11-20")).status).toBe("ok");
    });

    it("154. refuses empty or impossible dates", async () => {
      expect((await PromoteIDPController.validatePromotion(1, "", "")).status).toBe("invalidStartDate");
      expect((await PromoteIDPController.validatePromotion(1, "2026-11-12", "")).status).toBe("invalidEndDate");
      expect((await PromoteIDPController.validatePromotion(1, "2026-02-31", "2026-03-05")).status).toBe("invalidStartDate");
      expect((await PromoteIDPController.validatePromotion(1, "2026-11-12", "not a date")).status).toBe("invalidEndDate");
    });

    it("155. accepts today as the start date in a timezone behind UTC", async () => {
      const originalTZ = process.env.TZ;
      process.env.TZ = "America/New_York";
      try {
        vi.setSystemTime(new Date(2026, 10, 10, 10, 0)); // 10 Nov 2026, 10 am in New York
        expect((await PromoteIDPController.validatePromotion(1, "2026-11-10", "2026-11-20")).status).toBe("ok");
      } finally {
        process.env.TZ = originalTZ;
      }
    });

    it("156. refuses an IDP whose designer is suspended or not verified", async () => {
      writeTable("idp", [
        ...readTable("idp"),
        { idpID: 50, designerID: "D5", title: "Suspended designer's loft", category: "Residential", propertyType: "Condo", status: "completed" },
      ]);
      expect((await PromoteIDPController.validatePromotion(50, "2026-11-10", "2026-11-20")).status).toBe("designerNotVerified");
    });

    it("157. refuses dates that overlap another promotion of the same IDP", async () => {
      writeTable("promotion", promotionsOn([1], "2026-11-12", "2026-11-18"));
      expect((await PromoteIDPController.validatePromotion(1, "2026-11-15", "2026-11-25")).status).toBe("dateOverlap");
      expect((await PromoteIDPController.validatePromotion(2, "2026-11-15", "2026-11-25")).status).toBe("ok");
    });
  });

  describe("getIDPs", () => {
    it("158. lists only IDPs whose designer is active and verified", async () => {
      writeTable("idp", [
        ...readTable("idp"),
        { idpID: 50, designerID: "D5", title: "Suspended designer's loft" },
        { idpID: 51, designerID: "D4", title: "Pending designer's flat" },
      ]);
      expect((await PromoteIDPController.getIDPs()).map((idp) => idp.idpID)).toEqual([1, 2, 3]);
    });

    it("159. gives each IDP its main photo and company name, for the cards", async () => {
      const [first, , third] = await PromoteIDPController.getIDPs();
      expect(first).toMatchObject({ idpID: 1, title: "Bright Scandinavian Living Room", companyName: "Nordic Nest Interiors", status: "completed" });
      expect(first.mainPhotoURL).toBe("/demo-photos/scandinavian-living-room.jpg");
      expect(third).toMatchObject({ idpID: 3, companyName: "Studio Linea" });
    });
  });

  describe("getIDP", () => {
    it("160. returns the IDP with its main photo and company name", async () => {
      expect(await PromoteIDPController.getIDP(2)).toMatchObject({
        idpID: 2,
        title: "Industrial Loft Conversion",
        companyName: "Nordic Nest Interiors",
        mainPhotoURL: "/demo-photos/industrial-living-room.jpg",
      });
    });

    it("161. returns null for an IDP that does not exist", async () => {
      expect(await PromoteIDPController.getIDP(4)).toBeNull();
    });
  });

  describe("promoteIDP", () => {
    it("162. saves the promotion with the platform manager who created it", async () => {
      expect(await PromoteIDPController.promoteIDP(1, "2026-11-10", "2026-11-20", "M12345")).toEqual({ status: "ok" });
      expect(await Promotion.getPromotions()).toEqual([
        expect.objectContaining({ promotionID: 1, idpID: 1, startDate: "2026-11-10", endDate: "2026-11-20", createdBy: "M12345" }),
      ]);
    });

    it("163. saves nothing when the promotion is not valid", async () => {
      expect((await PromoteIDPController.promoteIDP(1, "2026-11-01", "2026-11-20", "M12345")).status).toBe("invalidStartDate");
      expect(await Promotion.getPromotions()).toEqual([]);
    });
  });

  describe("Promotion.getActivePromotions", () => {
    it("164. returns only promotions running on the given day, including their first and last day", async () => {
      writeTable("promotion", [
        { promotionID: 1, idpID: 1, startDate: "2026-11-01", endDate: "2026-11-10", createdBy: "M12345" }, // ends today
        { promotionID: 2, idpID: 2, startDate: "2026-11-10", endDate: "2026-11-30", createdBy: "M12345" }, // starts today
        { promotionID: 3, idpID: 3, startDate: "2026-10-01", endDate: "2026-10-31", createdBy: "M12345" }, // finished
        { promotionID: 4, idpID: 3, startDate: "2026-11-20", endDate: "2026-11-30", createdBy: "M12345" }, // not started
      ]);
      expect((await Promotion.getActivePromotions("2026-11-10")).map((p) => p.promotionID)).toEqual([1, 2]);
    });
  });
});

// Unit tests for SessionController: who is logged in, and which area they may open.
// localStorage is cleared before each test, so every test starts logged out.
describe("SessionController", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  describe("session", () => {
    it("165. has nobody logged in at the start", () => {
      expect(SessionController.getLoggedInAccount()).toBeNull();
      expect(SessionController.getLoggedInCustomerID()).toBeNull();
      expect(SessionController.getLoggedInDesignerID()).toBeNull();
    });

    it("166. remembers the logged-in account and its role", () => {
      SessionController.login("C2", "customer");
      expect(SessionController.getLoggedInAccount()).toEqual({ accountID: "C2", profileID: "customer" });
      expect(SessionController.getLoggedInCustomerID()).toBe("C2");
    });

    it("167. only gives a designer ID to a designer", () => {
      SessionController.login("D3", "designer");
      expect(SessionController.getLoggedInDesignerID()).toBe("D3");
      expect(SessionController.getLoggedInCustomerID()).toBeNull();
    });

    it("168. forgets the account on logout", () => {
      SessionController.login("D1", "designer");
      SessionController.logout();
      expect(SessionController.getLoggedInAccount()).toBeNull();
    });

    it("169. treats damaged session data as logged out", () => {
      window.localStorage.setItem("idp_platform_session", "{not json");
      expect(SessionController.getLoggedInAccount()).toBeNull();
    });
  });

  describe("getRequiredProfile", () => {
    it("170. needs a customer for the home page and customer pages", () => {
      expect(SessionController.getRequiredProfile("/")).toBe("customer");
      expect(SessionController.getRequiredProfile("/customer/idp/1")).toBe("customer");
    });

    it("171. needs a designer for designer pages", () => {
      expect(SessionController.getRequiredProfile("/designer/idp")).toBe("designer");
      expect(SessionController.getRequiredProfile("/designer/dashboard")).toBe("designer");
    });

    it("172. needs nobody for the login page and user admin pages", () => {
      expect(SessionController.getRequiredProfile("/login")).toBeNull();
      expect(SessionController.getRequiredProfile("/user-admin/verify-id-accounts")).toBeNull();
    });

    it("173. requires a platform manager for platform manager pages", () => {
      expect(SessionController.getRequiredProfile("/platform-manager/report")).toBe("platformManager");
      expect(SessionController.getRequiredProfile("/platform-manager/promote-idp/1")).toBe("platformManager");
    });
  });
});

describe("VerifyIDAccountsController", () => {
  const C = VerifyIDAccountsController;
  beforeEach(() => { localStorage.clear(); SessionController.login("A1", "admin"); });
  afterEach(() => vi.restoreAllMocks());
  describe("Verify accounts", () => {
    it("174. lists pending designers and company details", async () => {
      const rows = await C.getPendingAccounts();
      expect(rows.map(r => r.account.accountID)).toEqual(["D4", "D101", "D102", "D103"]);
      expect(rows[0].company.registrationNumber).toBe("202610001D");
    });
    it("175. approves with reviewer and time and removes pending entry", async () => {
      expect((await C.approveAccount("D4")).success).toBe(true);
      const details = await C.getAccountDetails("D4");
      expect(details.account.status).toBe("active");
      expect(details.verification).toMatchObject({status:"approved", reviewedBy:"A1", rejectReason:null});
      expect(Number.isNaN(Date.parse(details.verification.reviewedAt))).toBe(false);
      expect((await C.getPendingAccounts()).map(r => r.account.accountID)).toEqual(["D101", "D102", "D103"]);
    });
    it("176. rejects with a trimmed reason and audit record", async () => {
      expect((await C.rejectAccount("D4", "  Invalid registration  ")).success).toBe(true);
      const d = await C.getAccountDetails("D4");
      expect(d.account.status).toBe("rejected");
      expect(d.verification).toMatchObject({status:"rejected", rejectReason:"Invalid registration", reviewedBy:"A1"});
    });
    it.each(["", "  ", null])("177/178/179. requires a rejection reason: %s", async reason => {
      expect((await C.rejectAccount("D4", reason)).success).toBe(false);
      expect((await C.getAccountDetails("D4")).account.status).toBe("pending");
    });
    it("180. prevents repeated review and preserves original decision", async () => {
      await C.approveAccount("D4");
      expect((await C.rejectAccount("D4", "Changed mind")).success).toBe(false);
      expect((await C.getAccountDetails("D4")).verification.status).toBe("approved");
    });
    it("181. denies logged-out and non-admin sessions", async () => {
      SessionController.logout();
      expect((await C.approveAccount("D4")).success).toBe(false);
      localStorage.setItem("idp_platform_session_adminID", "C1");
      await expect(C.getPendingAccounts()).rejects.toThrow("user admin");
    });
    it("182. denies suspended admins and missing accounts", async () => {
      expect((await C.approveAccount("missing")).success).toBe(false);
      writeTable("user_account", readTable("user_account").map(r => r.accountID === "A1" ? {...r,status:"suspended"}:r));
      expect((await C.approveAccount("D4")).success).toBe(false);
    });
    it("183. leaves both tables unchanged on storage failure", async () => {
      const before = await C.getAccountDetails("D4");
      vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {throw new Error("quota");});
      expect((await C.approveAccount("D4")).success).toBe(false);
      expect(await C.getAccountDetails("D4")).toEqual(before);
    });
    it("184. blocks pending and rejected designers from publishing", async () => {
      const input={title:"A room",description:"A description",style:"Tropical",propertyType:"Condo",category:"Residential",budget:1000,status:"completed"};
      const photos=[{fileName:"room.jpg",dataURL:"data:image/jpeg;base64,AAAA"}];
      expect((await CreateIDPController.createIDP("D4",input,photos)).success).toBe(false);
      await C.rejectAccount("D4","Invalid firm");
      expect((await CreateIDPController.createIDP("D4",input,photos)).success).toBe(false);
      expect((await CreateIDPController.createIDP("D1",input,photos)).success).toBe(true);
    });
  });

  describe("ACRA check", () => {
    it("185. compares company names without case, punctuation or company endings", () => {
      expect(C.normaliseCompanyName("Fresh Start Design Pte. Ltd.")).toBe(C.normaliseCompanyName("FRESH START DESIGN"));
      expect(C.normaliseCompanyName("Habitat & Co")).toBe(C.normaliseCompanyName("HABITAT & CO. PTE. LTD."));
      expect(C.normaliseCompanyName("Seaside Homes LLP")).toBe("SEASIDE HOMES");
    });
    it("186. matches a live UEN registered under the same name", async () => {
      expect(await C.checkUENWithACRA("D4")).toMatchObject({
        result: "matched", registeredName: "FRESH START DESIGN PTE. LTD.", registryStatus: "live",
      });
    });
    it("187. flags a UEN registered under a different name", async () => {
      expect(await C.checkUENWithACRA("D101")).toMatchObject({
        result: "nameMismatch", registeredName: "SEASIDE HOMES PTE. LTD.", registryStatus: "live",
      });
    });
    it("188. flags a UEN that is not in the registry", async () => {
      expect(await C.checkUENWithACRA("D102")).toMatchObject({ result: "notFound", registeredName: null });
    });
    it("189. flags a company that has been struck off", async () => {
      expect(await C.checkUENWithACRA("D103")).toMatchObject({
        result: "struckOff", registeredName: "OAKLINE INTERIORS PTE. LTD.", registryStatus: "struck off",
      });
    });
    it("190. approves only the matched pending accounts, reviewed by SYSTEM", async () => {
      const result = await C.runACRACheck();
      expect(result.success).toBe(true);
      expect(result.approved.map(a => a.accountID)).toEqual(["D4"]);
      expect(result.flagged.map(f => [f.accountID, f.result])).toEqual([
        ["D101", "nameMismatch"], ["D102", "notFound"], ["D103", "struckOff"],
      ]);
      const d4 = await C.getAccountDetails("D4");
      expect(d4.account.status).toBe("active");
      expect(d4.verification).toMatchObject({ status: "approved", reviewedBy: "SYSTEM", rejectReason: null });
      expect((await C.getPendingAccounts()).map(r => r.account.accountID)).toEqual(["D101", "D102", "D103"]);
    });
    it("191. does not touch accounts that are already reviewed", async () => {
      await C.rejectAccount("D4", "Invalid firm");
      const result = await C.runACRACheck();
      expect(result.approved).toEqual([]);
      expect((await C.getAccountDetails("D4")).verification.status).toBe("rejected");
      expect((await C.getAccountDetails("D1")).verification.reviewedBy).toBe("A1");
    });
    it("192. can only be run by an active user admin", async () => {
      SessionController.logout();
      expect((await C.runACRACheck()).success).toBe(false);
      await expect(C.checkUENWithACRA("D4")).rejects.toThrow("user admin");
      SessionController.login("A1", "admin");
      expect((await C.getAccountDetails("D4")).account.status).toBe("pending");
    });
    it("193. still lets the admin decide a flagged account by hand", async () => {
      await C.runACRACheck();
      expect((await C.approveAccount("D101")).success).toBe(true);
      expect((await C.rejectAccount("D103", "Company is struck off")).success).toBe(true);
    });
  });

  describe("Admin login and account lists", () => {
    it("194. logs in through the existing login page flow", async () => {
      SessionController.logout();
      expect((await LoginController.login("admin@example.com", "wrong")).status).toBe("invalid");
      expect(SessionController.getLoggedInAdminID()).toBeNull();
      expect(await LoginController.login("admin@example.com", "password123")).toEqual({
        status: "ok", profileID: "admin", homePage: "/user-admin/verify-id-accounts",
      });
      expect(LoginController.getHomePage()).toBe("/user-admin/verify-id-accounts");
      expect(SessionController.getLoggedInADMINID()).toBe("A1");
    });
    it("195. lists active and rejected accounts with read-only review details", async () => {
      await C.rejectAccount("D4", "Invalid registration");
      const rejected = await C.getAccounts("rejected");
      expect(rejected.map(row => row.account.accountID)).toEqual(["D4"]);
      expect(rejected[0].verification.rejectReason).toBe("Invalid registration");
      expect((await C.getAccounts("active")).every(row => row.account.status === "active")).toBe(true);
      expect((await C.getAccountDetails("D1")).company.companyName).toBe("Nordic Nest Interiors");
      expect((await C.approveAccount("D1")).success).toBe(false);
      expect((await C.getAccounts()).some(row => row.account.accountID === "D5")).toBe(true);
    });
    it.each([null, "customer", "designer"])("196/197/198. denies list and details for %s", async role => {
      if (role) SessionController.login(role === "customer" ? "C1" : "D1", role);
      else SessionController.logout();
      await expect(C.getAccounts()).rejects.toThrow("user admin");
      await expect(C.getAccountDetails("D4")).rejects.toThrow("user admin");
    });
    it("199. restores the account if the second table cannot be written", async () => {
      const before = await C.getAccountDetails("D4");
      const original = Storage.prototype.setItem;
      vi.spyOn(Storage.prototype, "setItem").mockImplementation(function(key, value) {
        if (key.endsWith("designer_verification")) throw new Error("quota");
        return original.call(this, key, value);
      });
      expect((await C.approveAccount("D4")).success).toBe(false);
      expect(await C.getAccountDetails("D4")).toEqual(before);
    });
    it("200. preserves customer data while approving and enables the approved designer login", async () => {
      const customer = readTable("user_account").find(row => row.accountID === "C1");
      const projects = readTable("idp");
      await C.approveAccount("D4");
      expect(readTable("user_account").find(row => row.accountID === "C1")).toEqual(customer);
      expect(readTable("idp")).toEqual(projects);
      expect((await LoginController.login("hi@freshstart.example.com", "password123")).status).toBe("ok");
    });
  });

  describe("Verify Accounts page interactions", () => {
  let host, root;
  beforeEach(() => {
    globalThis.React = React;
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
    localStorage.clear();
    host = document.createElement('div'); document.body.append(host);
    root = createRoot(host);
  });
  afterEach(async () => { await act(async () => root.unmount()); host.remove(); });
  const render = async Component => { await act(async () => { root.render(React.createElement(Component)); }); };
  const click = async text => {
    const button = [...host.querySelectorAll('button')].find(b => b.textContent.startsWith(text));
    expect(button, text).toBeTruthy();
    await act(async () => button.click());
  };
  it('201. updates the admin-only navigation on login and logout', async () => {
    await render(NavBar);
    expect(host.textContent).not.toContain('Verify ID Accounts');
    await act(async () => SessionController.login('C1','customer'));
    expect(host.textContent).not.toContain('Verify ID Accounts');
    await act(async () => SessionController.login('A1','admin'));
    expect(host.querySelector('a[href="/user-admin/verify-id-accounts"]').textContent).toBe('IDP Platform');
    expect(host.textContent).toContain('Verify ID Accounts');
    await click('Log out');
    expect(host.textContent).not.toContain('Verify ID Accounts');
  });
  it('202. shows active details and approves pending firms through the page', async () => {
    SessionController.login('A1','admin');
    await render(VerifyIDAccountsPg);
    await click('Active ('); await click('Nordic Nest Interiors');
    expect(host.textContent).toContain('202601234A');
    expect(host.textContent).toContain('This account is read-only');
    await click('Pending ('); await click('Fresh Start Design');
    await click('Approve account');
    expect(host.textContent).toContain('Account approved and activated');
    expect(host.textContent).toContain('Pending (3)');
    await click('Active ('); await click('Fresh Start Design');
    expect(host.textContent).toContain('A1');
    expect(host.textContent).toContain('This account is read-only');
  });
  it('203. requires a reason and displays the rejected account details', async () => {
    SessionController.login('A1','admin');
    await render(VerifyIDAccountsPg);
    await click('Fresh Start Design'); await click('Reject account');
    await click('Confirm rejection');
    expect(host.querySelector('[role="alert"]').textContent).toContain('reason is required');
    const input = host.querySelector('textarea');
    await act(async () => {
      Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set.call(input, 'Invalid registration');
      input.dispatchEvent(new Event('input', {bubbles: true}));
    });
    await click('Confirm rejection');
    expect(host.textContent).toContain('Account rejected.');
    await click('Rejected ('); await click('Fresh Start Design');
    expect(host.textContent).toContain('Invalid registration');
    expect(host.textContent).toContain('This account is read-only');
  });
  it('204. runs the ACRA check and shows the result for each flagged firm', async () => {
    SessionController.login('A1','admin');
    await render(VerifyIDAccountsPg);
    await click('Fresh Start Design');
    expect(host.textContent).toContain('UEN found: FRESH START DESIGN PTE. LTD. (live). Name matches.');
    await click('Run ACRA check');
    expect(host.textContent).toContain('1 account approved automatically. 3 need review.');
    expect(host.textContent).toContain('Pending (3)');
    await click('Coastline Living');
    expect(host.textContent).toContain('UEN found, but the registered name is SEASIDE HOMES PTE. LTD.');
    await click('Brightwall Studio');
    expect(host.textContent).toContain('UEN not found. Check on Bizfile before approving.');
    await click('Oakline Interiors');
    expect(host.textContent).toContain('OAKLINE INTERIORS PTE. LTD. is struck off. It should normally be rejected.');
    await click('Active ('); await click('Fresh Start Design');
    expect(host.textContent).toContain('SYSTEM');
  });
  it('205. clears visible accounts when the admin session ends', async () => {
    SessionController.login('A1','admin');
    await render(VerifyIDAccountsPg);
    await click('Fresh Start Design');
    await act(async () => SessionController.logout());
    expect(host.textContent).not.toContain('Fresh Start Design');
    expect(host.textContent).toContain('Log in as User Admin');
    expect((await C.approveAccount('D4')).success).toBe(false);
  });

  });
});

// Unit tests for ViewIDPController (Customer: View IDP), focusing on view recording,
// which feeds the IDP Performance Dashboard.
describe("ViewIDPController", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  describe("viewIDP", () => {
    it("206. returns the IDP and its photos", async () => {
      const details = await ViewIDPController.viewIDP(1, "C1");
      expect(details.idp.title).toBe("Bright Scandinavian Living Room");
      expect(details.photos.map((p) => p.photoID)).toEqual(["P1", "P2"]);
    });

    it("207. says which designer made the IDP, so the customer can find them", async () => {
      expect((await ViewIDPController.viewIDP(1, "C1")).designer).toEqual({
        designerID: "D1",
        companyName: "Nordic Nest Interiors",
      });
      expect((await ViewIDPController.viewIDP(3, "C1")).designer.companyName).toBe("Studio Linea");
    });

    it("208. records one view for the IDP, with the customer who opened it", async () => {
      await ViewIDPController.viewIDP(1, "C1");
      const views = readTable("idp_view");
      expect(views).toHaveLength(1);
      expect(views[0]).toMatchObject({ idpID: 1, customerID: "C1" });
    });

    it("209. still records a view when nobody is logged in", async () => {
      await ViewIDPController.viewIDP(2, null);
      expect(readTable("idp_view")[0]).toMatchObject({ idpID: 2, customerID: null });
    });

    it("210. does not record a view for an IDP that does not exist", async () => {
      expect(await ViewIDPController.viewIDP(4, "C1")).toBeNull();
      expect(readTable("idp_view")).toHaveLength(0);
    });
  });
});

describe("ACRARegistry", () => {
  beforeEach(() => localStorage.clear());

  describe("ACRARegistry.findByUEN", () => {
    it("211. finds a registered company by its UEN", async () => {
      expect(await ACRARegistry.findByUEN("202610001D")).toMatchObject({
        uen: "202610001D", entityName: "FRESH START DESIGN PTE. LTD.", status: "live",
      });
    });
    it("212. ignores spaces and letter case in the UEN", async () => {
      expect((await ACRARegistry.findByUEN(" 202610001d "))?.uen).toBe("202610001D");
    });
    it("213. returns null for a UEN that is not registered", async () => {
      expect(await ACRARegistry.findByUEN("202610203G")).toBeNull();
      expect(await ACRARegistry.findByUEN("")).toBeNull();
      expect(await ACRARegistry.findByUEN(null)).toBeNull();
    });
  });
});

// Generated dummy data: this file loads the real generator, which tests/setup.js switches off for the other tests.
const { generateDummyData } = await vi.importActual("@/entity/DummyData");

const TODAY = new Date("2026-11-05T12:00:00.000Z");
const dummyData = generateDummyData(TODAY);
// The hand-made IDPs in LocalStore: D1 owns 1 (completed, Scandinavian) and 2 (in progress, Industrial),
// D2 owns 3 (completed, Minimalist office).
const allIDPs = [
  { idpID: 1, designerID: "D1", status: "completed", style: "Scandinavian", category: "Residential" },
  { idpID: 2, designerID: "D1", status: "ongoing", style: "Industrial", category: "Residential" },
  { idpID: 3, designerID: "D2", status: "completed", style: "Minimalist", category: "Commercial" },
  ...dummyData.idp,
];

describe("DummyData", () => {
  beforeEach(() => localStorage.clear());
  describe("generateDummyData", () => {
    it("214. gives every verified designer exactly 10 IDPs (99 designers, 990 IDPs)", () => {
      expect(allIDPs).toHaveLength(990);
      const perDesigner = {};
      for (const idp of allIDPs) perDesigner[idp.designerID] = (perDesigner[idp.designerID] ?? 0) + 1;
      expect(Object.keys(perDesigner)).toHaveLength(99);
      expect(new Set(Object.values(perDesigner))).toEqual(new Set([10]));
    });

    it("215. keeps every designer to 1 to 3 specialty styles, like a real firm", () => {
      const stylesOf = {};
      for (const idp of allIDPs) (stylesOf[idp.designerID] ??= new Set()).add(idp.style);
      for (const styles of Object.values(stylesOf)) {
        expect(styles.size).toBeGreaterThanOrEqual(1);
        expect(styles.size).toBeLessThanOrEqual(3);
      }
    });

    it("216. matches the hand-made designers' company descriptions", () => {
      const stylesOf = (id) => [...new Set(allIDPs.filter((i) => i.designerID === id).map((i) => i.style))].sort();
      expect(stylesOf("D1")).toEqual(["Industrial", "Scandinavian"]); // "Scandinavian and industrial touches"
      expect(stylesOf("D2")).toEqual(["Minimalist"]); // "Minimalist offices and retail spaces"
      expect(stylesOf("D3")).toEqual(["Japandi", "Tropical"]); // "Tropical and Japandi homes"
      expect(stylesOf("D5")).toEqual(["Industrial"]); // "Bold industrial lofts and bars"
      // D2 only does offices and retail spaces
      expect(allIDPs.filter((i) => i.designerID === "D2").every((i) => i.category === "Commercial")).toBe(true);
    });

    it("217. describes each generated company by its real specialty styles", () => {
      for (const company of dummyData.company_information) {
        const styles = new Set(dummyData.idp.filter((i) => i.designerID === company.designerID).map((i) => i.style));
        for (const style of styles) expect(company.description).toContain(style);
      }
    });

    it("218. gives no IDPs to D4, who is still waiting for verification", () => {
      expect(allIDPs.some((idp) => idp.designerID === "D4")).toBe(false);
    });

    it("219. creates accounts, verification and company info for designers D6 to D100", () => {
      const designerAccounts = dummyData.user_account.filter((a) => a.profileID === "designer");
      expect(designerAccounts.map((a) => a.accountID)).toEqual(Array.from({ length: 95 }, (_, i) => `D${i + 6}`));
      expect(designerAccounts.every((a) => a.status === "active")).toBe(true);
      expect(dummyData.designer_verification).toHaveLength(95);
      expect(dummyData.designer_verification.every((v) => v.status === "approved")).toBe(true);
      expect(dummyData.company_information).toHaveLength(95);
      expect(new Set(dummyData.company_information.map((c) => c.companyName)).size).toBe(95);
    });

    it("220. creates customer accounts C2 to C100 (C1 is hand-made)", () => {
      const customers = dummyData.user_account.filter((a) => a.profileID === "customer");
      expect(customers.map((a) => a.accountID)).toEqual(Array.from({ length: 99 }, (_, i) => `C${i + 2}`));
    });

    it("221. makes 90% of every designer's IDPs Completed (9 of 10)", () => {
      const completed = {};
      for (const idp of allIDPs) if (idp.status === "completed") completed[idp.designerID] = (completed[idp.designerID] ?? 0) + 1;
      expect(new Set(Object.values(completed))).toEqual(new Set([9]));
    });

    it("222. starts new IDP numbers at 5 (4 was deleted) and never repeats one", () => {
      const ids = dummyData.idp.map((idp) => idp.idpID);
      expect(Math.min(...ids)).toBe(5);
      expect(new Set(ids).size).toBe(ids.length);
      expect(dummyData.lastIDPID).toBe(Math.max(...ids));
    });

    it("223. records creation timestamps for generated IDPs", () => {
      for (const idp of dummyData.idp) {
        expect(Number.isNaN(new Date(idp.createdAt).getTime())).toBe(false);
      }
    });

    it("224. gives every generated IDP 1 or 2 photos, the first as the main photo", () => {
      for (const idp of dummyData.idp) {
        const photos = dummyData.idp_photo.filter((p) => p.idpID === idp.idpID);
        expect(photos.length).toBeGreaterThanOrEqual(1);
        expect(photos.length).toBeLessThanOrEqual(2);
        expect(photos[0].sortOrder).toBe(1);
      }
    });

    it("225. only uses property types that match the category", () => {
      const residential = ["HDB", "Condo", "Landed"];
      for (const idp of dummyData.idp) {
        expect(residential.includes(idp.propertyType)).toBe(idp.category === "Residential");
      }
    });

    it("226. creates enough views and likes to simulate real use (at least 100 each)", () => {
      expect(dummyData.idp_view.length).toBeGreaterThanOrEqual(100);
      expect(dummyData.idp_like.length).toBeGreaterThanOrEqual(100);
    });

    it("227. puts all activity in the last 90 days, never in the future", () => {
      const earliest = TODAY.getTime() - 90 * 86_400_000;
      for (const v of dummyData.idp_view) {
        const t = new Date(v.viewedAt).getTime();
        expect(t).toBeGreaterThanOrEqual(earliest);
        expect(t).toBeLessThanOrEqual(TODAY.getTime());
      }
      for (const l of dummyData.idp_like) expect(new Date(l.likedAt).getTime()).toBeLessThanOrEqual(TODAY.getTime());
    });

    it("228. lets each customer like an IDP only once (including the hand-made likes)", () => {
      const keys = dummyData.idp_like.map((l) => `${l.customerID}-${l.idpID}`);
      expect(new Set(keys).size).toBe(keys.length);
      for (const handMade of ["C1-2", "C1-4", "C2-3", "C3-3"]) expect(keys).not.toContain(handMade);
    });

    it("229. never reuses the hand-made like IDs L1 to L4", () => {
      const ids = dummyData.idp_like.map((l) => l.likeID);
      for (const handMade of ["L1", "L2", "L3", "L4"]) expect(ids).not.toContain(handMade);
    });

    it("230. gives the demo designer D1 activity on every one of their IDPs", () => {
      const d1IDs = allIDPs.filter((idp) => idp.designerID === "D1").map((idp) => idp.idpID);
      for (const id of d1IDs) expect(dummyData.idp_view.some((v) => v.idpID === id)).toBe(true);
    });

    it("231. registers every generated company with ACRA under its own name and UEN (live)", () => {
      expect(dummyData.acra_registry).toHaveLength(95);
      for (const company of dummyData.company_information) {
        const record = dummyData.acra_registry.find((r) => r.uen === company.registrationNumber);
        expect(record).toMatchObject({ entityName: `${company.companyName.toUpperCase()} PTE. LTD.`, status: "live" });
      }
    });

    it("232. keeps dates in a sensible order, so reports by date make sense", () => {
      // With the generator switched off (tests/setup.js), LocalStore returns only the hand-made rows.
      const handMadeIDPs = readTable("idp");
      const verifiedAt = {}, joinedAt = {}, createdAt = {};
      for (const v of [...readTable("designer_verification"), ...dummyData.designer_verification])
        if (v.reviewedAt) verifiedAt[v.designerID] = v.reviewedAt;
      for (const a of [...dummyData.user_account, ...readTable("user_account")]) joinedAt[a.accountID] = a.createdAt;
      for (const i of [...handMadeIDPs, ...dummyData.idp]) createdAt[i.idpID] = i.createdAt;
      const now = TODAY.toISOString();

      for (const idp of dummyData.idp) {
        expect(idp.createdAt >= verifiedAt[idp.designerID], `IDP ${idp.idpID} before its designer was verified`).toBe(true);
        expect(idp.createdAt <= now).toBe(true);
      }
      for (const photo of dummyData.idp_photo) expect(photo.uploadedAt >= createdAt[photo.idpID]).toBe(true);
      for (const v of dummyData.idp_view) {
        expect(v.viewedAt >= createdAt[v.idpID], `view ${v.viewID} before IDP ${v.idpID} existed`).toBe(true);
        if (v.customerID) expect(v.viewedAt >= joinedAt[v.customerID], `view ${v.viewID} before ${v.customerID} joined`).toBe(true);
      }
      for (const l of dummyData.idp_like) {
        expect(l.likedAt >= createdAt[l.idpID], `like ${l.likeID} before IDP ${l.idpID} existed`).toBe(true);
        expect(l.likedAt >= joinedAt[l.customerID], `like ${l.likeID} before ${l.customerID} joined`).toBe(true);
      }
    });

    it("233. adds sample promotions: 3 running today, 1 finished and 1 upcoming", () => {
      const today = TODAY.toISOString().slice(0, 10);
      const ids = new Set(dummyData.idp.map((i) => i.idpID).concat([1, 2, 3]));
      expect(dummyData.promotion).toHaveLength(5);
      for (const p of dummyData.promotion) {
        expect(ids.has(p.idpID)).toBe(true);
        expect(p.endDate > p.startDate).toBe(true);
        expect(p.createdBy).toBe("M12345");
      }
      const running = dummyData.promotion.filter((p) => p.startDate <= today && today <= p.endDate);
      expect(running).toHaveLength(3);
      expect(dummyData.promotion.filter((p) => p.endDate < today)).toHaveLength(1);
      expect(dummyData.promotion.filter((p) => p.startDate > today)).toHaveLength(1);
    });

    it("234. makes the same data every time", () => {
      expect(generateDummyData(TODAY)).toEqual(dummyData);
    });
  });
});
