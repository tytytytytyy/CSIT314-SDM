// Boundary helper: useSession
// React hook that gives a page the logged-in account and re-renders it when the user logs in
// or out. Returns undefined while the page is first drawn (the session lives in the browser),
// then { accountID, profileID } or null.
"use client";

import { useSyncExternalStore } from "react";
import { SessionController } from "@/controller/SessionController";

// useSyncExternalStore needs the same value back while nothing changed, so the account is
// compared as text.
const readSession = () => JSON.stringify(SessionController.getLoggedInAccount());

export function useSession() {
  const text = useSyncExternalStore(
    (onChange) => SessionController.onChange(onChange),
    readSession,
    () => undefined,
  );
  return text === undefined ? undefined : JSON.parse(text);
}
