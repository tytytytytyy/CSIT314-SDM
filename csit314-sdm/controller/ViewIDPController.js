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
