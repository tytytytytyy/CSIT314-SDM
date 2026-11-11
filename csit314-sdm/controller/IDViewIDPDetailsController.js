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