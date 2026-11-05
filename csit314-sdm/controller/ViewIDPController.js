// Control: ViewIDPController
// Feature: View IDP (Customer)
//
// What goes here:
// - Loads everything needed to show one IDP. No login needed.
// - Records one view of the IDP, which the designer sees on their Performance Dashboard.
//
// Methods:
// - viewIDP(idpID, customerID)               null if there is no such IDP (e.g. deleted by the designer)
//     -> IDP.getIDP(idpID)
//     -> IDPPhoto.getPhotos(idpID)
//     -> IDPView.createView(idpID, customerID)   customerID is null when nobody is logged in
//
// Entities used: IDP, IDPPhoto, IDPView
//
// Attributes: none
import { IDP } from "@/entity/IDP";
import { IDPPhoto } from "@/entity/IDPPhoto";
import { IDPView } from "@/entity/IDPView";

export class ViewIDPController {
  static async viewIDP(idpID, customerID = null) {
    const idp = await IDP.getIDP(idpID);
    if (!idp) return null;
    const photos = await IDPPhoto.getPhotos(idpID);
    await IDPView.createView(idpID, customerID);
    return { idp, photos };
  }
}
