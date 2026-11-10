import GeneratePlatformReportPg from "@/boundary/GeneratePlatformReportPg";

// Platform manager pages are shown after LoginGate reads the browser session.
export const instant = false;

export default function Page() {
  return <GeneratePlatformReportPg />;
}
