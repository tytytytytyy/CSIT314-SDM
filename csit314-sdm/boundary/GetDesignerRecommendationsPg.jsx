// Boundary: GetDesignerRecommendationsPg
// Feature: Get Designer Recommendations (Customer)
// User story: As a customer, I want to get interior designer recommendations based on the
// IDPs I have liked, so that I can discover designers who match my taste.
//
// Route: /customer/recommendations   (app/customer/recommendations/page.jsx renders this)
//
// What goes here:
// - List of recommended designers (company name, logo, top styles, sample IDP photos).
// - A short reason per designer, e.g. "Because you liked Scandinavian projects".
// - A message when showing fallback (cold start) results.
// - Needs a logged-in customer.
//
// Methods:
// - displayRecommendations(recommendations)
// - displayColdStartMessage()        "Like a few IDPs to get personalised picks"
// - displayErrorPg(message)
//
// Attributes: none
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { GetDesignerRecommendationsController } from "@/controller/GetDesignerRecommendationsController";
import { SessionController } from "@/controller/SessionController";
import { PHOTO_NOT_FOUND } from "@/boundary/PhotoFallback";

export default function GetDesignerRecommendationsPg() {
  const [view, setView] = useState({ kind: "loading" });
  const [coldStart, setColdStart] = useState(null);

  const displayRecommendations = (recommendations) =>
    setView({ kind: "list", recommendations });
  const displayColdStartMessage = (likesNeeded) =>
    setColdStart({ likesNeeded });
  const displayErrorPg = (message) => setView({ kind: "error", message });

  useEffect(() => {
    // Customer clicks "Recommended Designers" in the nav bar.
    const load = async () => {
      const customerID = SessionController.getLoggedInCustomerID();
      if (!customerID) {
        displayErrorPg("Please log in as a customer");
        return;
      }
      try {
        const result =
          await GetDesignerRecommendationsController.getRecommendations(
            customerID,
          );
        if (result.status === "coldStart")
          displayColdStartMessage(result.likesNeeded);
        if (result.recommendations.length === 0)
          displayErrorPg("No verified designers to recommend yet.");
        else displayRecommendations(result.recommendations);
      } catch {
        displayErrorPg("Could not load recommendations. Please try again.");
      }
    };
    load();
  }, []);

  return (
    <main className="mx-auto w-full max-w-5xl p-8">
      <h1 className="text-3xl font-semibold">Recommended Designers</h1>
      <p className="mt-1 text-zinc-500">
        Designers picked for you from the IDPs you have liked.
      </p>

      {coldStart && view.kind !== "error" && (
        <div className="mt-6 rounded border border-amber-300 bg-amber-50 p-4 text-amber-900">
          {coldStart.likesNeeded > 0 ? (
            <p>
              Like a few IDPs to get personalised picks. Like{" "}
              {coldStart.likesNeeded} more{" "}
              {coldStart.likesNeeded === 1 ? "IDP" : "IDPs"} and we&apos;ll
              match designers to your taste. For now, here are the most popular
              designers.
            </p>
          ) : (
            <p>
              No verified designers match the styles you liked yet. Here are the
              most popular designers instead.
            </p>
          )}
        </div>
      )}

      {view.kind === "loading" && <p className="mt-6">Loading...</p>}
      {view.kind === "error" && (
        <p className="mt-6 text-red-600">{view.message}</p>
      )}
      {view.kind === "list" && (
        <ol className="mt-6 grid gap-6 md:grid-cols-2">
          {view.recommendations.map((d) => (
            <li key={d.designerID} className="rounded border p-4">
              <div className="flex items-start gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={d.logoURL}
                  alt={`${d.companyName} logo`}
                  className="h-14 w-14 shrink-0 rounded"
                />
                <div className="min-w-0">
                  <h2 className="text-lg font-semibold">{d.companyName}</h2>
                  <p className="text-sm text-zinc-500">{d.location}</p>
                  <p className="mt-1 text-sm font-medium text-emerald-700">
                    {d.reason}
                  </p>
                </div>
              </div>

              {d.topStyles.length > 0 && (
                <ul className="mt-3 flex flex-wrap gap-2">
                  {d.topStyles.map((s) => (
                    <li
                      key={s}
                      className="rounded-full border px-2 py-0.5 text-xs"
                    >
                      {s}
                    </li>
                  ))}
                </ul>
              )}

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
        </ol>
      )}
    </main>
  );
}
