// Control: IDPPerformanceDashboardController
// Feature: IDP Performance Dashboard (Interior Designer)
//
// What goes here:
// - Daily grouping of view and like events for the logged-in designer's IDPs.
// - Filling days with no activity with 0 so the chart has no gaps.
// - Like rate = likes / views (0 when views = 0).
// - Ranking of IDPs.
//
// Methods:
// - validateDateRange(startDate, endDate)   false if the end date is before the start date
// - getDashboard(designerID, startDate, endDate)   null if the designer has no IDPs
//     -> IDP.getIDPsByDesigner(designerID)
//     -> IDPView.getViewsByIDPs(idpIDs, startDate, endDate)
//     -> IDPLike.getLikesByIDPs(idpIDs, startDate, endDate)
//     then for each IDP: groupEventsByDay, fillMissingDays, calculateLikeRate; then rankIDPs
// - groupEventsByDay(views, likes)           one IDP's events -> DailyCount[] (days with events only)
// - fillMissingDays(dailyCounts, startDate, endDate)   adds 0-view, 0-like days
// - calculateLikeRate(likes, views)          0 when views = 0
// - rankIDPs(idpStats)                       sort by total likes, then total views
//
// Returned data (not entities):
// - PerformanceDashboard { startDate, endDate, idpStats: IDPStats[] }
// - IDPStats { idpID, title, dailyCounts: DailyCount[], totalViews, totalLikes, likeRate, rank }
// - DailyCount { date, views, likes }
//
// Entities used: IDP, IDPView, IDPLike
//
// Attributes: none
