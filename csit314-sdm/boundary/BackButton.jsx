// Boundary helper: BackButton
// "← Back" button that returns to the page the user came from. When there is no earlier page
// in this tab (e.g. the link was opened in a new tab), it goes to `fallbackHref` instead.
// Not shown on the login page or on each role's home page.
"use client";

import { useRouter } from "next/navigation";

export default function BackButton({ fallbackHref = "/", label = "Back", className = "mb-4" }) {
  const router = useRouter();

  const goBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) router.back();
    else router.push(fallbackHref);
  };

  return (
    <button
      type="button"
      onClick={goBack}
      className={`btn btn-sm ${className}`}
      aria-label={label === "Back" ? "Go back to the previous page" : label}
    >
      <span aria-hidden="true">←</span>
      {label}
    </button>
  );
}
