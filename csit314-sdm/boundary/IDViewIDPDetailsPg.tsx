// Boundary: IDViewIDPDetailsPg
// Feature: View IDP Details (Interior Designer)
// Not the same as IDPViewPg (Customer): only the owner can open it, it shows the status and
// photo captions, and it has an Edit button instead of a Like button.
//
// Route: /designer/idp/[idpID]   (app/designer/idp/[idpID]/page.tsx renders this)
//
// What goes here:
// - Title, status, photos with captions, style, property type, category, budget, description.
// - "Edit IDP" button for Update IDP (disabled until Update IDP is built).
//
// Methods:
// - displayIDPDetails(idpDetails)
// - displayErrorPg(message)          "IDP not found" or "You can only view your own IDPs"
//
// Attributes: none
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { IDViewIDPDetailsController, type IDPDetails } from "@/controller/IDViewIDPDetailsController";
import { SessionController } from "@/controller/SessionController";

type View =
  | { kind: "loading" }
  | { kind: "details"; details: IDPDetails }
  | { kind: "error"; message: string };

export default function IDViewIDPDetailsPg({ idpID }: { idpID: number }) {
  const [view, setView] = useState<View>({ kind: "loading" });

  const displayIDPDetails = (idpDetails: IDPDetails) => setView({ kind: "details", details: idpDetails });
  const displayErrorPg = (message: string) => setView({ kind: "error", message });

  useEffect(() => {
    // Designer clicks one of their IDPs -> the page asks the controller for its details.
    const load = async () => {
      const designerID = SessionController.getLoggedInDesignerID();
      const result = await IDViewIDPDetailsController.viewIDPDetails(designerID, idpID);
      if (result.status === "ok" && result.details) displayIDPDetails(result.details);
      else if (result.status === "notOwner") displayErrorPg("You can only view your own IDPs");
      else displayErrorPg("IDP not found");
    };
    load();
  }, [idpID]);

  if (view.kind === "loading") return <p className="p-8">Loading...</p>;
  if (view.kind === "error") return <p className="p-8 text-red-600">{view.message}</p>;

  const { idp, photos } = view.details;
  return (
    <main className="mx-auto w-full max-w-3xl p-8">
      <p className="text-sm text-zinc-500">My IDP #{idp.idpID}</p>
      <div className="mt-1 flex flex-wrap items-center gap-3">
        <h1 className="text-3xl font-semibold">{idp.title}</h1>
        <span
          className={`rounded-full px-3 py-1 text-xs font-medium ${
            idp.status === "completed" ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"
          }`}
        >
          {idp.status === "completed" ? "Completed" : "Ongoing"}
        </span>
      </div>

      <div className="mt-4 flex gap-3">
        <button
          type="button"
          disabled
          title="Update IDP is not built yet"
          className="rounded border bg-zinc-900 px-4 py-2 text-white disabled:opacity-40"
        >
          Edit IDP
        </button>
        <Link href="/" className="rounded border px-4 py-2">
          Back
        </Link>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {photos.map((photo) => (
          <figure key={photo.photoID}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photo.photoURL} alt={photo.caption} className="rounded" />
            <figcaption className="mt-1 text-sm text-zinc-500">
              {photo.sortOrder === 1 ? "Main photo: " : ""}
              {photo.caption}
            </figcaption>
          </figure>
        ))}
      </div>

      <dl className="mt-6 grid grid-cols-[8rem_1fr] gap-y-2">
        <dt className="font-medium">Style</dt>
        <dd>{idp.style}</dd>
        <dt className="font-medium">Property type</dt>
        <dd>{idp.propertyType}</dd>
        <dt className="font-medium">Category</dt>
        <dd>{idp.category}</dd>
        <dt className="font-medium">Budget</dt>
        <dd>${idp.budget.toLocaleString()}</dd>
        <dt className="font-medium">Description</dt>
        <dd>{idp.description}</dd>
      </dl>
    </main>
  );
}
