import { Suspense } from "react";
import PromoteIDPPg from "@/boundary/PromoteIDPPg";

// Cache Components needs at least one known param for a dynamic route. Any other id still
// renders on demand. Reading params inside <Suspense> lets the page show instantly.
export function generateStaticParams() {
  return [{ idpID: "1" }];
}

export default function Page({ params }) {
  return (
    <Suspense fallback={<p className="p-8">Loading...</p>}>
      <PromoteIDPRoute params={params} />
    </Suspense>
  );
}

async function PromoteIDPRoute({ params }) {
  const { idpID } = await params;
  return <PromoteIDPPg params={{ idpID }} />;
}
