"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { PromoteIDPController } from "@/controller/PromoteIDPController";
import { SessionController } from "@/controller/SessionController";
import { PHOTO_NOT_FOUND } from "@/boundary/PhotoFallback";
import StatusBadge from "@/boundary/StatusBadge";
import BackButton from "@/boundary/BackButton";
import { daysAgo } from "@/lib/dates";

const PROMOTION_ERRORS = {
  notFound: "This IDP could not be found.",
  designerNotVerified: "This IDP's designer is suspended or not yet verified, so it cannot be promoted.",
  invalidStartDate: "The start date must be today or later.",
  invalidEndDate: "The end date must be after the start date.",
  maxPromotionsReached: "The promotion limit has been reached for one or more selected dates.",
  dateOverlap: "This IDP already has a promotion that overlaps the selected dates.",
};

// "2026-11-10" -> "10 Nov 2026"
function formatDateKey(dateKey) {
  const [y, m, d] = dateKey.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-SG", { day: "numeric", month: "short", year: "numeric" });
}

export default function PromoteIDPPg({ params }) {
  const routeID = params?.idpID;
  const parsedID = Number(routeID);
  const isValidID = Number.isSafeInteger(parsedID) && parsedID > 0;
  const today = daysAgo(0);
  const tomorrow = daysAgo(-1);
  const [view, setView] = useState({ kind: "loading" });
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(tomorrow);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const displayPromoteForm = (idp, error = null) => setView({ kind: "form", idp, error });
  const displaySuccessPg = (idp) => setView({ kind: "success", idp });
  const displayErrorPg = (message) => setView({ kind: "error", message });

  useEffect(() => {
    let cancelled = false;
    const loadIDP = async () => {
      if (!isValidID) {
        displayErrorPg("IDP not found");
        return;
      }
      try {
        const idp = await PromoteIDPController.getIDP(parsedID);
        if (cancelled) return;
        if (idp) displayPromoteForm(idp);
        else displayErrorPg("IDP not found");
      } catch {
        if (!cancelled) displayErrorPg("Unable to load this IDP. Please try again.");
      }
    };
    loadIDP();
    return () => {
      cancelled = true;
    };
  }, [isValidID, parsedID]);

  const submitPromotion = async (event) => {
    event.preventDefault();
    if (view.kind !== "form") return;

    const manager = SessionController.getLoggedInAccount();
    if (manager?.profileID !== "platformManager") {
      displayErrorPg("Please log in as a platform manager before promoting an IDP.");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await PromoteIDPController.promoteIDP(parsedID, startDate, endDate, manager.accountID);
      if (result.status === "ok") displaySuccessPg(view.idp);
      else displayPromoteForm(view.idp, PROMOTION_ERRORS[result.status] ?? "Unable to create this promotion.");
    } catch {
      displayPromoteForm(view.idp, "Unable to create this promotion. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (view.kind === "loading") return <p className="p-8">Loading...</p>;
  if (view.kind === "error")
    return (
      <main className="mx-auto w-full max-w-3xl p-8">
        <BackButton fallbackHref="/platform-manager/promote-idp" />
        <p className="text-red-600">{view.message}</p>
      </main>
    );

  const { idp } = view;
  return (
    <main className="mx-auto w-full max-w-3xl p-8">
      <Link href="/platform-manager/promote-idp" className="btn btn-sm mb-4">
        <span aria-hidden="true">←</span> All IDPs
      </Link>
      <p className="text-sm text-zinc-500">Promote IDP #{idp.idpID}</p>
      <div className="mt-1 flex flex-wrap items-center gap-3">
        <h1 className="text-3xl font-semibold">{idp.title}</h1>
        <StatusBadge status={idp.status} />
      </div>
      <p className="mt-1 text-zinc-500">
        By {idp.companyName ?? "Interior designer"} ({idp.designerID})
      </p>

      {view.kind === "success" && (
        <div
          role="status"
          className="mt-4 rounded border border-green-300 bg-green-50 p-3 text-sm text-green-800"
        >
          Promotion scheduled from {formatDateKey(startDate)} to {formatDateKey(endDate)}. It will appear under
          &ldquo;Featured projects&rdquo; on the customer home page on those days.
        </div>
      )}

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={idp.mainPhotoURL ?? PHOTO_NOT_FOUND}
        alt={idp.title}
        className="photo mt-6 rounded-lg border"
        onError={(e) => {
          e.currentTarget.onerror = null;
          e.currentTarget.src = PHOTO_NOT_FOUND;
        }}
      />

      <dl className="card mt-6 grid grid-cols-[8rem_1fr] gap-y-3 p-5 text-sm">
        <dt className="font-medium">Style</dt>
        <dd>{idp.style}</dd>
        <dt className="font-medium">Property type</dt>
        <dd>{idp.propertyType}</dd>
        <dt className="font-medium">Category</dt>
        <dd>{idp.category}</dd>
        <dt className="font-medium">Budget</dt>
        <dd>${Number(idp.budget).toLocaleString()}</dd>
      </dl>

      {view.kind === "success" ? (
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/platform-manager/promote-idp" className="btn btn-primary">
            Promote another IDP
          </Link>
          <Link href="/platform-manager/report" className="btn">
            Generate Report
          </Link>
        </div>
      ) : (
        <section className="card mt-6 p-5">
          <h2 className="text-lg font-semibold">Promotion dates</h2>
          <p className="text-sm text-zinc-500">
            The start date can be today. The promotion runs until the end of the end date.
          </p>

          {view.error && (
            <p role="alert" className="mt-4 rounded border border-red-300 bg-red-50 p-3 text-sm text-red-800">
              {view.error}
            </p>
          )}

          <form className="mt-4 flex flex-wrap items-end gap-3" onSubmit={submitPromotion}>
            <label className="flex flex-col gap-1 text-sm font-medium">
              Start date
              <input
                type="date"
                required
                min={today}
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="input"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm font-medium">
              End date
              <input
                type="date"
                required
                min={startDate || today}
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="input"
              />
            </label>
            <button type="submit" disabled={isSubmitting} className="btn btn-primary">
              {isSubmitting ? "Promoting..." : "Promote"}
            </button>
          </form>
        </section>
      )}
    </main>
  );
}
