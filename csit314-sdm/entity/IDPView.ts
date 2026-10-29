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
// - getDailyViewCounts(idpID, startDate, endDate)       dashboard
