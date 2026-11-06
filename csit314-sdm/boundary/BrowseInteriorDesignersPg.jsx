// Boundary: BrowseInteriorDesignersPg
// Feature: Browse Interior Designers (Customer)
// User story: As a customer, I want to browse verified interior designers,
// so that I can compare firms before choosing one.
//
// Route: /customer/designers   (app/customer/designers/page.jsx renders this). No login needed.
//
// What goes here:
// - Grid of designer cards: company name, logo, location, styles, number of IDPs, total likes,
//   and up to 3 sample IDP photos (each links to ViewIDPPg).
// - Filters: keyword (name, description or designer ID), location, style, category.
// - "/customer/designers?designer=D1" (the "By ..." link on an IDP page) shows only that
//   designer, with a "Show all designers" link.
// - Sort dropdown: name, most IDPs, most liked, newest.
// - The page opens with every verified designer listed (no filters, sorted by name);
//   the customer clicks Search to apply filters and sort.
//
// Methods:
// - displayDesigners(designers)
// - submitFilters(filters, sortBy)
// - displayNoResults()
// - displayErrorPg(message)
//
// Attributes: none
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { BrowseInteriorDesignersController } from "@/controller/BrowseInteriorDesignersController";
import { PHOTO_NOT_FOUND } from "@/boundary/PhotoFallback";

const SORT_LABELS = {
  name: "Name (A-Z)",
  mostIDPs: "Most IDPs",
  mostLiked: "Most liked",
  newest: "Newest",
};

const EMPTY_FILTERS = { keyword: "", location: "", style: "", category: "" };

