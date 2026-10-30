// Entity: IDP (Interior Design Project)
// A project posted by an interior designer.
// Used by: Create / Update / View IDP, Promote IDP, IDP Performance Dashboard, Like IDP,
//          View Favourites List, Browse Interior Designers, Get Designer Recommendations,
//          Generate Platform Report
//
// Database table: idp
//
// Attributes:
// - idpID, designerID, title, description, style, propertyType, category, budget, status
//   (status = ongoing | completed)
//
// Methods:
// - getIDP(idpID)                                       null if there is no such IDP (e.g. the designer deleted it)
// - createIDP(idp)
// - updateIDP(idp)
// - searchIDPs(criteria)                                active promotions listed first
// - getIDPsByDesigner(designerID)
// - countIDPs(startDate, endDate)                       platform report
//
// Only getIDP is implemented so far (View IDP, Like IDP, View Favourites List).
import { readTable } from "./LocalStore";

export interface IDPData {
  idpID: number;
  designerID: string;
  title: string;
  description: string;
  style: string;
  propertyType: string;
  category: string;
  budget: number;
  status: "ongoing" | "completed";
}

export class IDP implements IDPData {
  idpID!: number;
  designerID!: string;
  title!: string;
  description!: string;
  style!: string;
  propertyType!: string;
  category!: string;
  budget!: number;
  status!: "ongoing" | "completed";

  constructor(data: IDPData) {
    Object.assign(this, data);
  }

  static async getIDP(idpID: number): Promise<IDP | null> {
    const row = readTable<IDPData>("idp").find((r) => r.idpID === idpID);
    return row ? new IDP(row) : null;
  }
}
