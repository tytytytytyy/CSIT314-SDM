import { beforeEach, afterEach, describe, it, expect, vi } from "vitest";
import { VerifyIDAccountsController as C } from "@/controller/VerifyIDAccountsController";
import { SessionController } from "@/controller/SessionController";
import { readTable, writeTable } from "@/entity/LocalStore";
import { CreateIDPController } from "@/controller/CreateIDPController";
beforeEach(() => { localStorage.clear(); SessionController.loginAsDemoAdmin(); });
afterEach(() => vi.restoreAllMocks());
describe("Verify accounts", () => {
  it("lists pending designers and company details", async () => {
    const rows = await C.getPendingAccounts();
    expect(rows.map(r => r.account.accountID)).toEqual(["D4"]);
    expect(rows[0].company.registrationNumber).toBe("202610001D");
  });
  it("approves with reviewer and time and removes pending entry", async () => {
    expect((await C.approveAccount("D4")).success).toBe(true);
    const details = await C.getAccountDetails("D4");
    expect(details.account.status).toBe("active");
    expect(details.verification).toMatchObject({status:"approved", reviewedBy:"A1", rejectReason:null});
    expect(Number.isNaN(Date.parse(details.verification.reviewedAt))).toBe(false);
    expect(await C.getPendingAccounts()).toEqual([]);
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
    SessionController.logoutAdmin();
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
