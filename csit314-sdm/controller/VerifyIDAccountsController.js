import { InteriorDesignerAccount } from "@/entity/InteriorDesignerAccount";
import { SessionController } from "@/controller/SessionController";
import { UserAccount } from "@/entity/UserAccount";
import { ACRARegistry } from "@/entity/ACRARegistry";

export class VerifyIDAccountsController {
  static async getAdminID() {
    const id = SessionController.getLoggedInAdminID();
    const admin = id ? await UserAccount.getAccount(id) : null;
    if (!admin || admin.profileID !== "admin" || admin.status !== "active") throw new Error("Please log in as an active user admin.");
    return id;
  }
  static async getAccounts(status = "all") {
    await this.getAdminID();
    return InteriorDesignerAccount.getAccounts(status);
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

  // ---- Automatic ACRA check ----
  // Endings that do not change who the company is ("Pte. Ltd.", "LLP", ...).
  static COMPANY_ENDINGS = ["PTE LTD", "PRIVATE LIMITED", "PTE", "LTD", "LIMITED", "LLP", "LLC", "INC"];

  // "Habitat & Co. Pte. Ltd." -> "HABITAT AND CO", so names compare fairly.
  static normaliseCompanyName(name) {
    let text = String(name ?? "").toUpperCase().replace(/&/g, " AND ").replace(/[^A-Z0-9 ]/g, " ")
      .replace(/\s+/g, " ").trim();
    let removed = true;
    while (removed) {
      removed = false;
      for (const ending of this.COMPANY_ENDINGS) {
        if (text === ending || !text.endsWith(" " + ending)) continue;
        text = text.slice(0, -(ending.length + 1)).trim();
        removed = true;
      }
    }
    return text;
  }

  // Looks the account's UEN up in the ACRA register.
  // result: "matched" | "nameMismatch" | "notFound" | "struckOff"
  static async checkUENWithACRA(accountID) {
    await this.getAdminID();
    const { company } = InteriorDesignerAccount.getAccountDetails(accountID);
    const record = await ACRARegistry.findByUEN(company?.registrationNumber);
    if (!record) return { accountID, result: "notFound", registeredName: null, registryStatus: null };
    const base = { accountID, registeredName: record.entityName, registryStatus: record.status };
    if (record.status !== "live") return { ...base, result: "struckOff" };
    const same = this.normaliseCompanyName(record.entityName) === this.normaliseCompanyName(company?.companyName);
    return { ...base, result: same ? "matched" : "nameMismatch" };
  }

  // Checks every pending account: matched ones are approved automatically (reviewed by SYSTEM),
  // the rest stay pending for the admin to review by hand.
  static async runACRACheck() {
    try {
      await this.getAdminID();
      const approved = [];
      const flagged = [];
      for (const { account, company } of InteriorDesignerAccount.getPendingAccounts()) {
        const check = await this.checkUENWithACRA(account.accountID);
        const companyName = company?.companyName ?? account.accountID;
        if (check.result === "matched") {
          InteriorDesignerAccount.updateVerification(account.accountID, "active", "SYSTEM");
          approved.push({ accountID: account.accountID, companyName });
        } else {
          flagged.push({ ...check, companyName });
        }
      }
      return { success: true, approved, flagged };
    } catch (error) {
      return { success: false, error: error instanceof Error && /log in/.test(error.message) ? error.message : "ACRA check failed. No accounts were changed after the error. Please try again." };
    }
  }
}
