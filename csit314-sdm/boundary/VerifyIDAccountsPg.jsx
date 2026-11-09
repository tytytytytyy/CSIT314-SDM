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
import { useSession } from "@/boundary/useSession";
import Link from "next/link";

export default function VerifyIDAccountsPg() {
  const session = useSession();
  const sessionLoaded = session !== undefined;
  const sessionID = session?.accountID;
  const sessionProfile = session?.profileID;
  const [accounts, setAccounts] = useState([]);
  const [statusFilter, setStatusFilter] = useState("pending");
  const visibleAccounts = accounts.filter(row => statusFilter === "all" || row.account.status === statusFilter);
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
      const rows = await Controller.getAccounts();
      setAccounts(rows);
      setSelected(current => current ? rows.find(row => row.account.accountID === current.account.accountID) ?? null : null);
      setError("");
    } catch (e) { setAdmin(null); setAccounts([]); setSelected(null); setError(e.message); } 
  }
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        if (!sessionID || sessionProfile !== "admin") throw new Error("Please log in as an active user admin.");
        const id = await Controller.getAdminID();
        const rows = await Controller.getAccounts();
        if (!cancelled) {
          setAdmin(id); setAccounts(rows); setSelected(null);
          setRejecting(false); setReason(""); setMessage(""); setError("");
        }
      } catch (e) {
        if (!cancelled) {
          setAdmin(null); setAccounts([]); setSelected(null);
          setReason(""); setRejecting(false); setMessage(""); setError(e.message);
        }
      }
    }
    if (sessionLoaded) void load();
    return () => { cancelled = true; };
  }, [sessionID, sessionProfile, sessionLoaded]);
  async function select(id) {
    setBusy(true); setError(""); setMessage("");
    try { setSelected(await Controller.getAccountDetails(id)); setRejecting(false); setReason(""); }
    catch(e) { setError(e.message); }
    finally { setBusy(false); }
  }
  async function decide(reject) {
    setBusy(true); setError(""); setMessage("");
    try {
      if (!selected) return;
      const result = reject ? await Controller.rejectAccount(selected.account.accountID, reason) : await Controller.approveAccount(selected.account.accountID);
      if (!result.success) { setError(result.error); return; }
      setSelected(null); setReason(""); setRejecting(false);
      await refresh();
      setMessage(`Account ${reject ? "rejected" : "approved and activated"}. Reviewed by ${result.verification.reviewedBy} at ${new Date(result.verification.reviewedAt).toLocaleString()}.`);
    } catch { setError("Unable to complete the review. Please refresh and try again."); }
    finally { setBusy(false); }
  }
  return <main className="mx-auto max-w-6xl space-y-6 p-8">
    <h1 className="text-3xl font-bold">Verify Interior Designer Accounts</h1>
    <p>Review company information before allowing a firm to publish IDPs.</p>
    {error && <p role="alert" className="rounded border border-red-400 p-4 text-red-700">{error}</p>}
    {message && <p role="status" className="rounded border border-green-500 p-4 text-green-800">{message}</p>}
    {!admin && session !== undefined && <Link href="/login" className="btn btn-primary">Log in as User Admin</Link>}
    {admin && session?.profileID === "admin" && session.accountID === admin && <div className="grid gap-6 md:grid-cols-2">
      <section className="space-y-3"><h2 className="text-xl font-semibold">Interior designer accounts</h2>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filter accounts by status">
          {["pending", "active", "rejected", "all"].map(status => <button key={status} disabled={busy} aria-pressed={statusFilter === status}
            className="btn btn-sm capitalize"
            onClick={() => { setStatusFilter(status); setSelected(null); setRejecting(false); setReason(""); }}>
            {status === "all" ? "All" : status[0].toUpperCase() + status.slice(1)} ({accounts.filter(row => status === "all" || row.account.status === status).length})
          </button>)}
        </div>
        {visibleAccounts.length === 0 && <p>No {statusFilter === "all" ? "designer" : statusFilter} accounts.</p>}
        {visibleAccounts.map(({account, company, verification}) => <button key={account.accountID} disabled={busy} onClick={() => select(account.accountID)} className={`card card-hover block w-full p-4 text-left ${selected?.account.accountID === account.accountID ? "border-indigo-500 ring-2 ring-indigo-500/30" : ""}`} aria-pressed={selected?.account.accountID === account.accountID}>
          <strong>{company?.companyName ?? account.accountID}</strong><span className="block">{account.email}</span><span className="block capitalize">Status: {account.status}</span><span className="block text-sm">Submitted: {verification?.submittedAt ? new Date(verification.submittedAt).toLocaleString() : "Not recorded"}</span>
        </button>)}
      </section>
      <section className="card space-y-4 self-start p-5"><h2 className="text-xl font-semibold">Account details</h2>
        {!selected ? <p>Select an account to view its details.</p> : <>
          <dl className="space-y-3">{Object.entries({"Account ID":selected.account.accountID, "Email":selected.account.email, "Account status":selected.account.status, "Company":selected.company?.companyName,"Registration number":selected.company?.registrationNumber,"Description":selected.company?.description,"Location":selected.company?.location,"Phone":selected.company?.phone,"Website":selected.company?.website,"Verification status":selected.verification?.status,"Reviewed by":selected.verification?.reviewedBy,"Reviewed at":selected.verification?.reviewedAt ? new Date(selected.verification.reviewedAt).toLocaleString() : null,"Rejection reason":selected.verification?.rejectReason}).map(([label,value]) => <div key={label}><dt className="font-semibold">{label}</dt><dd className="break-words">{value || "Not supplied"}</dd></div>)}</dl>
          {selected.account.status === "pending" && selected.verification?.status === "pending" ? <>
          <div className="flex gap-3"><button disabled={busy} onClick={() => decide(false)} className="btn btn-success">Approve account</button><button disabled={busy} onClick={() => setRejecting(true)} className="btn btn-danger-outline">Reject account</button></div>
          {rejecting && <form onSubmit={e => { e.preventDefault(); void decide(true); }} className="space-y-3">
            <label htmlFor="rejection-reason" className="block">Rejection reason (required)</label><textarea id="rejection-reason" value={reason} onChange={e => setReason(e.target.value)} className="input w-full" rows={4} disabled={busy}/>
            <div className="flex gap-3"><button disabled={busy} className="btn btn-danger">Confirm rejection</button><button type="button" disabled={busy} onClick={() => setRejecting(false)} className="btn">Cancel</button></div>
          </form>}
          </> : <p className="text-sm text-zinc-500">This account is read-only. Only pending accounts can be approved or rejected.</p>}
        </>}
      </section>
    </div>}
  </main>;
}
