// Control: IDViewIDPDetailsController
// Feature: View IDP Details (Interior Designer)
// Not the same as ViewIDPController (Customer): a designer only sees their OWN IDPs,
// sees each IDP's status (In Progress / Completed), and can go on to update it (Update IDP).
// Designers cannot like IDPs; liking is a customer feature.
//
// Rules:
// - The list only shows the logged-in designer's IDPs.
// - The IDP must exist (not deleted).
// - The IDP must belong to the logged-in designer.
// - The list shows In Progress IDPs first, then Completed ones.
//
// Methods:
// - getMyIDPs(designerID)                       the designer's IDP list, In Progress first
//     -> IDP.getIDPsByDesigner(designerID)
//     -> IDPPhoto.getPhotos(idpID) for each      first photo is the main photo
// - viewIDPDetails(designerID, idpID)          one IDP in full
//     -> IDP.getIDP(idpID)
//     -> IDPPhoto.getPhotos(idpID)              only if the designer owns the IDP
// - getStatusLabel(status)                      ongoing -> "In Progress", completed -> "Completed"
//
// Entities used: IDP, IDPPhoto
//
// Attributes: none
import { IDP } from "@/entity/IDP";
import { IDPPhoto } from "@/entity/IDPPhoto";

// ok       -> details holds the IDP and its photos
// notFound -> no such IDP (e.g. deleted)
// notOwner -> the IDP belongs to another designer
export class IDViewIDPDetailsController {
  static async getMyIDPs(designerID) {
    const idps = await IDP.getIDPsByDesigner(designerID);
    const items = [];
    for (const idp of idps) {
      const photos = await IDPPhoto.getPhotos(idp.idpID);
      items.push({
        idpID: idp.idpID,
        title: idp.title,
        status: idp.status,
        propertyType: idp.propertyType,
        category: idp.category,
        mainPhotoURL: photos[0]?.photoURL ?? null,
      });
    }
    // In Progress first, then Completed. sort() keeps the original order within each group.
    return items.sort((a, b) => (a.status === "ongoing" ? 0 : 1) - (b.status === "ongoing" ? 0 : 1));
  }

  static async viewIDPDetails(designerID, idpID) {
    const idp = await IDP.getIDP(idpID);
    if (!idp) return { status: "notFound" };
    if (idp.designerID !== designerID) return { status: "notOwner" };

    const photos = await IDPPhoto.getPhotos(idpID);
    return { status: "ok", details: { idp, photos } };
  }

  static getStatusLabel(status) {
    return status === "completed" ? "Completed" : "In Progress";
  }
}
