import { IDP } from "@/entity/IDP";
import { InteriorDesignerAccount } from "@/entity/InteriorDesignerAccount";
import { IDPPhoto } from "@/entity/IDPPhoto";
import { EditIDPController } from "@/controller/EditIDPController";

// success = true  -> idpID is the new IDP's ID
// success = false -> errors lists what went wrong
export class CreateIDPController {
  static getCreateFormData() {
    return EditIDPController.getEditFormData();
  }

  // A new IDP has no existing photos, so all of its photos are new uploads.
  static validateIDP(input, photos) {
    return EditIDPController.validateIDP(input, 0, photos);
  }

  static async createIDP(designerID, input, photos) {
    // Verify Accounts rule: only active, approved firms may publish projects.
    try {
      const { account, verification } = InteriorDesignerAccount.getAccountDetails(designerID);
      if (account.status !== "active" || verification?.status !== "approved") {
        return { success: false, errors: ["Only active, verified interior designers can publish IDPs."] };
      }
    } catch {
      return { success: false, errors: ["Interior designer account not found."] };
    }
    const errors = CreateIDPController.validateIDP(input, photos);
    if (errors.length > 0) return { success: false, errors };

    let idp = null;
    const added = [];
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
          }),
        );
      }
    } catch {
      // Browser storage is full: remove whatever was already saved.
      for (const photo of added) await IDPPhoto.deletePhoto(photo.photoID);
      if (idp) await IDP.deleteIDP(idp.idpID);
      return {
        success: false,
        errors: [
          "Not enough storage space for these photos. Try fewer or smaller photos.",
        ],
      };
    }

    return { success: true, idpID: idp.idpID, errors: [] };
  }
}
