import { Suspense } from "react";
import EditIDPPg from "@/boundary/EditIDPPg";

// Needs a logged-in user: LoginGate (app/layout.jsx) shows this page only after reading the
// session in the browser, so it cannot be part of the instant static shell.
export const instant = false;

// Same set-up as app/designer/idp/[idpID]/page.jsx.
export function generateStaticParams() {
  return [{ idpID: "1" }, { idpID: "2" }, { idpID: "3" }, { idpID: "4" }];
}

export default function Page({ params }) {
  return (
    <Suspense fallback={<p className="p-8">Loading...</p>}>
      <EditIDPRoute params={params} />
    </Suspense>
  );
}

async function EditIDPRoute({ params }) {
  const { idpID } = await params;
  return <EditIDPPg idpID={Number(idpID)} />;
}
