// Control: PromoteIDPController
// Feature: Promote IDP (Platform Management)
//
// What goes here:
// - Date rules, the cap on active promotions, and creating the promotion.
// - Auto-expiry: a promotion counts as active only while today is between
//   startDate and endDate, so it expires on its own without a status update.
// - Active promotions are shown first to customers (used by IDP search / browse).
//
// Constants:
// - MAX_ACTIVE_PROMOTIONS = 10
//
// Rules:
// - The IDP must exist.
// - startDate must be today or later; endDate must be after startDate.
// - The IDP must not already have a promotion that overlaps the chosen dates.
// - Active promotions must be below MAX_ACTIVE_PROMOTIONS.
//
// Methods:
// - validatePromotion(idpID, startDate, endDate)
//     -> IDP.getIDP(idpID)
//     -> Promotion.countActivePromotions()
//     -> Promotion.getActivePromotions()   (overlap check)
// - promoteIDP(idpID, startDate, endDate)
//     createdBy = logged-in platform manager ID from the session
//     -> Promotion.createPromotion(promotion)
//
// Entities used: Promotion, IDP
//
// Attributes: none
