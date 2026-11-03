import { Suspense } from "react";
import IDUpdateIDPPg from "@/boundary/IDUpdateIDPPg";

// Same set-up as app/designer/idp/[idpID]/page.tsx.
export function generateStaticParams() {
  return [{ idpID: "1" }, { idpID: "2" }, { idpID: "3" }, { idpID: "4" }];
}

export default function Page({ params }: { params: Promise<{ idpID: string }> }) {
  return (
    <Suspense fallback={<p className="p-8">Loading...</p>}>
      <UpdateIDPRoute params={params} />
    </Suspense>
  );
}

async function UpdateIDPRoute({ params }: { params: Promise<{ idpID: string }> }) {
  const { idpID } = await params;
  return <IDUpdateIDPPg idpID={Number(idpID)} />;
}
