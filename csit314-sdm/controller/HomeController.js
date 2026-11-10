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
// Only IDPs by active, verified designers are shown (InteriorDesignerAccount.isActiveAndVerified).
//
// Entities used: IDP, IDPPhoto, CompanyInformation, Promotion, InteriorDesignerAccount
//
// Attributes: none
import { IDP } from "@/entity/IDP";
import { IDPPhoto } from "@/entity/IDPPhoto";
import { CompanyInformation } from "@/entity/CompanyInformation";
import { Promotion } from "@/entity/Promotion";
import { InteriorDesignerAccount } from "@/entity/InteriorDesignerAccount";
import { toDateKey } from "@/lib/dates";

export class HomeController {
  static PAGE_SIZE = 12;

  // The IDPs with a promotion running today, for the "Featured projects" section.
  static async getFeaturedIDPs() {
    const ids = await this.getFeaturedIDPIDs();
    const cards = [];
    for (const idpID of ids) cards.push(await this.toCard(await IDP.getIDP(idpID)));
    return cards;
  }

  // Every other IDP in ID order, a page at a time, for the "All projects" section.
  // Featured IDPs are left out, so no card shows twice on the page.
  static async getIDPFeed(offset = 0, limit = this.PAGE_SIZE) {
    const featured = new Set(await this.getFeaturedIDPIDs());
    const rest = (await this.getVisibleIDPs()).filter((idp) => !featured.has(idp.idpID));
    const cards = [];
    for (const idp of rest.slice(offset, offset + limit)) cards.push(await this.toCard(idp));
    return { cards, hasMore: rest.length > offset + limit };
  }

  // IDs of IDPs promoted today, oldest promotion first; skips deleted IDPs, IDPs of designers
  // who are not active and verified, and repeats.
  static async getFeaturedIDPIDs() {
    const ids = [];
    for (const { idpID } of await Promotion.getActivePromotions(toDateKey(new Date()))) {
      if (ids.includes(idpID)) continue;
      const idp = await IDP.getIDP(idpID);
      if (idp && (await InteriorDesignerAccount.isActiveAndVerified(idp.designerID))) ids.push(idpID);
    }
    return ids;
  }

  // All IDPs whose designer is active and verified (a suspended or pending designer's IDPs
  // are hidden from customers, the same as in Browse Interior Designers), in idpID order.
  static async getVisibleIDPs() {
    const idps = await IDP.listIDPs(0, Number.MAX_SAFE_INTEGER);
    const visible = new Set();
    for (const designerID of new Set(idps.map((idp) => idp.designerID))) {
      if (await InteriorDesignerAccount.isActiveAndVerified(designerID)) visible.add(designerID);
    }
    return idps.filter((idp) => visible.has(idp.designerID));
  }

  static async toCard(idp) {
    const photos = await IDPPhoto.getPhotos(idp.idpID);
    const company = await CompanyInformation.getCompanyInfo(idp.designerID);
    return {
      idpID: idp.idpID,
      title: idp.title,
      style: idp.style,
      mainPhotoURL: photos[0]?.photoURL ?? null,
      designerID: idp.designerID,
      companyName: company?.companyName ?? null,
    };
  }
}
