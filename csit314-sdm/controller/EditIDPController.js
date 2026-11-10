// Control: EditIDPController
// Feature: Edit IDP (Interior Designer)
// Opened with the "Edit IDP" button on IDViewIDPDetailsPg.
//
// What goes here:
// - Lets a designer change their IDP's details, status and photos.
//
// Constants:
// - MAX_TITLE_LENGTH, MAX_DESCRIPTION_LENGTH
// - MAX_PHOTOS_PER_IDP (10)
// - MAX_PHOTO_LENGTH                         size limit of one photo (data URL length)
//
// Rules:
// - Only the designer who owns the IDP can update it.
// - Title, description, style, property type, category, budget and status are required.
// - Style, category and status must be chosen from the fixed lists.
// - The property type must belong to the category (e.g. Office is Commercial, HDB is Residential).
// - Budget must be greater than 0.
// - The IDP must keep 1 to 10 photos; new photos must be JPG / PNG / WebP and not too large.
// - All-or-nothing: if saving fails part-way (browser storage full), nothing is changed.
//
// Methods:
// - getEditFormData()                                       choices for the dropdowns
// - getIDPForEdit(designerID, idpID)                        the form's current values
//     -> IDP.getIDP(idpID)
//     -> IDPPhoto.getPhotos(idpID)
// - validateIDP(input, keptPhotoCount, newPhotos)            list of error messages
// - editIDP(designerID, idpID, input, removedPhotoIDs, newPhotos)
//     -> IDP.getIDP(idpID), IDPPhoto.getPhotos(idpID)
//     -> IDPPhoto.addPhoto(photo) for each new photo
//     -> IDP.updateIDP(idp)
//     -> IDPPhoto.deletePhoto(photoID) for each removed photo
//
// Entities used: IDP, IDPPhoto
//
// Attributes: none
import { IDP } from "@/entity/IDP";
import { IDPPhoto } from "@/entity/IDPPhoto";
import { IDViewIDPDetailsController } from "@/controller/IDViewIDPDetailsController";

// The values the designer typed / picked in the form.
// One photo the designer chose to upload.
export class EditIDPController {
  static MAX_TITLE_LENGTH = 100;
  static MAX_DESCRIPTION_LENGTH = 2000;
  static MAX_PHOTOS_PER_IDP = 10;
  static MAX_PHOTO_LENGTH = 1_000_000; // about 750 KB of image data
  static ALLOWED_PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"];

  static getEditFormData() {
    return {
      styles: [...IDP.STYLES],
      categories: [...IDP.CATEGORIES],
      propertyTypesByCategory: {
        Residential: [...IDP.PROPERTY_TYPES.Residential],
        Commercial: [...IDP.PROPERTY_TYPES.Commercial],
      },
      statuses: IDP.STATUSES.map((value) => ({
        value,
        label: IDViewIDPDetailsController.getStatusLabel(value),
      })),
    };
  }

  // Same ownership rules as viewing the details.
  static async getIDPForEdit(designerID, idpID) {
    return IDViewIDPDetailsController.viewIDPDetails(designerID, idpID);
  }

  static validateIDP(input, keptPhotoCount, newPhotos) {
    const C = EditIDPController;
    const errors = [];
    const title = input.title.trim();
    const description = input.description.trim();

    if (title === "") errors.push("Title is required");
    else if (title.length > C.MAX_TITLE_LENGTH)
      errors.push(`Title must be at most ${C.MAX_TITLE_LENGTH} characters`);

    if (description === "") errors.push("Description is required");
    else if (description.length > C.MAX_DESCRIPTION_LENGTH)
      errors.push(
        `Description must be at most ${C.MAX_DESCRIPTION_LENGTH} characters`,
      );

    if (!IDP.STYLES.includes(input.style))
      errors.push("Please choose a style from the list");

    if (!IDP.CATEGORIES.includes(input.category)) {
      errors.push("Please choose Residential or Commercial");
    } else {
      const allowed = IDP.PROPERTY_TYPES[input.category];
      if (!allowed.includes(input.propertyType))
        errors.push(
          `${input.propertyType} is not a ${input.category} property type`,
        );
    }

    if (!Number.isFinite(input.budget) || input.budget <= 0)
      errors.push("Budget must be a number greater than 0");

    if (!IDP.STATUSES.includes(input.status))
      errors.push("Please choose In Progress or Completed");

    const totalPhotos = keptPhotoCount + newPhotos.length;
    if (totalPhotos === 0) errors.push("At least one photo is required");
    else if (totalPhotos > C.MAX_PHOTOS_PER_IDP)
      errors.push(`Too many photos (maximum ${C.MAX_PHOTOS_PER_IDP})`);

    for (const photo of newPhotos) {
      const type = photo.dataURL.slice(5, photo.dataURL.indexOf(";")); // "data:image/png;base64,..." -> "image/png"
      if (
        !photo.dataURL.startsWith("data:") ||
        !C.ALLOWED_PHOTO_TYPES.includes(type)
      )
        errors.push(`${photo.fileName} is not a JPG, PNG or WebP image`);
      else if (photo.dataURL.length > C.MAX_PHOTO_LENGTH)
        errors.push(`${photo.fileName} is too large`);
    }

    return errors;
  }

  static async editIDP(designerID, idpID, input, removedPhotoIDs, newPhotos) {
    const idp = await IDP.getIDP(idpID);
    if (!idp) return { success: false, errors: ["IDP not found"] };
    if (idp.designerID !== designerID)
      return { success: false, errors: ["You can only update your own IDPs"] };

    const currentPhotos = await IDPPhoto.getPhotos(idpID);
    // Only remove photos that really belong to this IDP.
    const toRemove = currentPhotos.filter((p) =>
      removedPhotoIDs.includes(p.photoID),
    );
    const keptCount = currentPhotos.length - toRemove.length;

    const errors = EditIDPController.validateIDP(input, keptCount, newPhotos);
    if (errors.length > 0) return { success: false, errors };

    // New photos go after the existing ones. The lowest sortOrder left is the main photo.
    let nextSortOrder =
      Math.max(0, ...currentPhotos.map((p) => p.sortOrder)) + 1;
    const added = [];
    try {
      for (const upload of newPhotos) {
        added.push(
          await IDPPhoto.addPhoto({
            idpID,
            photoURL: upload.dataURL,
            caption: upload.fileName.replace(/\.[^.]+$/, ""), // "kitchen.jpg" -> "kitchen"
            sortOrder: nextSortOrder++,
          }),
        );
      }
      // Start from the stored IDP so fields the form does not edit (e.g. createdAt) are kept.
      await IDP.updateIDP({
        ...idp,
        idpID,
        designerID: idp.designerID,
        title: input.title.trim(),
        description: input.description.trim(),
        style: input.style,
        propertyType: input.propertyType,
        category: input.category,
        budget: input.budget,
        status: input.status,
      });
    } catch {
      // Browser storage is full: undo the photos already added, leave the IDP as it was.
      for (const photo of added) await IDPPhoto.deletePhoto(photo.photoID);
      return {
        success: false,
        errors: [
          "Not enough storage space for these photos. Try fewer or smaller photos.",
        ],
      };
    }

    for (const photo of toRemove) await IDPPhoto.deletePhoto(photo.photoID);
    return { success: true, errors: [] };
  }
}
