// Entity: IDPView
// One view event, recorded when a customer opens an IDP.
// Used by: View IDP, IDP Performance Dashboard, Generate Platform Report
//
// Database table: idp_view
//
// Attributes:
// - viewID, idpID, customerID (null if not logged in), viewedAt
//
// Methods:
// - createView(idpID, customerID)                       View IDP records one view
// - getViewsByIDPs(idpIDs, startDate, endDate)          dashboard (raw events; the controller groups by day)

import { readTable, writeTable } from "./LocalStore";
import { isWithinDates } from "@/lib/dates";

export class IDPView {
  viewID;
  idpID;
  customerID;
  viewedAt;

  constructor(data) {
    Object.assign(this, data);
  }

  // Saves one view of an IDP and returns it.
  static async createView(idpID, customerID) {
    const rows = readTable("idp_view");
    const created = {
      viewID: `V${Date.now()}${Math.floor(Math.random() * 1000)}`,
      idpID,
      customerID: customerID ?? null,
      viewedAt: new Date().toISOString(),
    };
    writeTable("idp_view", [...rows, created]);
    return new IDPView(created);
  }

  // All views of the given IDPs between startDate and endDate (both included, "YYYY-MM-DD").
  static async getViewsByIDPs(idpIDs, startDate, endDate) {
    return readTable("idp_view")
      .filter((r) => idpIDs.includes(r.idpID) && isWithinDates(r.viewedAt, startDate, endDate))
      .map((r) => new IDPView(r));
  }
  
  //Counts views between the dates for report
  static async countViews(idpID, startDate, endDate) {
    return readTable("idp_view").filter(
        (r) =>
        (!idpID || r.idpID === idpID) &&
        (!startDate || r.viewedAt >= startDate) &&
        (!endDate || r.viewedAt <= endDate),
    ).length;
    }
}
