// Boundary: PromoteIDPPg
// Feature: Promote IDP (Platform Management)
// User story: As a platform manager, I want to promote an IDP for a set period,
// so that high-quality projects get more visibility.
//
// Route: /platform-manager/promote-idp/[idpID]   (app/platform-manager/promote-idp/[idpID]/page.jsx renders this)
//
// What goes here:
// - Form showing the selected IDP with a start date and end date picker.
// - "Promote" button that submits to PromoteIDPController.
// - Success / error messages (e.g. promotion limit reached, invalid dates).
//
// Methods:
// - displayPromoteForm(idp)
// - submitPromotion(idpID, startDate, endDate)
// - displaySuccessPg()
// - displayErrorPg(message)
//
// Attributes: none

"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { PromoteIDPController } from "@/controller/PromoteIDPController";
import { SessionController } from "@/controller/SessionController";
import BackButton from "@/boundary/BackButton";

function getLocalDateValue(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getNextDateValue() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return getLocalDateValue(tomorrow);
}

const PROMOTION_ERRORS = {
  notFound: "This IDP could not be found.",
  designerNotVerified: "This IDP's designer is suspended or not yet verified, so it cannot be promoted.",
  invalidStartDate: "The start date must be today or later.",
  invalidEndDate: "The end date must be after the start date.",
  maxPromotionsReached: "The promotion limit has been reached for one or more selected dates.",
  dateOverlap: "This IDP already has a promotion that overlaps the selected dates.",
};

export default function PromoteIDPPg({ params }) {
  const routeID = params?.idpID;
  const parsedID = Number(routeID);
  const isValidID = Number.isSafeInteger(parsedID) && parsedID > 0;
  const [view, setView] = useState({ kind: "loading" });
  const [startDate, setStartDate] = useState(() => getLocalDateValue());
  const [endDate, setEndDate] = useState(() => getNextDateValue());
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const loadIDP = async () => {
      if (!isValidID) {
        setView({ kind: "notFound" });
        return;
      }
      try {
        const idp = await PromoteIDPController.getIDP(parsedID);
        if (!cancelled) {
          setView(idp ? { kind: "form", idp } : { kind: "notFound" });
        }
      } catch (error) {
        if (!cancelled) {
          setView({
            kind: "error",
            message:
              error instanceof Error
                ? error.message
                : "Unable to load this IDP. Please try again.",
          });
        }
      }
    };

    void loadIDP();
    return () => {
      cancelled = true;
    };
  }, [isValidID, parsedID]);

  const submitPromotion = async (event) => {
    event.preventDefault();
    if (view.kind !== "form") return;

    const manager = SessionController.getLoggedInAccount();
    if (manager?.profileID !== "platformManager") {
      setView({
        kind: "error",
        message: "Please log in as a platform manager before promoting an IDP.",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await PromoteIDPController.promoteIDP(
        parsedID,
        startDate,
        endDate,
        manager.accountID,
      );
      if (result.status === "ok") {
        setView({ kind: "success", idp: view.idp });
      } else {
        setView({
          kind: "form",
          idp: view.idp,
          error: PROMOTION_ERRORS[result.status] ?? "Unable to create this promotion.",
        });
      }
    } catch (error) {
      setView({
        kind: "form",
        idp: view.idp,
        error:
          error instanceof Error
            ? error.message
            : "Unable to create this promotion. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (view.kind === "loading") return <p className="p-8">Loading IDP...</p>;
  if (view.kind === "notFound") {
    return (
      <main className="mx-auto w-full max-w-3xl space-y-4 p-8">
        <h1 className="text-3xl font-semibold">Promote IDP</h1>
        <p role="alert" className="text-red-700">IDP not found.</p>
        <Link href="/platform-manager/promote-idp" className="btn">
          <span aria-hidden="true">←</span> Back to Promote IDP
        </Link>
      </main>
    );
  }
  if (view.kind === "error") {
    return (
      <main className="mx-auto w-full max-w-3xl space-y-4 p-8">
        <h1 className="text-3xl font-semibold">Promote IDP</h1>
        <p role="alert" className="text-red-700">{view.message}</p>
        <div className="flex flex-wrap gap-3">
          <Link href="/platform-manager/promote-idp" className="btn">
            <span aria-hidden="true">←</span> Promote IDP
          </Link>
          <Link href="/login" className="btn btn-primary">Log in</Link>
        </div>
      </main>
    );
  }
  if (view.kind === "success") {
    return (
      <main className="mx-auto w-full max-w-3xl space-y-4 p-8">
        <h1 className="text-3xl font-semibold">IDP promoted</h1>
        <p role="status">
          “{view.idp.title}” is scheduled for promotion from {startDate} to {endDate}.
        </p>
        <Link href="/platform-manager/promote-idp" className="btn btn-primary">
          <span aria-hidden="true">←</span> Return to Promote IDP
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-3xl space-y-6 p-8">
      <BackButton fallbackHref="/platform-manager/promote-idp" className="" />
      <div>
        <h1 className="text-3xl font-semibold">Promote IDP</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Schedule additional visibility for this project.
        </p>
      </div>

      <section className="card p-5">
        <h2 className="text-xl font-medium">{view.idp.title}</h2>
        <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-zinc-500">IDP ID</dt>
            <dd>{view.idp.idpID}</dd>
          </div>
          <div>
            <dt className="text-zinc-500">Designer ID</dt>
            <dd>{view.idp.designerID}</dd>
          </div>
          <div>
            <dt className="text-zinc-500">Category</dt>
            <dd>{view.idp.category} · {view.idp.propertyType}</dd>
          </div>
          <div>
            <dt className="text-zinc-500">Status</dt>
            <dd className="capitalize">{view.idp.status}</dd>
          </div>
        </dl>
      </section>

      {view.error && (
        <p role="alert" className="rounded border border-red-300 bg-red-50 p-3 text-sm text-red-800">
          {view.error}
        </p>
      )}

      <form className="flex flex-wrap items-end gap-3" onSubmit={submitPromotion}>
        <label className="flex flex-col gap-1 text-sm font-medium">
          Start date
          <input
            type="date"
            required
            value={startDate}
            onChange={(event) => setStartDate(event.target.value)}
            className="input"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">
          End date
          <input
            type="date"
            required
            value={endDate}
            onChange={(event) => setEndDate(event.target.value)}
            className="input"
          />
        </label>
        <button
          type="submit"
          disabled={isSubmitting}
          className="btn btn-primary"
        >
          {isSubmitting ? "Promoting..." : "Promote"}
        </button>
      </form>
    </main>
  );
}
