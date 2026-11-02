// Control: CreateIDPController
// Feature: Create IDP (Interior Designer)
//
// Validates a new IDP and saves it with its photos.
//
// Rules:
// - Only a verified (active) interior designer can create an IDP.
// - Title, description, category and at least one photo are required.
// - Category must be active.
//
// Entities used: IDP, IDPPhoto, IDPCategory, UserAccount

import { getDb, PROFILE } from "@/lib/db";
import { IDP } from "@/entity/IDP";
import { IDPPhoto } from "@/entity/IDPPhoto";
import { IDPCategory } from "@/entity/IDPCategory";
import { UserAccount } from "@/entity/UserAccount";

// One uploaded photo, as received from the boundary.
export type PhotoUpload = {
  fileName: string;
  mimeType: string;
  size: number; // bytes
  data: Uint8Array;
};

// success = true  -> idpID is the new IDP's ID
// success = false -> errors lists what went wrong
export type CreateIDPResult = { success: boolean; idpID?: number; errors?: string[] };

export class CreateIDPController {
  static readonly MAX_PHOTOS_PER_IDP = 10;
  static readonly MAX_TITLE_LENGTH = 100;
  static readonly MAX_DESCRIPTION_LENGTH = 2000;
  static readonly MAX_PHOTO_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
  static readonly ALLOWED_PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"];

  // Data the form needs: the categories a designer can pick.
  getCreateFormData(): IDPCategory[] {
    return new IDPCategory().getActiveCategories();
  }

  // True only for an existing, active (verified) interior designer account.
  checkDesignerVerified(designerID: number): boolean {
    const account = new UserAccount().getAccount(designerID);
    return account !== null && account.profileID === PROFILE.INTERIOR_DESIGNER && account.status === "active";
  }

  // Returns a list of error messages. An empty list means the IDP is valid.
  validateIDP(
    title: string,
    description: string,
    categoryID: number | null,
    budget: number | null,
    photos: PhotoUpload[]
  ): string[] {
    const errors: string[] = [];
    const C = CreateIDPController;

    if (title.trim() === "") errors.push("Title is required");
    else if (title.trim().length > C.MAX_TITLE_LENGTH) errors.push(`Title must be at most ${C.MAX_TITLE_LENGTH} characters`);

    if (description.trim() === "") errors.push("Description is required");
    else if (description.trim().length > C.MAX_DESCRIPTION_LENGTH)
      errors.push(`Description must be at most ${C.MAX_DESCRIPTION_LENGTH} characters`);

    if (categoryID === null) errors.push("Category is required");
    else {
      const category = new IDPCategory().getCategory(categoryID);
      if (!category || !category.isActive) errors.push("Please choose an active category");
    }

    if (budget !== null && (!Number.isFinite(budget) || budget < 0)) errors.push("Budget must be a positive number");

    if (photos.length === 0) errors.push("At least one photo is required");
    else if (photos.length > C.MAX_PHOTOS_PER_IDP) errors.push(`Too many photos (maximum ${C.MAX_PHOTOS_PER_IDP})`);

    for (const photo of photos) {
      if (!C.ALLOWED_PHOTO_TYPES.includes(photo.mimeType)) errors.push(`${photo.fileName} is not a JPG, PNG or WebP image`);
      else if (photo.size > C.MAX_PHOTO_SIZE_BYTES) errors.push(`${photo.fileName} is larger than 5 MB`);
    }

    return errors;
  }

  // Checks the designer and the input, then saves the IDP and its photos together.
  createIDP(
    designerID: number,
    title: string,
    description: string,
    categoryID: number | null,
    budget: number | null,
    photos: PhotoUpload[]
  ): CreateIDPResult {
    if (!this.checkDesignerVerified(designerID)) {
      return { success: false, errors: ["Only verified interior designers can create an IDP"] };
    }

    const errors = this.validateIDP(title, description, categoryID, budget, photos);
    if (errors.length > 0) return { success: false, errors };

    // A transaction: if any photo fails to save, the IDP is not saved either.
    const saveAll = getDb().transaction(() => {
      const idp = new IDP().createIDP(
        new IDP({ designerID, title: title.trim(), description: description.trim(), categoryID: categoryID!, budget })
      );
      photos.forEach((upload, index) => {
        new IDPPhoto().addPhoto(new IDPPhoto({ idpID: idp.idpID, sortOrder: index + 1 }), upload.data, upload.mimeType);
      });
      return idp;
    });

    const idp = saveAll();
    return { success: true, idpID: idp.idpID };
  }
}
