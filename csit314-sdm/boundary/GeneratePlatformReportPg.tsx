// Boundary: GeneratePlatformReportPg
// Feature: Generate Platform Report (Platform Management)
// User story: As a platform manager, I want to generate a platform report for a chosen
// period (e.g. daily, weekly, monthly), so that I can track how the platform is performing.
//
// Suggested route: /platform-manager/report
//
// What goes here:
// - Period selector (daily / weekly / monthly) and a reference date.
// - "Generate" button that calls GeneratePlatformReportController.
// - Report display: each metric with its current value, previous period value,
//   and the change (up / down %).
//
// Methods:
// - displayReportForm()
// - submitReportRequest(period, referenceDate)
// - displayReport(report)
// - displayErrorPg(message)          e.g. "Date cannot be in the future"
//
// Attributes: none
