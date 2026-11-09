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

  const isAdmin = account?.profileID === "admin";
  const isPlatformManager = account?.profileID === "platformManager";
  const isCustomer = account?.profileID === "customer";

  return (
    <nav className="flex flex-wrap items-center gap-x-6 gap-y-2 border-b px-8 py-3 [&_a]:whitespace-nowrap">
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
        className="font-semibold"
      >
        IDP Platform
      </Link>
      {isAdmin && (
        <Link href="/user-admin/verify-id-accounts">Verify ID Accounts</Link>
      )}
      {isPlatformManager && (
        <>
          <Link
            href="/platform-manager/report"
            aria-current={pathname === "/platform-manager/report" ? "page" : undefined}
            className={pathname === "/platform-manager/report" ? "font-semibold underline underline-offset-4" : ""}
          >
            Generate Report
          </Link>
          <Link
            href="/platform-manager/promote-idp"
            aria-current={pathname?.startsWith("/platform-manager/promote-idp") ? "page" : undefined}
            className={pathname?.startsWith("/platform-manager/promote-idp") ? "font-semibold underline underline-offset-4" : ""}
          >
            Promote IDP
          </Link>
        </>
      )}
      {isCustomer && (
        <>
          <Link href="/customer/designers">Browse Designers</Link>
          <Link href="/customer/recommendations">Recommended Designers</Link>
          <Link href="/customer/favourites">Favourites List</Link>
        </>
      )}
      {account === undefined ? null : account ? (
        <span className="ml-auto flex items-center gap-3 text-sm">
          <span className="text-zinc-500">
            Logged in as {account.profileID} {account.accountID}
          </span>
          <button type="button" onClick={logout} className="rounded border px-3 py-1">
            Log out
          </button>
        </span>
      ) : (
        pathname !== "/login" && (
          <Link href="/login" className="ml-auto rounded border px-3 py-1 text-sm">
            Log in
          </Link>
        )
      )}
    </nav>
  );
}
