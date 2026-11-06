// Control: SessionController  (TEST STUB - replace with the real Login feature)
// Holds the session's logged-in ID. The logged-in customer is hard-coded to the demo
// customer and kept in localStorage, so the nav bar can switch between logged in / out.
//
// Rules / fixed values:
// - DEMO_CUSTOMER_ID = C1
// - DEMO_DESIGNER_ID = D1                   the designer side is always "logged in" as D1 for now
//
// Methods:
// - getLoggedInCustomerID()                 null when nobody is logged in
// - getLoggedInDesignerID()
// - loginAsDemoCustomer()
// - logout()
//
// Attributes: none
const SESSION_KEY = "idp_platform_session_customerID";
const DEMO_CUSTOMER_ID = "C1";
const DEMO_DESIGNER_ID = "D1";
const DEMO_ADMIN_ID = "A1";

export class SessionController {
  // Logged in by default so the features can be tried straight away.
  static getLoggedInCustomerID() {
    try {
      const stored = window.localStorage.getItem(SESSION_KEY);
      return stored === "" ? null : (stored ?? DEMO_CUSTOMER_ID);
    } catch {
      return DEMO_CUSTOMER_ID;
    }
  }

  static getLoggedInDesignerID() {
    return DEMO_DESIGNER_ID;
  }

   static getLoggedInADMINID() {    
     return DEMO_ADMIN_ID;
}

  static loginAsDemoCustomer() {
    window.localStorage.setItem(SESSION_KEY, DEMO_CUSTOMER_ID);
  }

  static logout() {
    window.localStorage.setItem(SESSION_KEY, "");
  }
}
