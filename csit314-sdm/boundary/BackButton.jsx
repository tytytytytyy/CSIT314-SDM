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
