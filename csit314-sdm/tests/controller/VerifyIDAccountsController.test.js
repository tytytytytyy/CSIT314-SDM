import React, { act } from "react";
import { createRoot } from "react-dom/client";
import NavBar from "@/boundary/NavBar";
import VerifyIDAccountsPg from "@/boundary/VerifyIDAccountsPg";
import { beforeEach, afterEach, describe, it, expect, vi } from "vitest";
import { VerifyIDAccountsController as C } from "@/controller/VerifyIDAccountsController";
import { SessionController } from "@/controller/SessionController";
import { readTable, writeTable } from "@/entity/LocalStore";
import { LoginController } from "@/controller/LoginController";
import { CreateIDPController } from "@/controller/CreateIDPController";
beforeEach(() => { localStorage.clear(); SessionController.login("A1", "admin"); });
afterEach(() => vi.restoreAllMocks());
describe("Verify accounts", () => {
  it("lists pending designers and company details", async () => {
    const rows = await C.getPendingAccounts();
    expect(rows.map(r => r.account.accountID)).toEqual(["D4", "D101", "D102", "D103"]);
    expect(rows[0].company.registrationNumber).toBe("202610001D");
  });
  it("approves with reviewer and time and removes pending entry", async () => {
    expect((await C.approveAccount("D4")).success).toBe(true);
    const details = await C.getAccountDetails("D4");
    expect(details.account.status).toBe("active");
    expect(details.verification).toMatchObject({status:"approved", reviewedBy:"A1", rejectReason:null});
    expect(Number.isNaN(Date.parse(details.verification.reviewedAt))).toBe(false);
    expect((await C.getPendingAccounts()).map(r => r.account.accountID)).toEqual(["D101", "D102", "D103"]);
  });
  it("rejects with a trimmed reason and audit record", async () => {
    expect((await C.rejectAccount("D4", "  Invalid registration  ")).success).toBe(true);
    const d = await C.getAccountDetails("D4");
    expect(d.account.status).toBe("rejected");
    expect(d.verification).toMatchObject({status:"rejected", rejectReason:"Invalid registration", reviewedBy:"A1"});
  });
  it.each(["", "  ", null])("requires a rejection reason: %s", async reason => {
    expect((await C.rejectAccount("D4", reason)).success).toBe(false);
    expect((await C.getAccountDetails("D4")).account.status).toBe("pending");
  });
  it("prevents repeated review and preserves original decision", async () => {
    await C.approveAccount("D4");
    expect((await C.rejectAccount("D4", "Changed mind")).success).toBe(false);
    expect((await C.getAccountDetails("D4")).verification.status).toBe("approved");
  });
  it("denies logged-out and non-admin sessions", async () => {
    SessionController.logout();
    expect((await C.approveAccount("D4")).success).toBe(false);
    localStorage.setItem("idp_platform_session_adminID", "C1");
    await expect(C.getPendingAccounts()).rejects.toThrow("user admin");
  });
  it("denies suspended admins and missing accounts", async () => {
    expect((await C.approveAccount("missing")).success).toBe(false);
    writeTable("user_account", readTable("user_account").map(r => r.accountID === "A1" ? {...r,status:"suspended"}:r));
    expect((await C.approveAccount("D4")).success).toBe(false);
  });
  it("leaves both tables unchanged on storage failure", async () => {
    const before = await C.getAccountDetails("D4");
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {throw new Error("quota");});
    expect((await C.approveAccount("D4")).success).toBe(false);
    expect(await C.getAccountDetails("D4")).toEqual(before);
  });
  it("blocks pending and rejected designers from publishing", async () => {
    const input={title:"A room",description:"A description",style:"Tropical",propertyType:"Condo",category:"Residential",budget:1000,status:"completed"};
    const photos=[{fileName:"room.jpg",dataURL:"data:image/jpeg;base64,AAAA"}];
    expect((await CreateIDPController.createIDP("D4",input,photos)).success).toBe(false);
    await C.rejectAccount("D4","Invalid firm");
    expect((await CreateIDPController.createIDP("D4",input,photos)).success).toBe(false);
    expect((await CreateIDPController.createIDP("D1",input,photos)).success).toBe(true);
  });
});

