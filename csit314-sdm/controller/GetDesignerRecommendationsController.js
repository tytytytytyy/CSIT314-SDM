// Control: GetDesignerRecommendationsController
// Feature: Get Designer Recommendations (Customer) - the recommendation algorithm
//
// What goes here:
// 1. Style weighting from likes: for each style the customer liked,
//    weight = likes in that style / total likes.
//    (Styles come from IDP.style; IDPCategory is not implemented yet.)
// 2. Scoring: for each verified designer, score = sum of the weights of the styles
//    of their IDPs. A designer with two Scandinavian IDPs counts the Scandinavian weight twice.
// 3. Ranking: drop designers with score 0, sort by score (highest first), ties broken by the
//    designer's total likes, then company name; return the top MAX_RECOMMENDATIONS.
// 4. Cold start fallback: if the customer has fewer than MIN_LIKES_FOR_RECOMMENDATION likes
//    (likes on deleted IDPs do not count), return the most-liked verified designers instead.
//    The same fallback is used if no verified designer matches any liked style.
//
// Verified designer = account status "active" and verification status "approved".
//
// Constants:
// - MAX_RECOMMENDATIONS = 5
// - MIN_LIKES_FOR_RECOMMENDATION = 3
// - MAX_SAMPLE_PHOTOS = 3
// - MAX_TOP_STYLES = 3
//
// Methods:
// - getRecommendations(customerID)
//     -> IDPLike.getLikesByCustomer(customerID)
//     -> IDP.getIDP(idpID) for each liked IDP
//   returns { status: "personalised", recommendations }
//        or { status: "coldStart", likesNeeded, recommendations }
//           likesNeeded = how many more likes until personalised picks (0 = no style matched)
// - calculateStyleWeights(likedIDPs)                  { style: weight }
// - calculateDesignerScore(styleWeights, designerIDPs)
// - rankDesigners(scoredDesigners)
// - getColdStartRecommendations()
// - getVerifiedDesigners()                            helper shared by both paths
//     -> CompanyInformation.searchCompanies({})
//     -> UserAccount.getAccount(designerID)
//     -> DesignerVerification.getVerificationByDesigner(designerID)
//     -> IDP.getIDPsByDesigner(designerID)
//     -> IDPLike.countLikes(idpID)
//     -> IDPPhoto.getPhotos(idpID)
//
// Each recommendation: designerID, companyName, logoURL, location, topStyles, samplePhotos,
// totalLikes, score, reason (e.g. "Because you liked Scandinavian projects").
//
// Entities used: IDPLike, IDP, IDPPhoto, UserAccount, DesignerVerification, CompanyInformation
//
// Attributes: none
import { IDP } from "@/entity/IDP";
import { IDPLike } from "@/entity/IDPLike";
import { IDPPhoto } from "@/entity/IDPPhoto";
import { UserAccount } from "@/entity/UserAccount";
import { DesignerVerification } from "@/entity/DesignerVerification";
import { CompanyInformation } from "@/entity/CompanyInformation";

function joinStyles(styles) {
  if (styles.length <= 1) return styles.join("");
  return `${styles.slice(0, -1).join(", ")} and ${styles.at(-1)}`;
}

export class GetDesignerRecommendationsController {
  static MAX_RECOMMENDATIONS = 5;
  static MIN_LIKES_FOR_RECOMMENDATION = 3;
  static MAX_SAMPLE_PHOTOS = 3;
  static MAX_TOP_STYLES = 3;

