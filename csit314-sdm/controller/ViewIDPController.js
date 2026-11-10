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
//     -> CompanyInformation.getCompanyInfo(designerID)   who made it: { designerID, companyName }
//     -> IDPView.createView(idpID, customerID)   customerID is null when nobody is logged in
//
// Entities used: IDP, IDPPhoto, IDPView, CompanyInformation
//
// Attributes: none
import { IDP } from "@/entity/IDP";
import { IDPPhoto } from "@/entity/IDPPhoto";
import { IDPView } from "@/entity/IDPView";
import { CompanyInformation } from "@/entity/CompanyInformation";

export class ViewIDPController {
  static async viewIDP(idpID, customerID = null) {
    const idp = await IDP.getIDP(idpID);
    if (!idp) return null;
    const photos = await IDPPhoto.getPhotos(idpID);
    const company = await CompanyInformation.getCompanyInfo(idp.designerID);
    const designer = { designerID: idp.designerID, companyName: company?.companyName ?? null };
    await IDPView.createView(idpID, customerID);
    return { idp, photos, designer };
  }
}
