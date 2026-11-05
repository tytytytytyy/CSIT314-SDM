// Control: LikeIDPController
// Feature: Like IDP (Customer)
//
// What goes here:
// - Adds an IDP to the logged-in customer's favourites list, once only.
//
// Rules:
// - A customer can like the same IDP only once.
// - The boundary only calls this for a logged-in customer.
//
// Methods:
// - likeIDP(customerID, idpID)               true = added, false = already in favourites
//     -> IDPLike.isLiked(customerID, idpID)
//     -> IDPLike.addLike(customerID, idpID)
//
// Entities used: IDPLike
//
// Attributes: none
import { IDPLike } from "@/entity/IDPLike";

export class LikeIDPController {
  static async likeIDP(customerID, idpID) {
    if (await IDPLike.isLiked(customerID, idpID)) return false;
    return await IDPLike.addLike(customerID, idpID);
  }
}
