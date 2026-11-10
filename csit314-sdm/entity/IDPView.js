import { readTable, writeTable } from "./LocalStore";
import { isWithinDateRange, isWithinDates } from "@/lib/dates";

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
      (row) =>
        (!idpID || row.idpID === idpID) &&
        isWithinDateRange(row.viewedAt, startDate, endDate),
    ).length;
  }
}
