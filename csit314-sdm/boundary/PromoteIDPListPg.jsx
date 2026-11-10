// Boundary: PromoteIDPListPg
// Feature: Promote IDP (Platform Management) - step 1, choose the IDP to promote.
// Clicking "Promote" on a card opens PromoteIDPPg for that IDP.
//
// Route: /platform-manager/promote-idp   (app/platform-manager/promote-idp/page.jsx renders this)
//
// What goes here (same card grid as the customer home page):
// - Search box: title, IDP ID, designer ID, company, category or property type.
// - Cards with the main photo, title, status, company and property details.
// - Only the first MAX_VISIBLE_IDPS matches are shown; the customer refines the search for more.
//
// Methods:
// - displayIDPs(idps)
// - displayErrorMsg(message)
//
// Attributes: none
"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { PromoteIDPController } from "@/controller/PromoteIDPController";
import { PHOTO_NOT_FOUND } from "@/boundary/PhotoFallback";
import StatusBadge from "@/boundary/StatusBadge";
import BackButton from "@/boundary/BackButton";

const MAX_VISIBLE_IDPS = 48;

export default function PromoteIDPListPg() {
  const [idps, setIDPs] = useState([]);
  const [search, setSearch] = useState("");
  const [view, setView] = useState({ kind: "loading" });

  const displayIDPs = (rows) => {
    setIDPs(rows);
    setView(rows.length ? { kind: "list" } : { kind: "empty" });
  };
  const displayErrorMsg = (message) => setView({ kind: "error", message });

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const rows = await PromoteIDPController.getIDPs();
        if (!cancelled) displayIDPs(rows);
      } catch {
        if (!cancelled) displayErrorMsg("Unable to load IDPs. Please try again.");
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const matchingIDPs = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return idps;
    return idps.filter((idp) =>
      [idp.idpID, idp.title, idp.designerID, idp.companyName, idp.category, idp.propertyType]
        .join(" ")
        .toLowerCase()
        .includes(query),
    );
  }, [idps, search]);

  const visibleIDPs = matchingIDPs.slice(0, MAX_VISIBLE_IDPS);

  return (
    <main className="mx-auto w-full max-w-5xl p-8">
      <BackButton fallbackHref="/platform-manager/report" />
      <h1 className="text-3xl font-semibold">Promote an IDP</h1>
      <p className="mt-1 text-sm text-zinc-500">
        Promoted IDPs appear under &ldquo;Featured projects&rdquo; on the customer home page while their promotion runs.
      </p>

      {view.kind === "loading" && <p className="mt-6">Loading...</p>}
      {view.kind === "error" && <p className="mt-6 text-red-600">{view.message}</p>}
      {view.kind === "empty" && <p className="mt-6">No IDPs are available to promote.</p>}

      {view.kind === "list" && (
        <>
          <input
            type="search"
            placeholder="Search by title, ID, designer, company, category or property type"
            aria-label="Search IDPs"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            maxLength={100}
            className="input mt-6 w-full max-w-xl"
          />
          <p className="mt-3 text-sm text-zinc-500">
            {matchingIDPs.length === 0
              ? "No IDPs match that search."
              : matchingIDPs.length > MAX_VISIBLE_IDPS
                ? `Showing the first ${MAX_VISIBLE_IDPS} of ${matchingIDPs.length.toLocaleString()} projects. Search to narrow them down.`
                : `${matchingIDPs.length} ${matchingIDPs.length === 1 ? "project" : "projects"}`}
          </p>

          <ul className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {visibleIDPs.map((idp) => (
              <li key={idp.idpID} className="card card-hover flex flex-col overflow-hidden">
                <Link href={`/platform-manager/promote-idp/${idp.idpID}`} className="flex-1">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={idp.mainPhotoURL ?? PHOTO_NOT_FOUND}
                    alt={idp.title}
                    loading="lazy"
                    className="photo"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = PHOTO_NOT_FOUND;
                    }}
                  />
                  <div className="px-4 pt-3">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-medium">{idp.title}</p>
                      <StatusBadge status={idp.status} />
                    </div>
                    <p className="mt-1 text-sm text-zinc-500">
                      {idp.companyName ?? idp.designerID} · IDP {idp.idpID}
                    </p>
                    <p className="text-sm text-zinc-500">
                      {idp.style} · {idp.propertyType} · {idp.category}
                    </p>
                  </div>
                </Link>
                <div className="px-4 pb-4 pt-3">
                  <Link href={`/platform-manager/promote-idp/${idp.idpID}`} className="btn btn-sm btn-primary">
                    Promote
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </main>
  );
}
