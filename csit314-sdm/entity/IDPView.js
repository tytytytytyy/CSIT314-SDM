// Entity: IDPView
// One view event, recorded when a customer opens an IDP.
// Used by: View IDP, IDP Performance Dashboard, Generate Platform Report
//
// Database table: idp_view
//
// Attributes:
// - viewID, idpID, customerID, viewedAt
//
// Methods:
// - createView(view)
// - countViews(idpID, startDate, endDate)
// - getViewsByIDPs(idpIDs, startDate, endDate)          dashboard (raw events; the controller groups by day)

export class IDPView {
    //attributes

    //constructor

    static async countViews(idpID, startDate, endDate) {
    return readTable("idp_view").filter(
        (r) =>
        (!idpID || r.idpID === idpID) &&
        (!startDate || r.viewedAt >= startDate) &&
        (!endDate || r.viewedAt <= endDate),
    ).length;
    }
}