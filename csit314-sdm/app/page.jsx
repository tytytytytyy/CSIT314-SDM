import HomePg from "@/boundary/HomePg";

// Needs a logged-in user: LoginGate (app/layout.jsx) shows this page only after reading the
// session in the browser, so it cannot be part of the instant static shell.
export const instant = false;

export default function Home() {
  return <HomePg />;
}
