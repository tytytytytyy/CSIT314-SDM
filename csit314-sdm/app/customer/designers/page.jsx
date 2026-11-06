import { Suspense } from "react";
import BrowseInteriorDesignersPg from "@/boundary/BrowseInteriorDesignersPg";

// Needs a logged-in user: LoginGate (app/layout.jsx) shows this page only after reading the
// session in the browser, so it cannot be part of the instant static shell.
export const instant = false;

// The page reads "?designer=" from the URL, which needs a <Suspense> boundary.
export default function Page() {
  return (
    <Suspense fallback={<p className="p-8">Loading...</p>}>
      <BrowseInteriorDesignersPg />
    </Suspense>
  );
}
