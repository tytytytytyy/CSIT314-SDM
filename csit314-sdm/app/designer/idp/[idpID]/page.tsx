import IDViewIDPDetailsPg from "@/boundary/IDViewIDPDetailsPg";

// Same set-up as the customer's app/idp/[idpID]/page.tsx: Cache Components needs at least one
// known param for a dynamic route. Any other id still renders on demand.
export function generateStaticParams() {
  return [{ idpID: "1" }, { idpID: "2" }, { idpID: "3" }, { idpID: "4" }];
}

export default async function Page({ params }: { params: Promise<{ idpID: string }> }) {
  const { idpID } = await params;
  return <IDViewIDPDetailsPg idpID={Number(idpID)} />;
}
