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
// - deleteIDP(idpID)                                    used to undo a failed Create IDP
//
// Implemented so far: getIDP (View IDP, Like IDP, View Favourites List),
// getIDPsByDesigner (ID View IDP Details), updateIDP (ID Update IDP),
// createIDP and deleteIDP (ID Create IDP).
//
// Fixed values:
// - STATUSES       = ongoing | completed   (shown as "In Progress" / "Completed")
// - CATEGORIES     = Residential | Commercial
// - PROPERTY_TYPES = HDB, Condo, Landed (Residential); Office, Retail, F&B (Commercial)
// - STYLES         = Scandinavian, Industrial, Minimalist, ...
import { readTable, writeTable } from "./LocalStore";

export class IDP {
  static STATUSES = ["ongoing", "completed"];
  static CATEGORIES = ["Residential", "Commercial"];
  static PROPERTY_TYPES = {
    Residential: ["HDB", "Condo", "Landed"],
    Commercial: ["Office", "Retail", "F&B"],
  };
  static STYLES = [
    "Scandinavian",
    "Industrial",
    "Minimalist",
    "Modern Luxury",
    "Japandi",
    "Contemporary",
    "Tropical",
    "Mid-Century Modern",
    "Peranakan",
  ];

  idpID;
  designerID;
  title;
  description;
  style;
  propertyType;
  category;
  budget;
  status;

  constructor(data) {
    Object.assign(this, data);
  }

  static async getIDP(idpID) {
    const row = readTable("idp").find((r) => r.idpID === idpID);
    return row ? new IDP(row) : null;
  }

  // All IDPs owned by one designer, in idpID order.
  static async getIDPsByDesigner(designerID) {
    return readTable("idp")
      .filter((r) => r.designerID === designerID)
      .sort((a, b) => a.idpID - b.idpID)
      .map((r) => new IDP(r));
  }

  // Saves a new IDP with the next free idpID and returns it.
  static async createIDP(idp) {
    const sequence = readTable("idp_sequence")[0] ?? { lastIDPID: 0 };
    const rows = readTable("idp");
    const idpID = Math.max(sequence.lastIDPID, ...rows.map((r) => r.idpID)) + 1;
    const created = { ...idp, idpID };
    writeTable("idp", [...rows, created]);
    writeTable("idp_sequence", [{ lastIDPID: idpID }]);
    return new IDP(created);
  }

  // Removes an IDP. False if there is no such IDP.
  static async deleteIDP(idpID) {
    const rows = readTable("idp");
    const remaining = rows.filter((r) => r.idpID !== idpID);
    if (remaining.length === rows.length) return false;
    writeTable("idp", remaining);
    return true;
  }

  // Saves new values for an existing IDP (matched by idpID). False if there is no such IDP.
  static async updateIDP(idp) {
    const rows = readTable("idp");
    const index = rows.findIndex((r) => r.idpID === idp.idpID);
    if (index === -1) return false;
    const updated = [...rows];
    updated[index] = { ...idp };
    writeTable("idp", updated);
    return true;
  }
}
