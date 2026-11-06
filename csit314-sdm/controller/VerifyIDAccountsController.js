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

import { InteriorDesignerAccount } from "@/entity/InteriorDesignerAccount";
import { SessionController } from "@/controller/SessionController";
import { UserAccount } from "@/entity/UserAccount";

export class VerifyIDAccountsController {
  static async getAdminID() {
    const id = SessionController.getLoggedInAdminID();
    const admin = id ? await UserAccount.getAccount(id) : null;
    if (!admin || admin.profileID !== "admin" || admin.status !== "active") throw new Error("Please log in as an active user admin.");
    return id;
  }
  static async getPendingAccounts() {
    await this.getAdminID();
    return InteriorDesignerAccount.getPendingAccounts();
  }
  static async getAccountDetails(accountID) {
    await this.getAdminID();
    return InteriorDesignerAccount.getAccountDetails(accountID);
  }
  static async decide(accountID, status, reason) {
    try {
      const adminID = await this.getAdminID();
      const verification = InteriorDesignerAccount.updateVerification(accountID, status, adminID, reason);
      return { success: true, verification };
    } catch (error) {
      return { success: false, error: error instanceof Error && /required|reviewed|pending|log in|not found|Invalid/.test(error.message) ? error.message : "Update failed. Account status is unchanged. Please try again." };
    }
  }
  static approveAccount(accountID) { return this.decide(accountID, "active"); }
  static verifyAccount(accountID) { return this.approveAccount(accountID); }
  static rejectAccount(accountID, reason) { return this.decide(accountID, "rejected", reason); }
}
