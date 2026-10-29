// Control: IDPPerformanceDashboardController
// Feature: IDP Performance Dashboard (Interior Designer)
//
// What goes here:
// - Daily grouping of view and like events for the logged-in designer's IDPs.
// - Like rate = likes / views (0 when views = 0).
// - Ranking of IDPs.
// - Filling days with no activity with 0 so the chart has no gaps.
//
// Constants:
// - MAX_DASHBOARD_DAYS (e.g. 90)
//
// Methods:
// - validateDateRange(startDate, endDate)   end after start, not longer than MAX_DASHBOARD_DAYS
// - getDashboard(designerID, startDate, endDate)
//     -> IDP.getIDPsByDesigner(designerID)
//     -> IDPView.getDailyViewCounts(idpID, startDate, endDate)
//     -> IDPLike.getDailyLikeCounts(idpID, startDate, endDate)
// - fillMissingDays(dailyCounts, startDate, endDate)
// - calculateLikeRate(likes, views)
// - rankIDPs(idpStats)                      sort by likes, then views, then like rate
//
// Entities used: IDP, IDPView, IDPLike
//
// Attributes: none
