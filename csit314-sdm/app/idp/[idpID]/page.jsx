import IDPViewPg from "@/boundary/IDPViewPg";

// Cache Components needs at least one known param for a dynamic route. These are the seeded
// dummy IDPs; any other id still renders on demand (the IDP itself is read in the browser).
export function generateStaticParams() {
  return [{ idpID: "1" }, { idpID: "2" }, { idpID: "3" }, { idpID: "4" }];
}

export default async function Page({ params }) {
  const { idpID } = await params;
  return <IDPViewPg idpID={Number(idpID)} />;
}
