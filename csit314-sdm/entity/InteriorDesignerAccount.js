import { readTable, writeTables } from "./LocalStore";

export class InteriorDesignerAccount {
  static getAccountDetails(accountID) {
    const account = readTable("user_account").find(r => r.accountID === accountID && r.profileID === "designer");
    if (!account) throw new Error("Interior designer account not found.");
    return { account, company: readTable("company_information").find(r => r.designerID === accountID) ?? null,
      verification: readTable("designer_verification").find(r => r.designerID === accountID) ?? null };
  }

  // True only for a designer whose account is active and whose verification was approved,
  // i.e. one whose IDPs customers may see. False for pending, suspended, rejected or unknown IDs.
  static async isActiveAndVerified(accountID) {
    const account = readTable("user_account").find(r => r.accountID === accountID && r.profileID === "designer");
    const verification = readTable("designer_verification").find(r => r.designerID === accountID);
    return account?.status === "active" && verification?.status === "approved";
  }
  static getAccounts(status = "all") {
    if (!["all", "pending", "active", "rejected", "suspended"].includes(status)) {
      throw new Error("Invalid account status.");
    }
    return readTable("user_account")
      .filter(row => row.profileID === "designer" && (status === "all" || row.status === status))
      .map(row => this.getAccountDetails(row.accountID));
  }

  static getPendingAccounts() {
    return readTable("user_account").filter(r => r.profileID === "designer" && r.status === "pending")
      .map(r => this.getAccountDetails(r.accountID)).filter(r => r.verification?.status === "pending");
  }

  static updateVerification(accountID, status, adminID, reason) {
    const { account, verification } = this.getAccountDetails(accountID);
    if (account.status !== "pending" || verification?.status !== "pending") throw new Error("Account already reviewed or no longer pending.");
    if (!["active", "rejected"].includes(status)) throw new Error("Invalid decision.");
    if (status === "rejected" && (typeof reason !== "string" || !reason.trim())) throw new Error("Rejection reason is required.");
    const reviewedAt = new Date().toISOString();
    const updated = { ...verification, status: status === "active" ? "approved" : "rejected", reviewedBy: adminID, reviewedAt, rejectReason: status === "rejected" ? reason.trim() : null };
    writeTables({
      user_account: readTable("user_account").map(r => r.accountID === accountID ? { ...r, status } : r),
      designer_verification: readTable("designer_verification").map(r => r.verificationID === verification.verificationID ? updated : r),
    });
    return updated;
  }
}
