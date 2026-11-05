// Boundary: IDPPerformanceDashboardPg
// Feature: IDP Performance Dashboard (Interior Designer)
// User story (ID17): As an interior designer, I want to view a performance dashboard for my IDPs,
// so that I know which projects attract the most customer interest.
//
// Suggested route: /designer/dashboard
//
// What goes here:
// - Date range picker, default the last 30 days, with a "View" button.
// - Daily chart of views and likes (days with no activity shown as 0).
// - Table ranking the designer's IDPs by likes (views break ties), with each IDP's like rate.
//
// Methods:
// - viewDashboard()                          opens the page with the default date range
// - submitDateRange(startDate, endDate)
//     -> IDPPerformanceDashboardController.validateDateRange(startDate, endDate)
//     -> IDPPerformanceDashboardController.getDashboard(designerID, startDate, endDate)
// - displayDashboard(dashboard)
// - displayInvalidDateRangeMsg()             "Invalid date range" (end date before start date)
// - displayNoIDPsMsg()                       "You have no projects yet"
//
// Attributes: none
