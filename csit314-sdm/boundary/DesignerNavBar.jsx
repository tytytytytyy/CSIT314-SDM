// Boundary: DesignerNavBar
// Nav bar for interior designer pages (/designer/...). NavBar shows this one instead of the
// customer bar. Shows which designer is logged in, and Log out.
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { LoginController } from "@/controller/LoginController";
import { useSession } from "@/boundary/useSession";

export default function DesignerNavBar() {
  const router = useRouter();
  const account = useSession();

  const logout = () => {
    LoginController.logout();
    router.replace("/login");
  };

  return (
    <nav className="flex flex-wrap items-center gap-x-6 gap-y-2 border-b px-8 py-3 [&_a]:whitespace-nowrap">
      <Link href="/designer/idp" className="font-semibold">
        IDP Platform{" "}
        <span className="font-normal text-zinc-500">for Designers</span>
      </Link>
      <Link href="/designer/idp">My IDPs</Link>
      <Link href="/designer/dashboard">Performance Dashboard</Link>
      {account && (
        <span className="ml-auto flex items-center gap-3 text-sm">
          <span className="text-zinc-500">Logged in as designer {account.accountID}</span>
          <button type="button" onClick={logout} className="rounded border px-3 py-1">
            Log out
          </button>
        </span>
      )}
    </nav>
  );
}
