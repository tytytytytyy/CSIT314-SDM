import PromoteIDPListPg from "@/boundary/PromoteIDPListPg";

// Platform manager pages are shown after LoginGate reads the browser session.
export const instant = false;

export default function Page() {
  return <PromoteIDPListPg />;
}
