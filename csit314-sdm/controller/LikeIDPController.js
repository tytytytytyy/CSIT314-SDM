// Control: LikeIDPController
// Feature: Like IDP / Unlike IDP (Customer)
//
// What goes here:
// - Adds an IDP to the logged-in customer's favourites list, once only.
// - Removes an IDP from the customer's favourites list (unlike).
//
// Rules:
// - A customer can like the same IDP only once.
// - The boundary only calls this for a logged-in customer.
//
// Methods:
// - isLiked(customerID, idpID)               is the IDP in the customer's favourites?
//     -> IDPLike.isLiked(customerID, idpID)
// - likeIDP(customerID, idpID)               true = added, false = already in favourites
//     -> IDPLike.isLiked(customerID, idpID)
//     -> IDPLike.addLike(customerID, idpID)
// - unlikeIDP(customerID, idpID)             true = removed, false = was not in favourites
//     -> IDPLike.removeLike(customerID, idpID)
//
// Entities used: IDPLike
//
// Attributes: none
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
