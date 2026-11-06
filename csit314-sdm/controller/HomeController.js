// Control: HomeController  (TEMPORARY - replace with the real IDP list / search feature)
// Supplies the customer home page feed: every IDP, a page at a time, so the page can keep
// loading more as the customer scrolls down.
//
// Fixed values:
// - PAGE_SIZE = 12            IDPs per page
//
// Methods:
// - getIDPFeed(offset, limit)     returns { cards, hasMore }; cards are in idpID order
//     -> IDP.listIDPs(offset, limit + 1)          one extra to know whether more are left
//     -> IDPPhoto.getPhotos(idpID)                first photo is the main photo
//     -> CompanyInformation.getCompanyInfo(designerID)   who made the IDP
//
// Entities used: IDP, IDPPhoto, CompanyInformation
//
// Attributes: none
import { IDP } from "@/entity/IDP";
import { IDPPhoto } from "@/entity/IDPPhoto";
import { CompanyInformation } from "@/entity/CompanyInformation";

export class HomeController {
  static PAGE_SIZE = 12;

  static async getIDPFeed(offset = 0, limit = this.PAGE_SIZE) {
    const idps = await IDP.listIDPs(offset, limit + 1);
    const cards = [];
    for (const idp of idps.slice(0, limit)) {
      const photos = await IDPPhoto.getPhotos(idp.idpID);
      const company = await CompanyInformation.getCompanyInfo(idp.designerID);
      cards.push({
        idpID: idp.idpID,
        title: idp.title,
        style: idp.style,
        mainPhotoURL: photos[0]?.photoURL ?? null,
        designerID: idp.designerID,
        companyName: company?.companyName ?? null,
      });
    }
    return { cards, hasMore: idps.length > limit };
  }
}
