// Boundary: ViewFavouritesListPg
// Features: View Favourites List and Unlike IDP (Customer)
//
// Route: /customer/favourites   (app/customer/favourites/page.jsx renders this)
//
// What goes here:
// - List of IDPs the customer has liked: title, main photo and style.
// - Each item links to ViewIDPPg.
// - "Unlike" button on each item removes it from the list, with an Undo link.
// - Empty message when nothing has been liked yet.
// - Needs a logged-in customer.
//
// Methods:
// - displayFavourites(favourites)
// - displayEmptyList()
// - displayErrorPg(message)
// - unlikeIDP(item)                  customer clicks Unlike
// - undoUnlike()                     customer clicks Undo
//
// Attributes: none
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ViewFavouritesListController } from "@/controller/ViewFavouritesListController";
import { LikeIDPController } from "@/controller/LikeIDPController";
import { SessionController } from "@/controller/SessionController";
import { PHOTO_NOT_FOUND } from "@/boundary/PhotoFallback";
import BackButton from "@/boundary/BackButton";

export default function ViewFavouritesListPg() {
  const [view, setView] = useState({ kind: "loading" });
  // The last IDP removed, so the customer can undo it: { item, index }
  const [lastRemoved, setLastRemoved] = useState(null);
  const [busyID, setBusyID] = useState(null);

  const displayFavourites = (favourites) =>
    setView({ kind: "list", favourites });
  const displayEmptyList = () => setView({ kind: "empty" });
  const displayErrorPg = (message) => setView({ kind: "error", message });

  const showList = (favourites) =>
    favourites.length === 0 ? displayEmptyList() : displayFavourites(favourites);

  useEffect(() => {
    // Customer clicks "Favourites List" in the nav bar.
    const load = async () => {
      const customerID = SessionController.getLoggedInCustomerID();
      if (!customerID) {
        displayErrorPg("Please log in as a customer");
        return;
      }
      const favourites =
        await ViewFavouritesListController.getFavourites(customerID);
      if (favourites.length === 0) displayEmptyList();
      else displayFavourites(favourites);
    };
    load();
  }, []);

  const unlikeIDP = async (item) => {
    const customerID = SessionController.getLoggedInCustomerID();
    if (!customerID || view.kind !== "list") return;
    setBusyID(item.idpID);
    await LikeIDPController.unlikeIDP(customerID, item.idpID);
    const index = view.favourites.findIndex((f) => f.idpID === item.idpID);
    setLastRemoved({ item, index });
    showList(view.favourites.filter((f) => f.idpID !== item.idpID));
    setBusyID(null);
  };

  const undoUnlike = async () => {
    const customerID = SessionController.getLoggedInCustomerID();
    if (!customerID || !lastRemoved) return;
    await LikeIDPController.likeIDP(customerID, lastRemoved.item.idpID);
    const current = view.kind === "list" ? view.favourites : [];
    const restored = [...current];
    restored.splice(lastRemoved.index, 0, lastRemoved.item);
    setLastRemoved(null);
    displayFavourites(restored);
  };

  return (
    <main className="mx-auto w-full max-w-5xl p-8">
      <BackButton fallbackHref="/" />
      <h1 className="text-3xl font-semibold">Favourites List</h1>
      <p className="mt-1 text-zinc-500">
        Projects you have liked. Unlike one to remove it from this list.
      </p>

      {lastRemoved && (
        <div
          role="status"
          className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-zinc-300 bg-zinc-50 px-4 py-3 text-sm text-zinc-800 dark:bg-zinc-900 dark:text-zinc-200"
        >
          <span>
            Removed &ldquo;{lastRemoved.item.title}&rdquo; from your favourites.
          </span>
          <span className="flex gap-2">
            <button type="button" onClick={undoUnlike} className="btn btn-sm">
              Undo
            </button>
            <button
              type="button"
              onClick={() => setLastRemoved(null)}
              className="btn btn-sm"
              aria-label="Dismiss"
            >
              ✕
            </button>
          </span>
        </div>
      )}

      {view.kind === "loading" && <p className="mt-6">Loading...</p>}
      {view.kind === "error" && (
        <p className="mt-6 text-red-600">{view.message}</p>
      )}
      {view.kind === "empty" && (
        <div className="card mt-6 p-8 text-center">
          <p className="text-zinc-500">You have not liked any IDPs yet.</p>
          <Link href="/" className="btn btn-primary mt-4">
            Browse IDPs
          </Link>
        </div>
      )}
      {view.kind === "list" && (
        <ul className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {view.favourites.map((item) => (
            <li
              key={item.idpID}
              className="card card-hover flex flex-col overflow-hidden"
            >
              <Link href={`/customer/idp/${item.idpID}`} className="flex-1">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.mainPhotoURL ?? PHOTO_NOT_FOUND}
                  alt={item.title}
                  loading="lazy"
                  className="photo"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = PHOTO_NOT_FOUND;
                  }}
                />
                <div className="p-4 pb-2">
                  <p className="font-medium">{item.title}</p>
                  <p className="text-sm text-zinc-500">{item.styleName}</p>
                </div>
              </Link>
              <div className="px-4 pb-4 pt-2">
                <button
                  type="button"
                  onClick={() => unlikeIDP(item)}
                  disabled={busyID === item.idpID}
                  className="btn btn-sm btn-danger-outline"
                  aria-label={`Unlike ${item.title}`}
                >
                  <span aria-hidden="true">♥</span> Unlike
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
