// Control: LikeIDPController
// Feature: Like IDP (Customer)
//
// What goes here:
// - Saves a like from the logged-in customer. Likes feed the favourites list,
//   recommendations, the dashboard and the platform report.
//
// Rules:
// - Only a logged-in customer can like an IDP.
// - The IDP must exist and be visible (designer verified).
// - A customer can like the same IDP only once.
//
// Methods:
// - validateLike(idpID, customerID)
//     -> IDP.getIDP(idpID)
//     -> IDPLike.getLike(customerID, idpID)    duplicate check
// - likeIDP(idpID, customerID)
//     -> IDPLike.createLike(like)
// - unlikeIDP(idpID, customerID)               optional
//     -> IDPLike.deleteLike(likeID)
//
// Entities used: IDPLike, IDP
//
// Attributes: none
