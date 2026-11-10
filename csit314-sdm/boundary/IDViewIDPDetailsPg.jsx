"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { IDViewIDPDetailsController } from "@/controller/IDViewIDPDetailsController";
import { PHOTO_NOT_FOUND } from "@/boundary/PhotoFallback";
import { SessionController } from "@/controller/SessionController";
import StatusBadge from "@/boundary/StatusBadge";
import BackButton from "@/boundary/BackButton";

export default function IDViewIDPDetailsPg({ idpID }) {
  const [view, setView] = useState({ kind: "loading" });
  const [savedMsg, setSavedMsg] = useState(null);

  const displayIDPDetails = (idpDetails) =>
    setView({ kind: "details", details: idpDetails });
  const displaySavedMsg = (message) => setSavedMsg(message);
  const displayErrorPg = (message) => setView({ kind: "error", message });

  useEffect(() => {
    // Designer clicks one of their IDPs -> the page asks the controller for its details.
    const load = async () => {
      const query = new URLSearchParams(window.location.search);
      if (query.get("created") === "1") displaySavedMsg("IDP created.");
      else if (query.get("updated") === "1") displaySavedMsg("IDP updated.");
      const designerID = SessionController.getLoggedInDesignerID();
      const result = await IDViewIDPDetailsController.viewIDPDetails(
        designerID,
        idpID,
      );
      if (result.status === "ok" && result.details)
        displayIDPDetails(result.details);
      else if (result.status === "notOwner")
        displayErrorPg("You can only view your own IDPs");
      else displayErrorPg("IDP not found");
    };
    load();
  }, [idpID]);

  if (view.kind === "loading") return <p className="p-8">Loading...</p>;
  if (view.kind === "error")
    return (
      <main className="mx-auto w-full max-w-3xl p-8">
        <BackButton fallbackHref="/designer/idp" />
        <p className="text-red-600">{view.message}</p>
      </main>
    );

  const { idp, photos } = view.details;
  return (
    <main className="mx-auto w-full max-w-3xl p-8">
      {/* Always back to the list: after saving, "previous page" would be the edit form. */}
      <Link href="/designer/idp" className="btn btn-sm mb-4">
        <span aria-hidden="true">←</span> My Projects
      </Link>
      <p className="text-sm text-zinc-500">My Project #{idp.idpID}</p>
      <div className="mt-1 flex flex-wrap items-center gap-3">
        <h1 className="text-3xl font-semibold">{idp.title}</h1>
        <StatusBadge status={idp.status} />
      </div>

      {savedMsg && (
        <p
          role="status"
          className="mt-4 rounded border border-green-300 bg-green-50 p-3 text-sm text-green-800"
        >
          {savedMsg}
        </p>
      )}

      <div className="mt-4 flex gap-3">
        <Link
          href={`/designer/idp/${idp.idpID}/edit`}
          className="btn btn-primary"
        >
          Edit IDP
        </Link>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {photos.map((photo, index) => (
          <figure key={photo.photoID}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photo.photoURL}
              alt={photo.caption}
              className="photo rounded-lg border"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = PHOTO_NOT_FOUND;
              }}
            />
            <figcaption className="mt-1 text-sm text-zinc-500">
              {index === 0 ? "Main photo: " : ""}
              {photo.caption}
            </figcaption>
          </figure>
        ))}
      </div>

      <dl className="card mt-6 grid grid-cols-[8rem_1fr] gap-y-3 p-5 text-sm">
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
