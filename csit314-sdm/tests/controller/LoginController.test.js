// Unit tests for LoginController (all actors: Log in / Log out).
// Uses the hand-made accounts in entity/LocalStore.js:
// - customers C1, C2, C3 and designers D1, D2, D3 are active demo accounts
// - designer D4 is still waiting for verification, designer D5 is suspended
// localStorage is cleared before each test, so every test starts logged out with the same data.

import { describe, it, expect, beforeEach } from "vitest";
import { LoginController } from "@/controller/LoginController";
import { SessionController } from "@/controller/SessionController";

const PASSWORD = "password123";

beforeEach(() => {
  window.localStorage.clear();
});

describe("login", () => {
  it("logs in a customer and sends them to the customer home page", async () => {
    const result = await LoginController.login("customer1@example.com", PASSWORD);
    expect(result).toEqual({ status: "ok", profileID: "customer", homePage: "/" });
    expect(SessionController.getLoggedInCustomerID()).toBe("C1");
    expect(SessionController.getLoggedInDesignerID()).toBeNull();
  });

  it("logs in a designer and sends them to My IDPs", async () => {
    const result = await LoginController.login("hello@nordicnest.example.com", PASSWORD);
    expect(result).toEqual({ status: "ok", profileID: "designer", homePage: "/designer/idp" });
    expect(SessionController.getLoggedInDesignerID()).toBe("D1");
    expect(SessionController.getLoggedInCustomerID()).toBeNull();
  });

  it("works for all three demo customers and all three demo designers", async () => {
    const accounts = {
      "customer1@example.com": "C1",
      "customer2@example.com": "C2",
      "customer3@example.com": "C3",
      "hello@nordicnest.example.com": "D1",
      "studio@linea.example.com": "D2",
      "team@habitatco.example.com": "D3",
    };
    for (const [email, accountID] of Object.entries(accounts)) {
      expect((await LoginController.login(email, PASSWORD)).status).toBe("ok");
      expect(SessionController.getLoggedInAccount().accountID).toBe(accountID);
    }
  });

  it("ignores upper case and spaces around the email", async () => {
    const result = await LoginController.login("  Customer1@Example.com ", PASSWORD);
    expect(result.status).toBe("ok");
  });

  it("asks for both fields when one is empty", async () => {
    expect(await LoginController.login("", PASSWORD)).toEqual({
      status: "invalid",
      message: "Please enter your email and password",
    });
    expect((await LoginController.login("customer1@example.com", "")).status).toBe("invalid");
    expect(SessionController.getLoggedInAccount()).toBeNull();
  });

  it("rejects a wrong password without saying which field was wrong", async () => {
    expect(await LoginController.login("customer1@example.com", "wrong")).toEqual({
      status: "invalid",
      message: "Incorrect email or password",
    });
    expect(SessionController.getLoggedInAccount()).toBeNull();
  });

  it("gives the same message for an email that is not registered", async () => {
    const result = await LoginController.login("nobody@example.com", PASSWORD);
    expect(result.message).toBe("Incorrect email or password");
  });

  it("blocks a designer whose account is still waiting for verification", async () => {
    expect(await LoginController.login("hi@freshstart.example.com", PASSWORD)).toEqual({
      status: "blocked",
      message: "Your account is waiting for verification",
    });
    expect(SessionController.getLoggedInAccount()).toBeNull();
  });

  it("blocks a suspended account", async () => {
    const result = await LoginController.login("info@urbanedge.example.com", PASSWORD);
    expect(result).toEqual({ status: "blocked", message: "Your account has been suspended" });
    expect(SessionController.getLoggedInAccount()).toBeNull();
  });

  it("does not hand the password back to the page", async () => {
    const result = await LoginController.login("customer1@example.com", PASSWORD);
    expect(JSON.stringify(result)).not.toContain(PASSWORD);
    expect(JSON.stringify(SessionController.getLoggedInAccount())).not.toContain(PASSWORD);
  });
});

describe("logout", () => {
  it("ends the session", async () => {
    await LoginController.login("customer1@example.com", PASSWORD);
    LoginController.logout();
    expect(SessionController.getLoggedInAccount()).toBeNull();
    expect(SessionController.getLoggedInCustomerID()).toBeNull();
  });
});

describe("getHomePage", () => {
  it("is the login page when nobody is logged in", () => {
    expect(LoginController.getHomePage()).toBe("/login");
  });

  it("is the logged-in user's own home page", async () => {
    await LoginController.login("studio@linea.example.com", PASSWORD);
    expect(LoginController.getHomePage()).toBe("/designer/idp");
  });
});

describe("getLoggedInDesignerCompany", () => {
  it("gives the logged-in designer's company name and logo, for the menu bar", async () => {
    await LoginController.login("hello@nordicnest.example.com", PASSWORD);
    const company = await LoginController.getLoggedInDesignerCompany();
    expect(company.companyName).toBe("Nordic Nest Interiors");
    expect(company.logoURL).toBeTruthy();
  });

  it("gives null when no designer is logged in", async () => {
    expect(await LoginController.getLoggedInDesignerCompany()).toBeNull();
    await LoginController.login("customer1@example.com", PASSWORD);
    expect(await LoginController.getLoggedInDesignerCompany()).toBeNull();
  });
});
