"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { PromoteIDPController } from "@/controller/PromoteIDPController";

const MAX_VISIBLE_IDPS = 50;

export default function PromoteIDPListPg() {
  const [idps, setIDPs] = useState([]);
  const [search, setSearch] = useState("");
  const [view, setView] = useState({ kind: "loading" });

  useEffect(() => {
    let cancelled = false;

    const loadIDPs = async () => {
      try {
        const rows = await PromoteIDPController.getIDPs();
        if (!cancelled) {
          setIDPs(rows);
          setView(rows.length ? { kind: "list" } : { kind: "empty" });
        }
      } catch (error) {
        if (!cancelled) {
          setView({
            kind: "error",
            message:
              error instanceof Error
                ? error.message
                : "Unable to load IDPs. Please try again.",
          });
        }
      }
    };

    void loadIDPs();
    return () => {
      cancelled = true;
    };
  }, []);

  const matchingIDPs = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return idps;
    return idps.filter((idp) =>
      [idp.idpID, idp.title, idp.designerID, idp.category, idp.propertyType]
        .join(" ")
        .toLowerCase()
        .includes(query),
    );
  }, [idps, search]);

  const visibleIDPs = matchingIDPs.slice(0, MAX_VISIBLE_IDPS);

  return (
    <main className="mx-auto w-full max-w-5xl space-y-6 p-8">
      <div>
        <h1 className="text-3xl font-semibold">Promote an IDP</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Find a project and choose its promotion dates.
        </p>
      </div>

      {view.kind === "loading" && (
        <p role="status" className="text-sm text-zinc-500">Loading IDPs...</p>
      )}
      {view.kind === "error" && (
        <p role="alert" className="rounded border border-red-300 bg-red-50 p-3 text-sm text-red-800">
          {view.message}
        </p>
      )}
      {view.kind === "empty" && <p>No IDPs are available to promote.</p>}
      {view.kind === "list" && (
        <>
          <label className="flex max-w-lg flex-col gap-1 text-sm font-medium">
            Search by project, ID, designer, category or property type
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="rounded border px-3 py-2"
            />
          </label>
          {matchingIDPs.length === 0 ? (
            <p>No IDPs match that search.</p>
          ) : (
            <>
              <p className="text-sm text-zinc-500">
                {matchingIDPs.length > MAX_VISIBLE_IDPS
                  ? `Showing the first ${MAX_VISIBLE_IDPS} of ${matchingIDPs.length} matches. Refine your search to see others.`
                  : `${matchingIDPs.length} ${matchingIDPs.length === 1 ? "project" : "projects"}`}
              </p>
              <ul className="grid gap-3 sm:grid-cols-2">
                {visibleIDPs.map((idp) => (
                  <li
                    key={idp.idpID}
                    className="flex items-center justify-between gap-4 rounded border p-4"
                  >
                    <div className="min-w-0">
                      <h2 className="truncate font-medium">{idp.title}</h2>
                      <p className="mt-1 text-sm text-zinc-500">
                        IDP {idp.idpID} · Designer {idp.designerID}
                      </p>
                      <p className="text-sm text-zinc-500">
                        {idp.category} · {idp.propertyType} ·{" "}
                        <span className="capitalize">{idp.status}</span>
                      </p>
                    </div>
                    <Link
                      href={`/platform-manager/promote-idp/${idp.idpID}`}
                      className="shrink-0 rounded bg-zinc-900 px-3 py-2 text-sm text-white"
                    >
                      Select
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          )}
        </>
      )}
    </main>
  );
}
