// Control: GeneratePlatformReportController
// Feature: Generate Platform Report (Platform Management)
//
// What goes here:
// - Date range calculation for the chosen period, plus the previous period of the same length.
// - Aggregation across entities for both periods.
// - Comparison with the previous period.
//
// Constants:
// - REPORT_PERIODS = daily | weekly | monthly
//
// Report metrics (each for the current and previous period):
// - new customer accounts, new interior designer accounts   -> UserAccount.countNewAccounts(...)
// - designers verified                                      -> DesignerVerification.countVerified(...)
// - new IDPs                                                -> IDP.countIDPs(...)
// - IDP views                                               -> IDPView.countViews(...)
// - IDP likes                                               -> IDPLike.countLikes(...)
// - promotions created                                      -> Promotion.countPromotions(...)
//
// Methods:
// - validateReportRequest(period, referenceDate)   valid period, date not in the future
// - calculateDateRange(period, referenceDate)       returns { startDate, endDate }
// - calculatePreviousRange(period, startDate)       the period just before
// - calculateChange(current, previous)              % change; handle previous = 0
// - generateReport(period, referenceDate)           runs the above and returns the report
//
// Entities used: UserAccount, DesignerVerification, IDP, IDPView, IDPLike, Promotion
//
// Attributes: none
