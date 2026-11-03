// Control: IDCreateIDPController
// Feature: Create IDP (Interior Designer)
// Opened with the "Create IDP" button on IDMyIDPListPg.
//
// What goes here:
// - Validates a new IDP and saves it with its photos for the logged-in designer.
//
// Rules:
// - Same field rules as Update IDP (title, description, style, category, property type that
//   matches the category, budget > 0, status), so validation reuses IDUpdateIDPController.
// - 1 to 10 photos, JPG / PNG / WebP, not too large. The first photo is the main photo.
// - All-or-nothing: if saving fails part-way (browser storage full), nothing is saved.
//
// Methods:
// - getCreateFormData()                     choices for the dropdowns
// - validateIDP(input, photos)              list of error messages
// - createIDP(designerID, input, photos)
//     -> IDP.createIDP(idp)
//     -> IDPPhoto.addPhoto(photo) for each photo
//     -> IDP.deleteIDP / IDPPhoto.deletePhoto only to undo a failed save
//
// Entities used: IDP, IDPPhoto
//
// Attributes: none
import { IDP } from "@/entity/IDP";
import { IDPPhoto } from "@/entity/IDPPhoto";
import {
  IDUpdateIDPController,
  type NewPhotoUpload,
  type UpdateFormData,
  type UpdateIDPInput,
} from "@/controller/IDUpdateIDPController";

// success = true  -> idpID is the new IDP's ID
// success = false -> errors lists what went wrong
export interface CreateIDPResult {
  success: boolean;
  idpID?: number;
  errors: string[];
}

export class IDCreateIDPController {
  static getCreateFormData(): UpdateFormData {
    return IDUpdateIDPController.getUpdateFormData();
  }

  // A new IDP has no existing photos, so all of its photos are new uploads.
  static validateIDP(input: UpdateIDPInput, photos: NewPhotoUpload[]): string[] {
    return IDUpdateIDPController.validateIDP(input, 0, photos);
  }

  static async createIDP(designerID: string, input: UpdateIDPInput, photos: NewPhotoUpload[]): Promise<CreateIDPResult> {
    const errors = IDCreateIDPController.validateIDP(input, photos);
    if (errors.length > 0) return { success: false, errors };

    let idp: IDP | null = null;
    const added: IDPPhoto[] = [];
    try {
      idp = await IDP.createIDP({
        designerID,
        title: input.title.trim(),
        description: input.description.trim(),
        style: input.style,
        propertyType: input.propertyType,
        category: input.category,
        budget: input.budget,
        status: input.status,
      });
      for (const [index, upload] of photos.entries()) {
        added.push(
          await IDPPhoto.addPhoto({
            idpID: idp.idpID,
            photoURL: upload.dataURL,
            caption: upload.fileName.replace(/\.[^.]+$/, ""), // "kitchen.jpg" -> "kitchen"
            sortOrder: index + 1,
          })
        );
      }
    } catch {
      // Browser storage is full: remove whatever was already saved.
      for (const photo of added) await IDPPhoto.deletePhoto(photo.photoID);
      if (idp) await IDP.deleteIDP(idp.idpID);
      return { success: false, errors: ["Not enough storage space for these photos. Try fewer or smaller photos."] };
    }

    return { success: true, idpID: idp.idpID, errors: [] };
  }
}
