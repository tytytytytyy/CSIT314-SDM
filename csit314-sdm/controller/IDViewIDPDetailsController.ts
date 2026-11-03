// Control: IDViewIDPDetailsController
// Feature: View IDP Details (Interior Designer)
// Not the same as ViewIDPController (Customer): a designer can only view their OWN IDPs,
// and sees the status and photo captions so they can check the IDP before updating it.
//
// Rules:
// - The IDP must exist (not deleted).
// - The IDP must belong to the logged-in designer.
//
// Methods:
// - viewIDPDetails(designerID, idpID)
//     -> IDP.getIDP(idpID)
//     -> IDPPhoto.getPhotos(idpID)              only if the designer owns the IDP
//
// Entities used: IDP, IDPPhoto
//
// Attributes: none
import { IDP } from "@/entity/IDP";
import { IDPPhoto } from "@/entity/IDPPhoto";

export interface IDPDetails {
  idp: IDP;
  photos: IDPPhoto[];
}

// ok       -> details holds the IDP and its photos
// notFound -> no such IDP (e.g. deleted)
// notOwner -> the IDP belongs to another designer
export interface IDViewIDPDetailsResult {
  status: "ok" | "notFound" | "notOwner";
  details?: IDPDetails;
}

export class IDViewIDPDetailsController {
  static async viewIDPDetails(designerID: string, idpID: number): Promise<IDViewIDPDetailsResult> {
    const idp = await IDP.getIDP(idpID);
    if (!idp) return { status: "notFound" };
    if (idp.designerID !== designerID) return { status: "notOwner" };

    const photos = await IDPPhoto.getPhotos(idpID);
    return { status: "ok", details: { idp, photos } };
  }
}
