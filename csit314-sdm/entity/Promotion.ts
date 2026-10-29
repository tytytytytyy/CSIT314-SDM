// Entity: Promotion
// A period during which an IDP is promoted (shown first to customers).
// Active = today is between startDate and endDate, so promotions expire automatically.
// Used by: Promote IDP, IDP search / browse ordering, Generate Platform Report
//
// Database table: promotion
//
// Attributes:
// - promotionID, idpID, startDate, endDate, createdBy (platform manager accountID)
//
// Methods:
// - createPromotion(promotion)
// - countActivePromotions()
// - getActivePromotions()
// - countPromotions(startDate, endDate)                 platform report
