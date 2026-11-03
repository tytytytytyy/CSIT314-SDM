// Boundary: IDMyIDPListPg
// Feature: View IDP Details (Interior Designer) - step 1, the designer's own IDP list.
// Clicking an IDP opens IDViewIDPDetailsPg.
//
// Route: /designer/idp   (app/designer/idp/page.tsx renders this)
//
// What goes here:
// - The logged-in designer's IDPs: main photo, title, property type, category, status.
// - How many are completed out of the total.
// - Empty message when the designer has no IDPs yet.
//
// Methods:
// - displayMyIDPs(myIDPs)
// - displayEmptyList()
//
// Attributes: none
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { IDViewIDPDetailsController, type MyIDPItem } from "@/controller/IDViewIDPDetailsController";
import { SessionController } from "@/controller/SessionController";
import StatusBadge from "@/boundary/StatusBadge";

type View = { kind: "loading" } | { kind: "list"; myIDPs: MyIDPItem[] } | { kind: "empty" };

export default function IDMyIDPListPg() {
  const [view, setView] = useState<View>({ kind: "loading" });

  const displayMyIDPs = (myIDPs: MyIDPItem[]) => setView({ kind: "list", myIDPs });
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
      <h1 className="text-3xl font-semibold">My IDPs</h1>
      {view.kind === "loading" && <p className="mt-6">Loading...</p>}
      {view.kind === "empty" && <p className="mt-6">You have not created any IDPs yet.</p>}
      {view.kind === "list" && (
        <>
          <p className="mt-1 text-sm text-zinc-500">
            {view.myIDPs.filter((item) => item.status === "completed").length} of {view.myIDPs.length} completed
          </p>
          <ul className="mt-6 grid gap-4 sm:grid-cols-2">
            {view.myIDPs.map((item) => (
              <li key={item.idpID} className="overflow-hidden rounded border">
                <Link href={`/designer/idp/${item.idpID}`}>
                  {item.mainPhotoURL && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.mainPhotoURL} alt={item.title} className="aspect-[8/5] w-full object-cover" />
                  )}
                  <div className="p-3">
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
