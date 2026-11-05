// Boundary: NavBar
// Shared nav bar with the "Browse Designers" link (Browse Interior Designers trigger) and the
// "Favourites List" link (View Favourites List trigger).
// The log in / log out button is a TEST helper for the stub SessionController.
// Designer pages (/designer/...) show DesignerNavBar instead, since designers have no
// favourites list and are not the C1 customer.
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSyncExternalStore } from "react";
import { SessionController } from "@/controller/SessionController";
import DesignerNavBar from "@/boundary/DesignerNavBar";

export default function NavBar() {
  // null on the server / first render, then the real session state (localStorage is browser-only).
  const loggedIn = useSyncExternalStore(
    () => () => {},
    () => SessionController.getLoggedInCustomerID() !== null,
    () => null,
  );
  const pathname = usePathname();

  // "/designer" and "/designer/..." only, so the customer page "/designers" keeps this bar.
  const isDesignerPage = pathname === "/designer" || pathname?.startsWith("/designer/");
  if (isDesignerPage) return <DesignerNavBar />;

  const toggleTestLogin = () => {
    if (loggedIn) SessionController.logout();
    else SessionController.loginAsDemoCustomer();
    window.location.reload();
  };

  return (
    <nav className="flex flex-wrap items-center gap-x-6 gap-y-2 border-b px-8 py-3 [&_a]:whitespace-nowrap">
      <Link href="/" className="font-semibold">
        IDP Platform
      </Link>
      <Link href="/designers">Browse Designers</Link>
      <Link href="/customer/favourites">Favourites List</Link>
      <button
        type="button"
        onClick={toggleTestLogin}
        className="ml-auto rounded border px-3 py-1 text-sm"
      >
        {loggedIn === null
          ? "..."
          : loggedIn
            ? "Test: log out (C1)"
            : "Test: log in as C1"}
      </button>
    </nav>
  );
}
