// Unit tests for CreateIDPController (Create IDP feature).
// Each test gets a fresh in-memory database, so tests never affect each other.

import { describe, it, expect, beforeEach } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { useTestDatabase, PROFILE, type DB } from "@/lib/db";
import { CreateIDPController, type PhotoUpload } from "@/controller/CreateIDPController";

let db: DB;
let controller: CreateIDPController;

const VERIFIED_DESIGNER = 1;
const PENDING_DESIGNER = 2;
const CUSTOMER = 3;
const ACTIVE_CATEGORY = 1;
const INACTIVE_CATEGORY = 2;

function photo(overrides: Partial<PhotoUpload> = {}): PhotoUpload {
  return {
    fileName: "living-room.jpg",
    mimeType: "image/jpeg",
    size: 1024,
    data: new Uint8Array([1, 2, 3]),
    ...overrides,
  };
}

beforeEach(() => {
  process.env.UPLOAD_DIR = fs.mkdtempSync(path.join(os.tmpdir(), "idp-photos-"));
  db = useTestDatabase();
  const addAccount = db.prepare(
    "INSERT INTO user_account (accountID, email, password, profileID, status, createdAt) VALUES (?, ?, 'x', ?, ?, '2026-11-01')"
  );
  addAccount.run(VERIFIED_DESIGNER, "verified@test.com", PROFILE.INTERIOR_DESIGNER, "active");
  addAccount.run(PENDING_DESIGNER, "pending@test.com", PROFILE.INTERIOR_DESIGNER, "pending");
  addAccount.run(CUSTOMER, "customer@test.com", PROFILE.CUSTOMER, "active");

  const addCategory = db.prepare("INSERT INTO idp_category (categoryID, name, isActive) VALUES (?, ?, ?)");
  addCategory.run(ACTIVE_CATEGORY, "Scandinavian", 1);
  addCategory.run(INACTIVE_CATEGORY, "Retro", 0);

  controller = new CreateIDPController();
});

describe("getCreateFormData", () => {
  it("returns only active categories", () => {
    const categories = controller.getCreateFormData();
    expect(categories.map((c) => c.name)).toEqual(["Scandinavian"]);
  });
});

describe("checkDesignerVerified", () => {
  it("accepts an active interior designer", () => {
    expect(controller.checkDesignerVerified(VERIFIED_DESIGNER)).toBe(true);
  });

  it("rejects a pending interior designer", () => {
    expect(controller.checkDesignerVerified(PENDING_DESIGNER)).toBe(false);
  });

  it("rejects a customer account", () => {
    expect(controller.checkDesignerVerified(CUSTOMER)).toBe(false);
  });

  it("rejects an account that does not exist", () => {
    expect(controller.checkDesignerVerified(999)).toBe(false);
  });
});

