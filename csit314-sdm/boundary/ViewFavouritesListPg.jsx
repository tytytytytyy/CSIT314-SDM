// Boundary: ViewFavouritesListPg
// Feature: View Favourites List (Customer)
//
// Route: /customer/favourites   (app/customer/favourites/page.jsx renders this)
//
// What goes here:
// - List of IDPs the customer has liked: title, main photo and style.
// - Each item links to IDPViewPg.
// - Empty message when nothing has been liked yet.
// - Needs a logged-in customer.
//
// Methods:
// - displayFavourites(favourites)
// - displayEmptyList()
// - displayErrorPg(message)
//
// Attributes: none
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ViewFavouritesListController } from "@/controller/ViewFavouritesListController";
import { SessionController } from "@/controller/SessionController";

export default function ViewFavouritesListPg() {
  const [view, setView] = useState({ kind: "loading" });

  const displayFavourites = (favourites) =>
    setView({ kind: "list", favourites });
  const displayEmptyList = () => setView({ kind: "empty" });
  const displayErrorPg = (message) => setView({ kind: "error", message });

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

  return (
    <main className="mx-auto w-full max-w-3xl p-8">
      <h1 className="text-3xl font-semibold">Favourites List</h1>
      {view.kind === "loading" && <p className="mt-6">Loading...</p>}
      {view.kind === "error" && (
        <p className="mt-6 text-red-600">{view.message}</p>
      )}
      {view.kind === "empty" && (
        <p className="mt-6">You have not liked any IDPs yet.</p>
      )}
      {view.kind === "list" && (
        <ul className="mt-6 grid gap-4 sm:grid-cols-2">
          {view.favourites.map((item) => (
            <li key={item.idpID} className="overflow-hidden rounded border">
              <Link href={`/idp/${item.idpID}`}>
                {item.mainPhotoURL && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.mainPhotoURL}
                    alt={item.title}
                    className="w-full"
                  />
                )}
                <div className="p-3">
                  <p className="font-medium">{item.title}</p>
                  <p className="text-sm text-zinc-500">{item.styleName}</p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
