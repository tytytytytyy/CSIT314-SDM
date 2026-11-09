// Unit tests for SessionController: who is logged in, and which area they may open.
// localStorage is cleared before each test, so every test starts logged out.

import { describe, it, expect, beforeEach } from "vitest";
import { SessionController } from "@/controller/SessionController";

beforeEach(() => {
  window.localStorage.clear();
});

describe("session", () => {
  it("has nobody logged in at the start", () => {
    expect(SessionController.getLoggedInAccount()).toBeNull();
    expect(SessionController.getLoggedInCustomerID()).toBeNull();
    expect(SessionController.getLoggedInDesignerID()).toBeNull();
  });

  it("remembers the logged-in account and its role", () => {
    SessionController.login("C2", "customer");
    expect(SessionController.getLoggedInAccount()).toEqual({ accountID: "C2", profileID: "customer" });
    expect(SessionController.getLoggedInCustomerID()).toBe("C2");
  });

  it("only gives a designer ID to a designer", () => {
    SessionController.login("D3", "designer");
    expect(SessionController.getLoggedInDesignerID()).toBe("D3");
    expect(SessionController.getLoggedInCustomerID()).toBeNull();
  });

  it("forgets the account on logout", () => {
    SessionController.login("D1", "designer");
    SessionController.logout();
    expect(SessionController.getLoggedInAccount()).toBeNull();
  });

  it("treats damaged session data as logged out", () => {
    window.localStorage.setItem("idp_platform_session", "{not json");
    expect(SessionController.getLoggedInAccount()).toBeNull();
  });
});

describe("getRequiredProfile", () => {
  it("needs a customer for the home page and customer pages", () => {
    expect(SessionController.getRequiredProfile("/")).toBe("customer");
    expect(SessionController.getRequiredProfile("/customer/idp/1")).toBe("customer");
  });

  it("needs a designer for designer pages", () => {
    expect(SessionController.getRequiredProfile("/designer/idp")).toBe("designer");
    expect(SessionController.getRequiredProfile("/designer/dashboard")).toBe("designer");
  });

  it("needs nobody for the login page and user admin pages", () => {
    expect(SessionController.getRequiredProfile("/login")).toBeNull();
    expect(SessionController.getRequiredProfile("/user-admin/verify-id-accounts")).toBeNull();
  });

  it("requires a platform manager for platform manager pages", () => {
    expect(SessionController.getRequiredProfile("/platform-manager/report")).toBe("platformManager");
    expect(SessionController.getRequiredProfile("/platform-manager/promote-idp/1")).toBe("platformManager");
  });
});
