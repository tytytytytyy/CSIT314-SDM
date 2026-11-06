// Boundary: VerifyIDAccountsPg
// Feature: Verify ID Accounts (User Admin)
// User story: As a user admin, I want to verify pending interior designer accounts,
// so that only genuine firms can post IDPs.
//
// Route: /user-admin/verify-id-accounts   (app/user-admin/verify-id-accounts/page.jsx renders this)
//
// What goes here:
// - Page that lists pending interior designer accounts (firm name, contact, submitted date).
// - Detail view of one account's company information.
// - "Approve" and "Reject" buttons; Reject shows a text field for the reject reason.
// - No business rules here: everything is passed to VerifyIDAccountsController.
//
// Methods:
// - displayPendingAccounts(verifications)          show the list of pending accounts
// - displayAccountDetails(verification, companyInfo) show one account's details
// - submitApproval(verificationID)                 send approve to the controller
// - submitRejection(verificationID, rejectReason)  send reject + reason to the controller
// - displaySuccessPg()
// - displayErrorPg(message)                        e.g. "Reject reason is required"
//
// Attributes: none

"use client";
import { useEffect, useState } from "react";
import { VerifyIDAccountsController as Controller } from "@/controller/VerifyIDAccountsController";
import { SessionController } from "@/controller/SessionController";

export default function VerifyIDAccountsPg() {
  const [accounts, setAccounts] = useState([]);
  const [selected, setSelected] = useState(null);
  const [reason, setReason] = useState("");
  const [rejecting, setRejecting] = useState(false);
  const [busy, setBusy] = useState(false);
  const [admin, setAdmin] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  async function refresh() {
    try {
      setAdmin(await Controller.getAdminID());
      setAccounts(await Controller.getPendingAccounts());
      setError("");
    } catch (e) { setAdmin(null); setAccounts([]); setSelected(null); setError(e.message); }
  }
  useEffect(() => {
    let cancelled = false;
    Controller.getAdminID().then(async id => {
      const rows = await Controller.getPendingAccounts();
      if (!cancelled) { setAdmin(id); setAccounts(rows); }
    }).catch(e => { if (!cancelled) setError(e.message); });
    return () => { cancelled = true; };
  }, []);
  async function select(id) {
    setBusy(true); setError(""); setMessage("");
    try { setSelected(await Controller.getAccountDetails(id)); setRejecting(false); setReason(""); }
    catch(e) { setError(e.message); }
    finally { setBusy(false); }
  }
  async function decide(reject) {
    setBusy(true); setError(""); setMessage("");
    try {
      const result = reject ? await Controller.rejectAccount(selected.account.accountID, reason) : await Controller.approveAccount(selected.account.accountID);
      if (!result.success) { setError(result.error); return; }
      setSelected(null); setReason(""); setRejecting(false);
      await refresh();
      setMessage(`Account ${reject ? "rejected" : "approved and activated"}. Reviewed by ${result.verification.reviewedBy} at ${new Date(result.verification.reviewedAt).toLocaleString()}.`);
    } finally { setBusy(false); }
  }
  return <main className="mx-auto max-w-6xl space-y-6 p-8">
    <h1 className="text-3xl font-bold">Verify Interior Designer Accounts</h1>
    <p>Review company information before allowing a firm to publish IDPs.</p>
    <div className="flex gap-4 items-center rounded border p-4">
      <span>{admin ? `Demo user admin: ${admin}` : "Admin login required"}</span>
      <button className="rounded border px-4 py-2" disabled={busy} onClick={async () => { if (admin) SessionController.logoutAdmin(); else SessionController.loginAsDemoAdmin(); setMessage(""); await refresh(); }}>{admin ? "Log out admin" : "Test: log in as admin A1"}</button>
      {admin && <button disabled={busy} onClick={refresh}>Refresh list</button>}
    </div>
    <p className="text-sm text-zinc-500">Demonstration only: this project uses browser storage and a test login.</p>
    {error && <p role="alert" className="rounded border border-red-400 p-4 text-red-700">{error}</p>}
    {message && <p role="status" className="rounded border border-green-500 p-4 text-green-800">{message}</p>}
    {admin && <div className="grid gap-6 md:grid-cols-2">
      <section className="space-y-3"><h2 className="text-xl font-semibold">Pending accounts ({accounts.length})</h2>
        {accounts.length === 0 && <p>No pending accounts.</p>}
        {accounts.map(({account, company, verification}) => <button key={account.accountID} disabled={busy} onClick={() => select(account.accountID)} className="block w-full rounded border p-4 text-left hover:bg-zinc-100" aria-pressed={selected?.account.accountID === account.accountID}>
          <strong>{company?.companyName ?? account.accountID}</strong><span className="block">{account.email}</span><span className="block text-sm">Submitted: {new Date(verification.submittedAt).toLocaleString()}</span>
        </button>)}
      </section>
      <section className="space-y-4 rounded border p-5"><h2 className="text-xl font-semibold">Account details</h2>
        {!selected ? <p>Select a pending account to review.</p> : <>
          <dl className="space-y-3">{Object.entries({"Account ID":selected.account.accountID, "Email":selected.account.email, "Account status":selected.account.status, "Company":selected.company?.companyName,"Registration number":selected.company?.registrationNumber,"Description":selected.company?.description,"Location":selected.company?.location,"Phone":selected.company?.phone,"Website":selected.company?.website}).map(([label,value]) => <div key={label}><dt className="font-semibold">{label}</dt><dd className="break-words">{value || "Not supplied"}</dd></div>)}</dl>
          <div className="flex gap-3"><button disabled={busy} onClick={() => decide(false)} className="rounded bg-green-700 px-4 py-2 text-white">Approve account</button><button disabled={busy} onClick={() => setRejecting(true)} className="rounded border px-4 py-2">Reject account</button></div>
          {rejecting && <form onSubmit={e => { e.preventDefault(); void decide(true); }} className="space-y-3">
            <label htmlFor="rejection-reason" className="block">Rejection reason (required)</label><textarea id="rejection-reason" value={reason} onChange={e => setReason(e.target.value)} className="w-full rounded border p-2" rows={4} disabled={busy}/>
            <button disabled={busy} className="rounded bg-red-700 px-4 py-2 text-white">Confirm rejection</button><button type="button" disabled={busy} onClick={() => setRejecting(false)} className="ml-4">Cancel</button>
          </form>}
        </>}
      </section>
    </div>}
  </main>;
}