export default function BrowseInteriorDesignersPg() {
  const [view, setView] = useState({ kind: "loading" });
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [sortBy, setSortBy] = useState("name");
  const options = BrowseInteriorDesignersController.getFilterOptions();
  const router = useRouter();
  // "/customer/designers?designer=D1" (the "By ..." link on an IDP page) shows just that designer.
  const onlyDesignerID = useSearchParams().get("designer") || null;

  const displayDesigners = (designers) => setView({ kind: "list", designers });
  const displayNoResults = () => setView({ kind: "empty" });
  const displayErrorPg = (message) => setView({ kind: "error", message });

  const showResult = (result) => {
    if (result.status === "invalid") displayErrorPg(result.message);
    else if (result.designers.length === 0) displayNoResults();
    else displayDesigners(result.designers);
  };

  const loadDesigners = async (chosenFilters, chosenSort) => {
    try {
      return await BrowseInteriorDesignersController.browseDesigners(
        chosenFilters,
        chosenSort,
      );
    } catch {
      return {
        status: "invalid",
        message: "Could not load designers. Please try again.",
      };
    }
  };

  // Customer clicks Search (or Clear) with the chosen filters and sort.
  const submitFilters = async (chosenFilters, chosenSort) => {
    showResult(await loadDesigners(chosenFilters, chosenSort));
  };

  useEffect(() => {
    // Customer clicks "Browse Designers" in the nav bar: show every verified designer.
    // From an IDP page's "By ..." link: show just that designer.
    const load = async () => {
      const startFilters = onlyDesignerID
        ? { ...EMPTY_FILTERS, designerID: onlyDesignerID }
        : EMPTY_FILTERS;
      const result = await loadDesigners(startFilters, "name");
      if (result.status === "invalid") displayErrorPg(result.message);
      else if (result.designers.length === 0) displayNoResults();
      else displayDesigners(result.designers);
    };
    load();
  }, [onlyDesignerID]);

  const onSubmit = (e) => {
    e.preventDefault();
    submitFilters(
      onlyDesignerID ? { ...filters, designerID: onlyDesignerID } : filters,
      sortBy,
    );
  };

  // Back to every designer. When only one designer is shown, dropping "?designer=" from the
  // URL reloads the list through the effect above.
  const onClear = () => {
    setFilters(EMPTY_FILTERS);
    setSortBy("name");
    if (onlyDesignerID) router.replace("/customer/designers");
    else submitFilters(EMPTY_FILTERS, "name");
  };

  const setField = (field) => (e) =>
    setFilters({ ...filters, [field]: e.target.value });

  const inputClass = "rounded border px-3 py-2 text-sm";

  return (
    <main className="mx-auto w-full max-w-5xl p-8">
      <h1 className="text-3xl font-semibold">Browse Interior Designers</h1>
      <p className="mt-1 text-zinc-500">
        Compare verified interior design firms and their work.
      </p>

      <form
        onSubmit={onSubmit}
        className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr_1fr_auto]"
      >
        <input
          type="search"
          placeholder="Search by name, description or ID (e.g. D1)"
          aria-label="Keyword"
          value={filters.keyword}
          onChange={setField("keyword")}
          maxLength={100}
          className={inputClass}
        />
        <input
          type="text"
          placeholder="Location"
          aria-label="Location"
          value={filters.location}
          onChange={setField("location")}
          maxLength={100}
          className={inputClass}
        />
        <select
          aria-label="Style"
          value={filters.style}
          onChange={setField("style")}
          className={inputClass}
        >
          <option value="">All styles</option>
          {options.styles.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <select
          aria-label="Category"
          value={filters.category}
          onChange={setField("category")}
          className={inputClass}
        >
          <option value="">All categories</option>
          {options.categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select
          aria-label="Sort by"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className={inputClass}
        >
          {options.sortOptions.map((s) => (
            <option key={s} value={s}>
              Sort: {SORT_LABELS[s]}
            </option>
          ))}
        </select>
        <div className="flex gap-2">
          <button
            type="submit"
            className="rounded bg-black px-4 py-2 text-sm text-white"
          >
            Search
          </button>
          <button
            type="button"
            onClick={onClear}
            className="rounded border px-4 py-2 text-sm"
          >
            Clear
          </button>
        </div>
      </form>

      {onlyDesignerID && (
        <p className="mt-6 flex flex-wrap items-center gap-3 rounded border px-4 py-2 text-sm">
          Showing only designer {onlyDesignerID}.
          <button type="button" onClick={onClear} className="underline">
            Show all designers
          </button>
        </p>
      )}

      {view.kind === "loading" && <p className="mt-6">Loading...</p>}
      {view.kind === "error" && (
        <p className="mt-6 text-red-600">{view.message}</p>
      )}
      {view.kind === "empty" && (
        <p className="mt-6">
          No designers match your filters. Try clearing some of them.
        </p>
      )}
      {view.kind === "list" && (
        <ul className="mt-6 grid gap-6 md:grid-cols-2">
          {view.designers.map((d) => (
            <li key={d.designerID} className="rounded border p-4">
              <div className="flex items-start gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={d.logoURL}
                  alt={`${d.companyName} logo`}
                  className="h-14 w-14 shrink-0 rounded"
                />
                <div className="min-w-0">
                  <h2 className="text-lg font-semibold">
                    {d.companyName}{" "}
                    <span className="text-sm font-normal text-zinc-500">{d.designerID}</span>
                  </h2>
                  <p className="text-sm text-zinc-500">{d.location}</p>
                  <p className="mt-1 text-sm">{d.description}</p>
                </div>
              </div>

              {d.styles.length > 0 && (
                <ul className="mt-3 flex flex-wrap gap-2">
                  {d.styles.map((s) => (
                    <li
                      key={s}
                      className="rounded-full border px-2 py-0.5 text-xs"
                    >
                      {s}
                    </li>
                  ))}
                </ul>
              )}

              <p className="mt-3 text-sm text-zinc-600">
                {d.idpCount} {d.idpCount === 1 ? "IDP" : "IDPs"} ·{" "}
                {d.totalLikes} {d.totalLikes === 1 ? "like" : "likes"}
              </p>

              {d.samplePhotos.length > 0 ? (
                <div className="mt-3 grid grid-cols-3 gap-2">
                  {d.samplePhotos.map((p) => (
                    <Link key={p.idpID} href={`/customer/idp/${p.idpID}`} title={p.title}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={p.photoURL}
                        alt={p.title}
                        className="aspect-[8/5] w-full rounded object-cover"
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = PHOTO_NOT_FOUND;
                        }}
                      />
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="mt-3 text-sm text-zinc-500">
                  No projects posted yet.
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
