// Control: VerifyIDAccountsController
// Feature: Verify ID Accounts (User Admin)
//
// What goes here:
// - The verification status workflow: pending -> approved (account becomes active)
//   or pending -> rejected (account becomes rejected).
// - Records who reviewed it (logged-in admin ID from the session) and when.
//
// Rules:
// - Only a verification that is still "pending" can be approved or rejected.
// - A reject reason is required (not empty) when rejecting.
//
// Methods:
// - getPendingAccounts()
//     -> DesignerVerification.getPendingVerifications()
// - validateDecision(verificationID, decision, rejectReason)
//     check the verification exists and is still pending; check the reject reason when rejecting
// - verifyAccount(verificationID, adminID)
//     status = approved, reviewedBy = adminID, reviewedAt = now
//     -> DesignerVerification.updateVerification(verification)
//     -> UserAccount.updateStatus(accountID, "active")
// - rejectAccount(verificationID, adminID, rejectReason)
//     status = rejected, rejectReason, reviewedBy = adminID, reviewedAt = now
//     -> DesignerVerification.updateVerification(verification)
//     -> UserAccount.updateStatus(accountID, "rejected")
//
// Entities used: DesignerVerification, UserAccount, CompanyInformation
//
// Attributes: none