describe("ACRA check", () => {
  it("compares company names without case, punctuation or company endings", () => {
    expect(C.normaliseCompanyName("Fresh Start Design Pte. Ltd.")).toBe(C.normaliseCompanyName("FRESH START DESIGN"));
    expect(C.normaliseCompanyName("Habitat & Co")).toBe(C.normaliseCompanyName("HABITAT & CO. PTE. LTD."));
    expect(C.normaliseCompanyName("Seaside Homes LLP")).toBe("SEASIDE HOMES");
  });
  it("matches a live UEN registered under the same name", async () => {
    expect(await C.checkUENWithACRA("D4")).toMatchObject({
      result: "matched", registeredName: "FRESH START DESIGN PTE. LTD.", registryStatus: "live",
    });
  });
  it("flags a UEN registered under a different name", async () => {
    expect(await C.checkUENWithACRA("D101")).toMatchObject({
      result: "nameMismatch", registeredName: "SEASIDE HOMES PTE. LTD.", registryStatus: "live",
    });
  });
  it("flags a UEN that is not in the registry", async () => {
    expect(await C.checkUENWithACRA("D102")).toMatchObject({ result: "notFound", registeredName: null });
  });
  it("flags a company that has been struck off", async () => {
    expect(await C.checkUENWithACRA("D103")).toMatchObject({
      result: "struckOff", registeredName: "OAKLINE INTERIORS PTE. LTD.", registryStatus: "struck off",
    });
  });
  it("approves only the matched pending accounts, reviewed by SYSTEM", async () => {
    const result = await C.runACRACheck();
    expect(result.success).toBe(true);
    expect(result.approved.map(a => a.accountID)).toEqual(["D4"]);
    expect(result.flagged.map(f => [f.accountID, f.result])).toEqual([
      ["D101", "nameMismatch"], ["D102", "notFound"], ["D103", "struckOff"],
    ]);
    const d4 = await C.getAccountDetails("D4");
    expect(d4.account.status).toBe("active");
    expect(d4.verification).toMatchObject({ status: "approved", reviewedBy: "SYSTEM", rejectReason: null });
    expect((await C.getPendingAccounts()).map(r => r.account.accountID)).toEqual(["D101", "D102", "D103"]);
  });
  it("does not touch accounts that are already reviewed", async () => {
    await C.rejectAccount("D4", "Invalid firm");
    const result = await C.runACRACheck();
    expect(result.approved).toEqual([]);
    expect((await C.getAccountDetails("D4")).verification.status).toBe("rejected");
    expect((await C.getAccountDetails("D1")).verification.reviewedBy).toBe("A1");
  });
  it("can only be run by an active user admin", async () => {
    SessionController.logout();
    expect((await C.runACRACheck()).success).toBe(false);
    await expect(C.checkUENWithACRA("D4")).rejects.toThrow("user admin");
    SessionController.login("A1", "admin");
    expect((await C.getAccountDetails("D4")).account.status).toBe("pending");
  });
  it("still lets the admin decide a flagged account by hand", async () => {
    await C.runACRACheck();
    expect((await C.approveAccount("D101")).success).toBe(true);
    expect((await C.rejectAccount("D103", "Company is struck off")).success).toBe(true);
  });
});

describe("Admin login and account lists", () => {
  it("logs in through the existing login page flow", async () => {
    SessionController.logout();
    expect((await LoginController.login("admin@example.com", "wrong")).status).toBe("invalid");
    expect(SessionController.getLoggedInAdminID()).toBeNull();
    expect(await LoginController.login("admin@example.com", "password123")).toEqual({
      status: "ok", profileID: "admin", homePage: "/user-admin/verify-id-accounts",
    });
    expect(LoginController.getHomePage()).toBe("/user-admin/verify-id-accounts");
    expect(SessionController.getLoggedInADMINID()).toBe("A1");
  });
  it("lists active and rejected accounts with read-only review details", async () => {
    await C.rejectAccount("D4", "Invalid registration");
    const rejected = await C.getAccounts("rejected");
    expect(rejected.map(row => row.account.accountID)).toEqual(["D4"]);
    expect(rejected[0].verification.rejectReason).toBe("Invalid registration");
    expect((await C.getAccounts("active")).every(row => row.account.status === "active")).toBe(true);
    expect((await C.getAccountDetails("D1")).company.companyName).toBe("Nordic Nest Interiors");
    expect((await C.approveAccount("D1")).success).toBe(false);
    expect((await C.getAccounts()).some(row => row.account.accountID === "D5")).toBe(true);
  });
  it.each([null, "customer", "designer"])("denies list and details for %s", async role => {
    if (role) SessionController.login(role === "customer" ? "C1" : "D1", role);
    else SessionController.logout();
    await expect(C.getAccounts()).rejects.toThrow("user admin");
    await expect(C.getAccountDetails("D4")).rejects.toThrow("user admin");
  });
  it("restores the account if the second table cannot be written", async () => {
    const before = await C.getAccountDetails("D4");
    const original = Storage.prototype.setItem;
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(function(key, value) {
      if (key.endsWith("designer_verification")) throw new Error("quota");
      return original.call(this, key, value);
    });
    expect((await C.approveAccount("D4")).success).toBe(false);
    expect(await C.getAccountDetails("D4")).toEqual(before);
  });
  it("preserves customer data while approving and enables the approved designer login", async () => {
    const customer = readTable("user_account").find(row => row.accountID === "C1");
    const projects = readTable("idp");
    await C.approveAccount("D4");
    expect(readTable("user_account").find(row => row.accountID === "C1")).toEqual(customer);
    expect(readTable("idp")).toEqual(projects);
    expect((await LoginController.login("hi@freshstart.example.com", "password123")).status).toBe("ok");
  });
});

