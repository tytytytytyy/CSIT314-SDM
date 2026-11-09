// Control: LoginController
// Feature: Log in / Log out (Customer and Interior Designer)
// User stories: C02 / ID02 log in, C03 / ID03 log out.
//
// What goes here:
// - Checks the email and password against the user account, and that the account is active.
// - Starts the session (SessionController) and tells the page where to go next.
// - The same message for an unknown email and a wrong password, so nobody can find out
//   which emails are registered.
//
// Fixed values:
// - HOME_PAGES = customer -> "/", designer -> "/designer/idp"
//
// Methods:
// - login(email, password)
//     -> UserAccount.getAccountByEmail(email)
//     -> SessionController.login(accountID, profileID)
//   returns { status: "ok", profileID, homePage }
//        or { status: "invalid" | "blocked", message }
// - logout()
//     -> SessionController.logout()
// - getHomePage()                           where the logged-in user starts; "/login" when logged out
// - getLoggedInDesignerCompany()            company name and logo for the designer menu bar;
//                                           null unless a designer is logged in
//     -> SessionController.getLoggedInDesignerID()
//     -> CompanyInformation.getCompanyInfo(designerID)
//
// Entities used: UserAccount, CompanyInformation
//
// Attributes: none
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
