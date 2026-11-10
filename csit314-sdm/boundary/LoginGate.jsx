"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { SessionController } from "@/controller/SessionController";
import { LoginController } from "@/controller/LoginController";
import { useSession } from "@/boundary/useSession";

export default function LoginGate({ children }) {
  const pathname = usePathname() ?? "/";
  const router = useRouter();
  const account = useSession();

  const required = SessionController.getRequiredProfile(pathname);
  const allowed = required === null || account?.profileID === required;

  useEffect(() => {
    if (account !== undefined && !allowed) router.replace(LoginController.getHomePage());
  }, [account, allowed, router]);

  if (required === null) return children;
  if (account === undefined || !allowed) {
    return <p className="p-8 text-zinc-500">Loading...</p>;
  }
  return children;
}
