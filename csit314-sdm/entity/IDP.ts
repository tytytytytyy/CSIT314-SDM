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
// Implemented so far: getIDP (View IDP, Like IDP, View Favourites List),
// getIDPsByDesigner (ID View IDP Details), updateIDP (ID Update IDP).
//
// Fixed values:
// - STATUSES       = ongoing | completed   (shown as "In Progress" / "Completed")
// - CATEGORIES     = Residential | Commercial
// - PROPERTY_TYPES = HDB, Condo, Landed (Residential); Office, Retail, F&B (Commercial)
// - STYLES         = Scandinavian, Industrial, Minimalist, ...
import { readTable, writeTable } from "./LocalStore";

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
  static readonly STATUSES = ["ongoing", "completed"] as const;
  static readonly CATEGORIES = ["Residential", "Commercial"] as const;
  static readonly PROPERTY_TYPES = {
    Residential: ["HDB", "Condo", "Landed"],
    Commercial: ["Office", "Retail", "F&B"],
  } as const;
  static readonly STYLES = [
    "Scandinavian", "Industrial", "Minimalist", "Modern Luxury", "Japandi",
    "Contemporary", "Tropical", "Mid-Century Modern", "Peranakan",
  ] as const;

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

  // All IDPs owned by one designer, in idpID order.
  static async getIDPsByDesigner(designerID: string): Promise<IDP[]> {
    return readTable<IDPData>("idp")
      .filter((r) => r.designerID === designerID)
      .sort((a, b) => a.idpID - b.idpID)
      .map((r) => new IDP(r));
  }

  // Saves new values for an existing IDP (matched by idpID). False if there is no such IDP.
  static async updateIDP(idp: IDPData): Promise<boolean> {
    const rows = readTable<IDPData>("idp");
    const index = rows.findIndex((r) => r.idpID === idp.idpID);
    if (index === -1) return false;
    const updated = [...rows];
    updated[index] = { ...idp };
    writeTable("idp", updated);
    return true;
  }
}