vi.mock('next/navigation', () => ({ usePathname: () => '/user-admin/verify-id-accounts', useRouter: () => ({replace: vi.fn()}) }));
vi.mock('next/link', async () => {
  const React = await import('react');
  return {default: ({children, ...props}) => React.createElement('a', props, children)};
});
vi.mock('@/boundary/DesignerNavBar', () => ({default: () => null}));

describe("Verify Accounts page interactions", () => {
let host, root;
beforeEach(() => {
  globalThis.React = React;
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  localStorage.clear();
  host = document.createElement('div'); document.body.append(host);
  root = createRoot(host);
});
afterEach(async () => { await act(async () => root.unmount()); host.remove(); });
const render = async Component => { await act(async () => { root.render(React.createElement(Component)); }); };
const click = async text => {
  const button = [...host.querySelectorAll('button')].find(b => b.textContent.startsWith(text));
  expect(button, text).toBeTruthy();
  await act(async () => button.click());
};
it('updates the admin-only navigation on login and logout', async () => {
  await render(NavBar);
  expect(host.textContent).not.toContain('Verify ID Accounts');
  await act(async () => SessionController.login('C1','customer'));
  expect(host.textContent).not.toContain('Verify ID Accounts');
  await act(async () => SessionController.login('A1','admin'));
  expect(host.querySelector('a[href="/user-admin/verify-id-accounts"]').textContent).toBe('IDP Platform');
  expect(host.textContent).toContain('Verify ID Accounts');
  await click('Log out');
  expect(host.textContent).not.toContain('Verify ID Accounts');
});
it('shows active details and approves pending firms through the page', async () => {
  SessionController.login('A1','admin');
  await render(VerifyIDAccountsPg);
  await click('Active ('); await click('Nordic Nest Interiors');
  expect(host.textContent).toContain('202601234A');
  expect(host.textContent).toContain('This account is read-only');
  await click('Pending ('); await click('Fresh Start Design');
  await click('Approve account');
  expect(host.textContent).toContain('Account approved and activated');
  expect(host.textContent).toContain('Pending (3)');
  await click('Active ('); await click('Fresh Start Design');
  expect(host.textContent).toContain('A1');
  expect(host.textContent).toContain('This account is read-only');
});
it('requires a reason and displays the rejected account details', async () => {
  SessionController.login('A1','admin');
  await render(VerifyIDAccountsPg);
  await click('Fresh Start Design'); await click('Reject account');
  await click('Confirm rejection');
  expect(host.querySelector('[role="alert"]').textContent).toContain('reason is required');
  const input = host.querySelector('textarea');
  await act(async () => {
    Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set.call(input, 'Invalid registration');
    input.dispatchEvent(new Event('input', {bubbles: true}));
  });
  await click('Confirm rejection');
  expect(host.textContent).toContain('Account rejected.');
  await click('Rejected ('); await click('Fresh Start Design');
  expect(host.textContent).toContain('Invalid registration');
  expect(host.textContent).toContain('This account is read-only');
});
it('runs the ACRA check and shows the result for each flagged firm', async () => {
  SessionController.login('A1','admin');
  await render(VerifyIDAccountsPg);
  await click('Fresh Start Design');
  expect(host.textContent).toContain('UEN found: FRESH START DESIGN PTE. LTD. (live). Name matches.');
  await click('Run ACRA check');
  expect(host.textContent).toContain('1 account approved automatically. 3 need review.');
  expect(host.textContent).toContain('Pending (3)');
  await click('Coastline Living');
  expect(host.textContent).toContain('UEN found, but the registered name is SEASIDE HOMES PTE. LTD.');
  await click('Brightwall Studio');
  expect(host.textContent).toContain('UEN not found. Check on Bizfile before approving.');
  await click('Oakline Interiors');
  expect(host.textContent).toContain('OAKLINE INTERIORS PTE. LTD. is struck off. It should normally be rejected.');
  await click('Active ('); await click('Fresh Start Design');
  expect(host.textContent).toContain('SYSTEM');
});
it('clears visible accounts when the admin session ends', async () => {
  SessionController.login('A1','admin');
  await render(VerifyIDAccountsPg);
  await click('Fresh Start Design');
  await act(async () => SessionController.logout());
  expect(host.textContent).not.toContain('Fresh Start Design');
  expect(host.textContent).toContain('Log in as User Admin');
  expect((await C.approveAccount('D4')).success).toBe(false);
});

});
