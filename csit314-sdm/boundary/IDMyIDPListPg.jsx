"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { IDViewIDPDetailsController } from "@/controller/IDViewIDPDetailsController";
import { SessionController } from "@/controller/SessionController";
import StatusBadge from "@/boundary/StatusBadge";
import { PHOTO_NOT_FOUND } from "@/boundary/PhotoFallback";

export default function IDMyIDPListPg() {
  const [view, setView] = useState({ kind: "loading" });

  const displayMyIDPs = (myIDPs) => setView({ kind: "list", myIDPs });
  const displayEmptyList = () => setView({ kind: "empty" });

  useEffect(() => {
    // Designer clicks "My IDPs" in the nav bar.
    const load = async () => {
      const designerID = SessionController.getLoggedInDesignerID();
      const myIDPs = await IDViewIDPDetailsController.getMyIDPs(designerID);
      if (myIDPs.length === 0) displayEmptyList();
      else displayMyIDPs(myIDPs);
    };
    load();
  }, []);

  return (
    <main className="mx-auto w-full max-w-4xl p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-semibold">My Projects</h1>
        <Link href="/designer/idp/create" className="btn btn-primary">
          + Create IDP
        </Link>
      </div>
      {view.kind === "loading" && <p className="mt-6">Loading...</p>}
      {view.kind === "empty" && (
        <p className="mt-6">You have not created any IDPs yet.</p>
      )}
      {view.kind === "list" && (
        <>
          <p className="mt-1 text-sm text-zinc-500">
            {view.myIDPs.filter((item) => item.status === "completed").length}{" "}
            of {view.myIDPs.length} completed
          </p>
          <ul className="mt-6 grid gap-4 sm:grid-cols-2">
            {view.myIDPs.map((item) => (
              <li key={item.idpID} className="card card-hover overflow-hidden">
                <Link href={`/designer/idp/${item.idpID}`}>
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
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-medium">{item.title}</p>
                      <StatusBadge status={item.status} />
                    </div>
                    <p className="mt-1 text-sm text-zinc-500">
                      {item.propertyType} · {item.category}
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </main>
  );
}
