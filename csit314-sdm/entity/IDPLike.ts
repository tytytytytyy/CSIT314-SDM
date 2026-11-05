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
// countLikes and getLikesByIDPs are not implemented yet.
import { readTable, writeTable } from "./LocalStore";

export interface IDPLikeData {
  likeID: string;
  customerID: string;
  idpID: number;
  likedAt: string;
}

export class IDPLike implements IDPLikeData {
  likeID!: string;
  customerID!: string;
  idpID!: number;
  likedAt!: string;

  constructor(data: IDPLikeData) {
    Object.assign(this, data);
  }

  static async isLiked(customerID: string, idpID: number): Promise<boolean> {
    return readTable<IDPLikeData>("idp_like").some(
      (r) => r.customerID === customerID && r.idpID === idpID,
    );
  }

  static async addLike(customerID: string, idpID: number): Promise<boolean> {
    const rows = readTable<IDPLikeData>("idp_like");
    const created: IDPLikeData = {
      likeID: `L${Date.now()}`,
      customerID,
      idpID,
      likedAt: new Date().toISOString(),
    };
    writeTable("idp_like", [...rows, created]);
    return true;
  }

  static async getLikesByCustomer(customerID: string): Promise<IDPLike[]> {
    return readTable<IDPLikeData>("idp_like")
      .filter((r) => r.customerID === customerID)
      .sort((a, b) => b.likedAt.localeCompare(a.likedAt))
      .map((r) => new IDPLike(r));
  }
}
