// Control: ViewIDPController
// Feature: View IDP (Customer)
//
// What goes here:
// - Loads everything needed to show one IDP. No login needed, no data is changed.
//
// Methods:
// - viewIDP(idpID)                           null if there is no such IDP (e.g. deleted by the designer)
//     -> IDP.getIDP(idpID)
//     -> IDPPhoto.getPhotos(idpID)
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

export class ViewIDPController {
  static async viewIDP(idpID: number): Promise<IDPDetails | null> {
    const idp = await IDP.getIDP(idpID);
    if (!idp) return null;
    const photos = await IDPPhoto.getPhotos(idpID);
    return { idp, photos };
  }
}
