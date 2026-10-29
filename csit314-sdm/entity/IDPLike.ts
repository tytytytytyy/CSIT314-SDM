// Entity: IDPLike
// One like by a customer on an IDP (unique per customer + IDP).
// Used by: Like IDP, View Favourites List, View IDP, Get Designer Recommendations,
//          IDP Performance Dashboard, Browse Interior Designers, Generate Platform Report
//
// Database table: idp_like   (unique key on customerID + idpID)
//
// Attributes:
// - likeID, idpID, customerID, likedAt
//
// Methods:
// - createLike(like)
// - deleteLike(likeID)                                  optional, for unlike
// - getLike(customerID, idpID)
// - getLikesByCustomer(customerID)
// - countLikes(idpID, startDate, endDate)
// - getDailyLikeCounts(idpID, startDate, endDate)       dashboard