  static async getRecommendations(customerID) {
    const likes = await IDPLike.getLikesByCustomer(customerID);
    const likedIDPs = [];
    for (const like of likes) {
      const idp = await IDP.getIDP(like.idpID);
      if (idp) likedIDPs.push(idp); // skip IDPs the designer deleted
    }

    if (likedIDPs.length < this.MIN_LIKES_FOR_RECOMMENDATION) {
      return {
        status: "coldStart",
        likesNeeded: this.MIN_LIKES_FOR_RECOMMENDATION - likedIDPs.length,
        recommendations: await this.getColdStartRecommendations(),
      };
    }

    const styleWeights = this.calculateStyleWeights(likedIDPs);
    const designers = await this.getVerifiedDesigners();
    const scored = designers.map((d) => {
      const score = this.calculateDesignerScore(styleWeights, d.idps);
      const matchedStyles = [...new Set(d.idps.map((i) => i.style))]
        .filter((s) => styleWeights[s])
        .sort((a, b) => styleWeights[b] - styleWeights[a])
        .slice(0, 2);
      return {
        ...d,
        score,
        reason: `Because you liked ${joinStyles(matchedStyles)} projects`,
      };
    });
    const ranked = this.rankDesigners(scored);

    if (ranked.length === 0) {
      return {
        status: "coldStart",
        likesNeeded: 0,
        recommendations: await this.getColdStartRecommendations(),
      };
    }
    return {
      status: "personalised",
      recommendations: ranked.map((d) => this.toRecommendation(d)),
    };
  }

  // Share of the customer's likes that went to each style. The weights add up to 1.
  static calculateStyleWeights(likedIDPs) {
    const weights = {};
    if (likedIDPs.length === 0) return weights;
    for (const idp of likedIDPs)
      weights[idp.style] = (weights[idp.style] ?? 0) + 1;
    for (const style of Object.keys(weights))
      weights[style] = weights[style] / likedIDPs.length;
    return weights;
  }

  static calculateDesignerScore(styleWeights, designerIDPs) {
    return designerIDPs.reduce(
      (sum, idp) => sum + (styleWeights[idp.style] ?? 0),
      0,
    );
  }

  static rankDesigners(scoredDesigners) {
    return scoredDesigners
      .filter((d) => d.score > 0)
      .sort(
        (a, b) =>
          b.score - a.score ||
          b.totalLikes - a.totalLikes ||
          a.companyName.localeCompare(b.companyName),
      )
      .slice(0, this.MAX_RECOMMENDATIONS);
  }

  // Most-liked verified designers, for customers who have not liked enough IDPs yet.
  static async getColdStartRecommendations() {
    const designers = await this.getVerifiedDesigners();
    return designers
      .sort(
        (a, b) =>
          b.totalLikes - a.totalLikes ||
          a.companyName.localeCompare(b.companyName),
      )
      .slice(0, this.MAX_RECOMMENDATIONS)
      .map((d) =>
        this.toRecommendation({
          ...d,
          score: 0,
          reason:
            d.totalLikes > 0
              ? `Popular with customers: ${d.totalLikes} ${d.totalLikes === 1 ? "like" : "likes"}`
              : "New on the platform",
        }),
      );
  }

  // Every verified designer with their IDPs, total likes and sample photos.
  static async getVerifiedDesigners() {
    const companies = await CompanyInformation.searchCompanies({});
    const designers = [];
    for (const company of companies) {
      const account = await UserAccount.getAccount(company.designerID);
      if (account?.status !== "active") continue;
      const verification =
        await DesignerVerification.getVerificationByDesigner(company.designerID);
      if (verification?.status !== "approved") continue;

      const idps = await IDP.getIDPsByDesigner(company.designerID);
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

      designers.push({ company, idps, totalLikes, samplePhotos });
    }
    return designers.map(({ company, idps, totalLikes, samplePhotos }) => ({
      designerID: company.designerID,
      companyName: company.companyName,
      logoURL: company.logoURL,
      location: company.location,
      idps,
      totalLikes,
      samplePhotos,
    }));
  }

  // The designer's styles, most IDPs first.
  static getTopStyles(idps) {
    const counts = {};
    for (const idp of idps) counts[idp.style] = (counts[idp.style] ?? 0) + 1;
    return Object.keys(counts)
      .sort((a, b) => counts[b] - counts[a] || a.localeCompare(b))
      .slice(0, this.MAX_TOP_STYLES);
  }

  static toRecommendation(d) {
    return {
      designerID: d.designerID,
      companyName: d.companyName,
      logoURL: d.logoURL,
      location: d.location,
      topStyles: this.getTopStyles(d.idps),
      samplePhotos: d.samplePhotos,
      totalLikes: d.totalLikes,
      score: d.score,
      reason: d.reason,
    };
  }
}
