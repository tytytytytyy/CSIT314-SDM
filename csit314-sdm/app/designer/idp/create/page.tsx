// Route: /designer/idp/create
// Only connects the URL to the boundary. Gets the form data from the controller
// on the server, then shows CreateIDPPg.

import { Suspense } from "react";
import { connection } from "next/server";
import CreateIDPPg from "@/boundary/CreateIDPPg";
import { CreateIDPController } from "@/controller/CreateIDPController";
import { getLoggedInAccountID } from "@/lib/session";

export default function Page() {
  return (
    <Suspense fallback={<p className="p-10 text-sm text-zinc-500">Loading...</p>}>
      <CreateIDPRoute />
    </Suspense>
  );
}

async function CreateIDPRoute() {
  await connection(); // always read fresh data from the database
  const controller = new CreateIDPController();
  const categories = controller
    .getCreateFormData()
    .map((category) => ({ categoryID: category.categoryID, name: category.name }));

  return (
    <CreateIDPPg categories={categories} designerVerified={controller.checkDesignerVerified(getLoggedInAccountID())} />
  );
}
