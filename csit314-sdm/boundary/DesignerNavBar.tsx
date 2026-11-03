// Boundary: DesignerNavBar
// Nav bar for interior designer pages (/designer/...). NavBar shows this one instead of the
// customer bar. "Logged in as D1" is a TEST label for the stub SessionController.
"use client";

import Link from "next/link";
import { SessionController } from "@/controller/SessionController";

export default function DesignerNavBar() {
  return (
    <nav className="flex flex-wrap items-center gap-x-6 gap-y-2 border-b px-8 py-3 [&_a]:whitespace-nowrap">
      <Link href="/designer/idp" className="font-semibold">
        IDP Platform <span className="font-normal text-zinc-500">for Designers</span>
      </Link>
      <Link href="/designer/idp">My IDPs</Link>
      <span className="ml-auto rounded border px-3 py-1 text-sm text-zinc-600">
        Test: logged in as designer {SessionController.getLoggedInDesignerID()}
      </span>
    </nav>
  );
}
