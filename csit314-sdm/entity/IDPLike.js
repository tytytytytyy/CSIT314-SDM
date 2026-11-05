// Entity: IDPLike
// One like by a customer on an IDP (unique per customer + IDP). The customer's
// favourites list is the set of their likes.
// Used by: Like IDP, View Favourites List, View IDP, Get Designer Recommendations,
//          IDP Performance Dashboard, Browse Interior Designers, Generate Platform Report
//
// Database table: idp_like   (unique key on customerID + idpID)
//
// Attributes:
// - likeID, customerID, idpID, likedAt
//
// Methods:
// - isLiked(customerID, idpID)                          has this customer already liked it?
// - addLike(customerID, idpID)                          true once the like is saved
// - getLikesByCustomer(customerID)                      newest first
// - countLikes(idpID, startDate, endDate)
// - getLikesByIDPs(idpIDs, startDate, endDate)          dashboard (raw events; the controller groups by day)
//
// countLikes: startDate / endDate are optional; leave them out to count every like.
// getLikesByIDPs is not implemented yet.
import { readTable, writeTable } from "./LocalStore";

export class IDPLike {
  likeID;
  customerID;
  idpID;
  likedAt;

  constructor(data) {
    Object.assign(this, data);
  }

  static async isLiked(customerID, idpID) {
    return readTable("idp_like").some(
      (r) => r.customerID === customerID && r.idpID === idpID,
    );
  }

  static async addLike(customerID, idpID) {
    const rows = readTable("idp_like");
    const created = {
      likeID: `L${Date.now()}`,
      customerID,
      idpID,
      likedAt: new Date().toISOString(),
    };
    writeTable("idp_like", [...rows, created]);
    return true;
  }

  // Number of likes on one IDP, optionally only those liked between startDate and endDate
  // (inclusive, ISO date strings).
  static async countLikes(idpID, startDate, endDate) {
    return readTable("idp_like").filter(
      (r) =>
        r.idpID === idpID &&
        (!startDate || r.likedAt >= startDate) &&
        (!endDate || r.likedAt <= endDate),
    ).length;
  }

  static async getLikesByCustomer(customerID) {
    return readTable("idp_like")
      .filter((r) => r.customerID === customerID)
      .sort((a, b) => b.likedAt.localeCompare(a.likedAt))
      .map((r) => new IDPLike(r));
  }
}
