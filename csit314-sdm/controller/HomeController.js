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
import { Promotion } from "@/entity/Promotion";
import { toDateKey } from "@/lib/dates";

export class HomeController {
  static PAGE_SIZE = 12;

  // IDPs with a promotion running today come first (marked featured), then every other IDP in ID order.
  static async getIDPFeed(offset = 0, limit = this.PAGE_SIZE) {
    const all = await IDP.listIDPs(0, Number.MAX_SAFE_INTEGER);
    const byID = new Map(all.map((idp) => [idp.idpID, idp]));
    const promotedIDs = (await Promotion.getActivePromotions(toDateKey(new Date())))
      .map((p) => p.idpID)
      .filter((id, i, ids) => byID.has(id) && ids.indexOf(id) === i); // skip deleted IDPs and repeats
    const featured = new Set(promotedIDs);
    const ordered = [...promotedIDs.map((id) => byID.get(id)), ...all.filter((idp) => !featured.has(idp.idpID))];

    const cards = [];
    for (const idp of ordered.slice(offset, offset + limit)) {
      const photos = await IDPPhoto.getPhotos(idp.idpID);
      const company = await CompanyInformation.getCompanyInfo(idp.designerID);
      cards.push({
        idpID: idp.idpID,
        title: idp.title,
        style: idp.style,
        mainPhotoURL: photos[0]?.photoURL ?? null,
        designerID: idp.designerID,
        companyName: company?.companyName ?? null,
        featured: featured.has(idp.idpID),
      });
    }
    return { cards, hasMore: ordered.length > offset + limit };
  }
}
