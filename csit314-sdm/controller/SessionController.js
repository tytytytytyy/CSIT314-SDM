const SESSION_KEY = "idp_platform_session";
const CHANGE_EVENT = "idp-platform-session-change";

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

  static getLoggedInAdminID() {
    const account = this.getLoggedInAccount();
    return account?.profileID === "admin" ? account.accountID : null;
  }

  // Keep the existing spelling for callers that already use it.
  static getLoggedInADMINID() {
    return this.getLoggedInAdminID();
  }

  static getRequiredProfile(pathname) {
    if (pathname === "/" || pathname === "/customer" || pathname.startsWith("/customer/")) return "customer";
    if (pathname === "/designer" || pathname.startsWith("/designer/")) return "designer";
    if (pathname === "/platform-manager" || pathname.startsWith("/platform-manager/")) return "platformManager";
    return null;
  }
}
