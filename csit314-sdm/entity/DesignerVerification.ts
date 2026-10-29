// Entity: DesignerVerification
// One verification request per interior designer account.
// Used by: Verify ID Accounts, Browse Interior Designers, Get Designer Recommendations,
//          Generate Platform Report
//
// Fixed values:
// - VERIFICATION_STATUS = pending | approved | rejected
//
// Database table: designer_verification
//
// Attributes:
// - verificationID, designerID (accountID), status, submittedAt,
//   reviewedBy (admin accountID), reviewedAt, rejectReason
//
// Methods:
// - getPendingVerifications()
// - getVerification(verificationID)
// - getVerificationByDesigner(designerID)
// - updateVerification(verification)
// - countVerified(startDate, endDate)                   platform report
