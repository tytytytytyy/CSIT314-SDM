// Control: SessionController
// Remembers who is logged in (set by LoginController) and which pages need which role.
// The session is kept in localStorage, so it lasts until the user logs out and is shared by
// every tab of the same browser. Use a private window to be logged in as a second user.
//
// Rules / fixed values:
// - Customer pages: "/" and "/customer/..."      need a logged-in customer
// - Designer pages: "/designer/..."              need a logged-in designer
// - Every other page (log in, user admin, platform manager) needs no login here; the user admin
//   and platform manager pages still use their own test log in buttons.
// - DEMO_ADMIN_ID = A1                           the user admin side is always "logged in" as A1
//                                                for now (TEST stub until admins use the login page)
//
// Methods:
// - login(accountID, profileID)             called by LoginController after the password check
// - logout()
// - getLoggedInAccount()                    { accountID, profileID }, or null when logged out
// - getLoggedInCustomerID()                 null unless a customer is logged in
// - getLoggedInDesignerID()                 null unless a designer is logged in
// - getLoggedInADMINID()                    always A1 for now (Verify ID Accounts)
// - getRequiredProfile(pathname)            "customer", "designer" or null (no login needed)
// - onChange(callback)                      calls back when the session changes, in this tab or
//                                           another; returns a function that stops listening
//
// Attributes: none
const SESSION_KEY = "idp_platform_session";
const CHANGE_EVENT = "idp-platform-session-change";
const DEMO_ADMIN_ID = "A1";

export class SessionController {
  static login(accountID, profileID) {
    window.localStorage.setItem(SESSION_KEY, JSON.stringify({ accountID, profileID }));
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }

  static logout() {
    window.localStorage.removeItem(SESSION_KEY);
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }

  static onChange(callback) {
    window.addEventListener(CHANGE_EVENT, callback);
    window.addEventListener("storage", callback); // logged in or out in another tab
    return () => {
      window.removeEventListener(CHANGE_EVENT, callback);
      window.removeEventListener("storage", callback);
    };
  }

  static getLoggedInAccount() {
    try {
      const session = JSON.parse(window.localStorage.getItem(SESSION_KEY));
      return session?.accountID && session?.profileID
        ? { accountID: session.accountID, profileID: session.profileID }
        : null;
    } catch {
      return null; // no storage, or damaged session data
    }
  }

  static getLoggedInCustomerID() {
    const account = this.getLoggedInAccount();
    return account?.profileID === "customer" ? account.accountID : null;
  }

  static getLoggedInDesignerID() {
    const account = this.getLoggedInAccount();
    return account?.profileID === "designer" ? account.accountID : null;
  }

  static getLoggedInADMINID() {
    const account = this.getLoggedInAccount();
    if (account) return account.profileID === "admin" ? account.accountID : null;
  }

  static getRequiredProfile(pathname) {
    if (pathname === "/" || pathname === "/customer" || pathname.startsWith("/customer/")) return "customer";
    if (pathname === "/designer" || pathname.startsWith("/designer/")) return "designer";
    return null;
  }
}
