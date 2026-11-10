import { IDPLike } from "@/entity/IDPLike";

export class LikeIDPController {
  static async isLiked(customerID, idpID) {
    if (!customerID) return false;
    return await IDPLike.isLiked(customerID, idpID);
  }

  static async likeIDP(customerID, idpID) {
    if (await IDPLike.isLiked(customerID, idpID)) return false;
    return await IDPLike.addLike(customerID, idpID);
  }

  static async unlikeIDP(customerID, idpID) {
    return await IDPLike.removeLike(customerID, idpID);
  }
}
