// Boundary: NavBar
// Shared nav bar with the "Favourites List" link (View Favourites List trigger).
// The log in / log out button is a TEST helper for the stub SessionController.
"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { SessionController } from "@/controller/SessionController";

export default function NavBar() {
  // null on the server / first render, then the real session state (localStorage is browser-only).
  const loggedIn = useSyncExternalStore(
    () => () => {},
    () => SessionController.getLoggedInCustomerID() !== null,
    () => null,
  );

  const toggleTestLogin = () => {
    if (loggedIn) SessionController.logout();
    else SessionController.loginAsDemoCustomer();
    window.location.reload();
  };

  return (
    <nav className="flex flex-wrap items-center gap-x-6 gap-y-2 border-b px-8 py-3 [&_a]:whitespace-nowrap">
      <Link href="/" className="font-semibold">IDP Platform</Link>
      <Link href="/customer/favourites">Favourites List</Link>
      <button
        type="button"
        onClick={toggleTestLogin}
        className="ml-auto rounded border px-3 py-1 text-sm"
      >
        {loggedIn === null ? "..." : loggedIn ? "Test: log out (C1)" : "Test: log in as C1"}
      </button>
    </nav>
  );
}
