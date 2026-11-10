import { UserAccount } from "@/entity/UserAccount";
import { DesignerVerification } from "@/entity/DesignerVerification";
import { CompanyInformation } from "@/entity/CompanyInformation";
import { IDP } from "@/entity/IDP";
import { IDPLike } from "@/entity/IDPLike";
import { IDPPhoto } from "@/entity/IDPPhoto";

const MAX_TEXT_LENGTH = 100;

export class BrowseInteriorDesignersController {
  static SORT_OPTIONS = ["name", "mostIDPs", "mostLiked", "newest"];
  static MAX_SAMPLE_PHOTOS = 3;

  static getFilterOptions() {
    return {
      styles: [...IDP.STYLES],
      categories: [...IDP.CATEGORIES],
      sortOptions: [...this.SORT_OPTIONS],
    };
  }

  static validateFilters(filters = {}, sortBy = "name") {
    if (!this.SORT_OPTIONS.includes(sortBy)) return "Invalid sort option";
    for (const field of ["keyword", "location"]) {
      const value = filters[field] ?? "";
      if (typeof value !== "string") return `Invalid ${field}`;
      if (value.length > MAX_TEXT_LENGTH)
        return `The ${field} must be ${MAX_TEXT_LENGTH} characters or fewer`;
    }
    if (filters.designerID != null && typeof filters.designerID !== "string")
      return "Invalid designer";
    if (filters.style && !IDP.STYLES.includes(filters.style))
      return "Invalid style";
    if (filters.category && !IDP.CATEGORIES.includes(filters.category))
      return "Invalid category";
    return null;
  }

  static async browseDesigners(filters = {}, sortBy = "name") {
    const error = this.validateFilters(filters, sortBy);
    if (error) return { status: "invalid", message: error };

    const companies = await CompanyInformation.searchCompanies(filters);
    const designers = [];
    for (const company of companies) {
      if (filters.designerID && company.designerID !== filters.designerID) continue;
      const account = await UserAccount.getAccount(company.designerID);
      if (account?.status !== "active") continue;
      const verification =
        await DesignerVerification.getVerificationByDesigner(company.designerID);
      if (verification?.status !== "approved") continue;

      const idps = await IDP.getIDPsByDesigner(company.designerID);
      if (filters.style && !idps.some((i) => i.style === filters.style))
        continue;
      if (filters.category && !idps.some((i) => i.category === filters.category))
        continue;

      let totalLikes = 0;
      for (const idp of idps) totalLikes += await IDPLike.countLikes(idp.idpID);

      const samplePhotos = [];
      for (const idp of idps) {
        if (samplePhotos.length === this.MAX_SAMPLE_PHOTOS) break;
        const photos = await IDPPhoto.getPhotos(idp.idpID);
        if (photos[0])
          samplePhotos.push({
            idpID: idp.idpID,
            title: idp.title,
            photoURL: photos[0].photoURL,
          });
      }

      designers.push({
        designerID: company.designerID,
        companyName: company.companyName,
        description: company.description,
        location: company.location,
        logoURL: company.logoURL,
        styles: [...new Set(idps.map((i) => i.style))],
        categories: [...new Set(idps.map((i) => i.category))],
        idpCount: idps.length,
        totalLikes,
        joinedAt: account.createdAt,
        samplePhotos,
      });
    }
    return { status: "ok", designers: this.sortDesigners(designers, sortBy) };
  }

  static sortDesigners(designers, sortBy) {
    const byName = (a, b) => a.companyName.localeCompare(b.companyName);
    const compare = {
      name: byName,
      mostIDPs: (a, b) => b.idpCount - a.idpCount || byName(a, b),
      mostLiked: (a, b) => b.totalLikes - a.totalLikes || byName(a, b),
      newest: (a, b) => b.joinedAt.localeCompare(a.joinedAt),
    }[sortBy];
    return [...designers].sort(compare);
  }
}