describe("validateIDP", () => {
  it("returns no errors for a valid IDP", () => {
    expect(controller.validateIDP("Modern loft", "Open-plan living", ACTIVE_CATEGORY, 50000, [photo()])).toEqual([]);
  });

  it("allows the budget to be left empty", () => {
    expect(controller.validateIDP("Modern loft", "Open-plan living", ACTIVE_CATEGORY, null, [photo()])).toEqual([]);
  });

  it("requires a title", () => {
    expect(controller.validateIDP("   ", "Desc", ACTIVE_CATEGORY, null, [photo()])).toContain("Title is required");
  });

  it("rejects a title that is too long", () => {
    const longTitle = "a".repeat(CreateIDPController.MAX_TITLE_LENGTH + 1);
    expect(controller.validateIDP(longTitle, "Desc", ACTIVE_CATEGORY, null, [photo()])).toContain(
      `Title must be at most ${CreateIDPController.MAX_TITLE_LENGTH} characters`
    );
  });

  it("requires a description", () => {
    expect(controller.validateIDP("Title", "", ACTIVE_CATEGORY, null, [photo()])).toContain("Description is required");
  });

  it("rejects a description that is too long", () => {
    const longDesc = "a".repeat(CreateIDPController.MAX_DESCRIPTION_LENGTH + 1);
    expect(controller.validateIDP("Title", longDesc, ACTIVE_CATEGORY, null, [photo()])).toContain(
      `Description must be at most ${CreateIDPController.MAX_DESCRIPTION_LENGTH} characters`
    );
  });

  it("requires a category", () => {
    expect(controller.validateIDP("Title", "Desc", null, null, [photo()])).toContain("Category is required");
  });

  it("rejects an inactive category", () => {
    expect(controller.validateIDP("Title", "Desc", INACTIVE_CATEGORY, null, [photo()])).toContain(
      "Please choose an active category"
    );
  });

  it("rejects a category that does not exist", () => {
    expect(controller.validateIDP("Title", "Desc", 999, null, [photo()])).toContain("Please choose an active category");
  });

  it("rejects a negative or invalid budget", () => {
    expect(controller.validateIDP("Title", "Desc", ACTIVE_CATEGORY, -5, [photo()])).toContain(
      "Budget must be a positive number"
    );
    expect(controller.validateIDP("Title", "Desc", ACTIVE_CATEGORY, NaN, [photo()])).toContain(
      "Budget must be a positive number"
    );
  });

  it("requires at least one photo", () => {
    expect(controller.validateIDP("Title", "Desc", ACTIVE_CATEGORY, null, [])).toContain(
      "At least one photo is required"
    );
  });

  it("rejects too many photos", () => {
    const photos = Array.from({ length: CreateIDPController.MAX_PHOTOS_PER_IDP + 1 }, () => photo());
    expect(controller.validateIDP("Title", "Desc", ACTIVE_CATEGORY, null, photos)).toContain(
      `Too many photos (maximum ${CreateIDPController.MAX_PHOTOS_PER_IDP})`
    );
  });

  it("rejects a file that is not a JPG, PNG or WebP image", () => {
    expect(
      controller.validateIDP("Title", "Desc", ACTIVE_CATEGORY, null, [photo({ fileName: "plan.pdf", mimeType: "application/pdf" })])
    ).toContain("plan.pdf is not a JPG, PNG or WebP image");
  });

  it("rejects a photo that is too large", () => {
    const big = photo({ fileName: "huge.jpg", size: CreateIDPController.MAX_PHOTO_SIZE_BYTES + 1 });
    expect(controller.validateIDP("Title", "Desc", ACTIVE_CATEGORY, null, [big])).toContain("huge.jpg is larger than 5 MB");
  });

  it("reports every problem at once", () => {
    expect(controller.validateIDP("", "", null, null, [])).toHaveLength(4);
  });
});

describe("createIDP", () => {
  it("saves the IDP and its photos for a verified designer", () => {
    const result = controller.createIDP(VERIFIED_DESIGNER, "  Modern loft  ", "Open-plan living", ACTIVE_CATEGORY, 50000, [
      photo(),
      photo({ fileName: "kitchen.png", mimeType: "image/png" }),
    ]);

    expect(result.success).toBe(true);
    const saved = db.prepare("SELECT * FROM idp WHERE idpID = ?").get(result.idpID) as Record<string, unknown>;
    expect(saved.title).toBe("Modern loft");
    expect(saved.designerID).toBe(VERIFIED_DESIGNER);
    expect(saved.budget).toBe(50000);

    const photos = db.prepare("SELECT * FROM idp_photo WHERE idpID = ? ORDER BY sortOrder").all(result.idpID) as {
      photoURL: string;
      sortOrder: number;
    }[];
    expect(photos).toHaveLength(2);
    expect(photos.map((p) => p.sortOrder)).toEqual([1, 2]);
    expect(photos[1].photoURL).toMatch(/^\/uploads\/idp\/.+\.png$/);
  });

  it("does not save anything for an unverified designer", () => {
    const result = controller.createIDP(PENDING_DESIGNER, "Title", "Desc", ACTIVE_CATEGORY, null, [photo()]);
    expect(result).toEqual({ success: false, errors: ["Only verified interior designers can create an IDP"] });
    expect(db.prepare("SELECT COUNT(*) AS n FROM idp").get()).toEqual({ n: 0 });
  });

  it("does not save anything when the input is invalid", () => {
    const result = controller.createIDP(VERIFIED_DESIGNER, "", "Desc", ACTIVE_CATEGORY, null, [photo()]);
    expect(result.success).toBe(false);
    expect(result.errors).toContain("Title is required");
    expect(db.prepare("SELECT COUNT(*) AS n FROM idp").get()).toEqual({ n: 0 });
  });
});
