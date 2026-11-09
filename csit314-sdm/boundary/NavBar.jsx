// Boundary: NavBar
// Shared nav bar with the "Browse Designers" link (Browse Interior Designers trigger), the
// "Recommended Designers" link (Get Designer Recommendations trigger) and the
// "Favourites List" link (View Favourites List trigger), plus who is logged in and Log out.
// Designer pages (/designer/...) show DesignerNavBar instead. The login page and anyone
// logged out only get the site name and a Log in link.
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LoginController } from "@/controller/LoginController";
import { useSession } from "@/boundary/useSession";
import DesignerNavBar from "@/boundary/DesignerNavBar";

export default function NavBar() {
  const pathname = usePathname();
  const router = useRouter();
  const account = useSession();

  // Every designer page lives under "/designer/".
  if (pathname?.startsWith("/designer/")) return <DesignerNavBar />;

  const logout = () => {
    LoginController.logout();
    router.replace("/login");
  };

  // Highlights the link for the page the user is on.
  const navLink = (href, label, matchPrefix = false) => {
    const active = matchPrefix ? pathname?.startsWith(href) : pathname === href;
    return (
      <Link href={href} className="nav-link" aria-current={active ? "page" : undefined}>
        {label}
      </Link>
    );
  };

  const isAdmin = account?.profileID === "admin";
  const isPlatformManager = account?.profileID === "platformManager";
  const isCustomer = account?.profileID === "customer";

  return (
    <nav className="sticky top-0 z-20 flex flex-wrap items-center gap-x-2 gap-y-2 border-b bg-[var(--surface)]/90 px-8 py-3 backdrop-blur [&_a]:whitespace-nowrap">
      <Link
        href={
          isCustomer
            ? "/"
            : isAdmin
              ? "/user-admin/verify-id-accounts"
              : isPlatformManager
                ? "/platform-manager/report"
                : "/login"
        }
        className="mr-4 font-semibold"
      >
        IDP Platform
      </Link>
      {isAdmin && navLink("/user-admin/verify-id-accounts", "Verify ID Accounts")}
      {isPlatformManager && (
        <>
          {navLink("/platform-manager/report", "Generate Report")}
          {navLink("/platform-manager/promote-idp", "Promote IDP", true)}
        </>
      )}
      {isCustomer && (
        <>
          {navLink("/", "Home")}
          {navLink("/customer/designers", "Browse Designers")}
          {navLink("/customer/recommendations", "Recommended Designers")}
          {navLink("/customer/favourites", "Favourites List")}
        </>
      )}
      {account === undefined ? null : account ? (
        <span className="ml-auto flex items-center gap-3 text-sm">
          <span className="text-zinc-500">
            Logged in as {account.profileID} {account.accountID}
          </span>
          <button type="button" onClick={logout} className="btn btn-sm">
            Log out
          </button>
        </span>
      ) : (
        pathname !== "/login" && (
          <Link href="/login" className="btn btn-sm btn-primary ml-auto">
            Log in
          </Link>
        )
      )}
    </nav>
  );
}
