// Boundary: DesignerNavBar
// Nav bar for interior designer pages (/designer/...). NavBar shows this one instead of the
// customer bar. Shows the logged-in designer's company logo and name, and Log out.
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LoginController } from "@/controller/LoginController";
import { useSession } from "@/boundary/useSession";

export default function DesignerNavBar() {
  const router = useRouter();
  const pathname = usePathname();
  const account = useSession();
  const [company, setCompany] = useState(null);

  // Reload the company whenever a different designer logs in.
  useEffect(() => {
    if (!account) return;
    LoginController.getLoggedInDesignerCompany().then(setCompany);
  }, [account?.accountID]);

  const logout = () => {
    LoginController.logout();
    router.replace("/login");
  };

  return (
    <nav className="sticky top-0 z-20 flex flex-wrap items-center gap-x-2 gap-y-2 border-b bg-[var(--surface)]/90 px-8 py-3 backdrop-blur [&_a]:whitespace-nowrap">
      <Link href="/designer/idp" className="mr-4 font-semibold">
        IDP Platform{" "}
        <span className="font-normal text-zinc-500">for Designers</span>
      </Link>
      <Link
        href="/designer/idp"
        className="nav-link"
        aria-current={pathname?.startsWith("/designer/idp") ? "page" : undefined}
      >
        My Projects
      </Link>
      <Link
        href="/designer/dashboard"
        className="nav-link"
        aria-current={pathname === "/designer/dashboard" ? "page" : undefined}
      >
        Performance Dashboard
      </Link>
      {account && (
        <span className="ml-auto flex items-center gap-3 text-sm">
          {company ? (
            <span className="flex items-center gap-2 font-medium">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={company.logoURL} alt="" className="h-7 w-7 rounded object-cover" />
              {company.companyName}
            </span>
          ) : (
            <span className="text-zinc-500">Logged in as designer {account.accountID}</span>
          )}
          <button type="button" onClick={logout} className="btn btn-sm">
            Log out
          </button>
        </span>
      )}
    </nav>
  );
}
