import { UserAccount } from "@/entity/UserAccount";
import { CompanyInformation } from "@/entity/CompanyInformation";
import { SessionController } from "@/controller/SessionController";

const HOME_PAGES = {
  customer: "/",
  designer: "/designer/idp",
  admin: "/user-admin/verify-id-accounts",
  platformManager: "/platform-manager/report",
};

const BLOCKED_MESSAGES = {
  pending: "Your account is waiting for verification",
  suspended: "Your account has been suspended",
  rejected: "Your account was not approved",
};

export class LoginController {
  static HOME_PAGES = HOME_PAGES;

  static async login(email, password) {
    const trimmedEmail = (email ?? "").trim();
    if (!trimmedEmail || !password) {
      return { status: "invalid", message: "Please enter your email and password" };
    }

    const account = await UserAccount.getAccountByEmail(trimmedEmail);
    // All supported roles use the same credential and account-status checks.
    if (!account || !account.password || account.password !== password || !HOME_PAGES[account.profileID]) {
      return { status: "invalid", message: "Incorrect email or password" };
    }
    if (account.status !== "active") {
      return { status: "blocked", message: BLOCKED_MESSAGES[account.status] ?? "This account cannot log in" };
    }

    SessionController.login(account.accountID, account.profileID);
    return { status: "ok", profileID: account.profileID, homePage: HOME_PAGES[account.profileID] };
  }

  static logout() {
    SessionController.logout();
  }

  static getHomePage() {
    const account = SessionController.getLoggedInAccount();
    return account ? HOME_PAGES[account.profileID] ?? "/login" : "/login";
  }

  static async getLoggedInDesignerCompany() {
    const designerID = SessionController.getLoggedInDesignerID();
    if (!designerID) return null;
    const company = await CompanyInformation.getCompanyInfo(designerID);
    return company ? { companyName: company.companyName, logoURL: company.logoURL } : null;
  }
}
