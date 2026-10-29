// Boundary: VerifyIDAccountsPg
// Feature: Verify ID Accounts (User Admin)
// User story: As a user admin, I want to verify pending interior designer accounts,
// so that only genuine firms can post IDPs.
//
// Suggested route: /user-admin/verify-accounts
//
// What goes here:
// - Page that lists pending interior designer accounts (firm name, contact, submitted date).
// - Detail view of one account's company information.
// - "Approve" and "Reject" buttons; Reject shows a text field for the reject reason.
// - No business rules here: everything is passed to VerifyIDAccountsController.
//
// Methods:
// - displayPendingAccounts(verifications)          show the list of pending accounts
// - displayAccountDetails(verification, companyInfo) show one account's details
// - submitApproval(verificationID)                 send approve to the controller
// - submitRejection(verificationID, rejectReason)  send reject + reason to the controller
// - displaySuccessPg()
// - displayErrorPg(message)                        e.g. "Reject reason is required"
//
// Attributes: none
