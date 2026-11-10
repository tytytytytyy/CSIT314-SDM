import { Suspense } from "react";
import IDViewIDPDetailsPg from "@/boundary/IDViewIDPDetailsPg";

// Needs a logged-in user: LoginGate (app/layout.jsx) shows this page only after reading the
// session in the browser, so it cannot be part of the instant static shell.
export const instant = false;

// Cache Components needs at least one known param for a dynamic route. Any other id still
// renders on demand. Reading params inside <Suspense> lets the page show instantly.
export function generateStaticParams() {
  return [{ idpID: "1" }, { idpID: "2" }, { idpID: "3" }, { idpID: "4" }];
}

export default function Page({ params }) {
  return (
    <Suspense fallback={<p className="p-8">Loading...</p>}>
      <IDPDetailsRoute params={params} />
    </Suspense>
  );
}

async function IDPDetailsRoute({ params }) {
  const { idpID } = await params;
  return <IDViewIDPDetailsPg idpID={Number(idpID)} />;
}
