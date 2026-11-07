// Boundary: LoginPg
// Feature: Log in (Customer and Interior Designer)
// User stories: C02 / ID02 As a customer / interior designer, I want to log in to my account.
//
// Route: /login   (app/login/page.jsx renders this)
//
// What goes here:
// - Email and password form. On success the user goes to their own home page
//   (customer: /, designer: /designer/idp).
// - Error message for missing fields, a wrong email or password, or a blocked account.
// - Someone who is already logged in is sent straight to their home page.
// - TEST helper: the demo accounts from entity/LocalStore.js, click one to fill the form.
//
// Methods:
// - submitLogin(email, password)
//     -> LoginController.login(email, password)
// - displayErrorMsg(message)
// - goToHomePage(homePage)
//
// Attributes: none
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LoginController } from "@/controller/LoginController";
import { useSession } from "@/boundary/useSession";

// TEST helper only: the demo logins seeded in entity/LocalStore.js (same password for all).
const DEMO_PASSWORD = "password123";
const DEMO_ACCOUNTS = [
  { role: "Customer", label: "C1", email: "customer1@example.com" },
  { role: "Customer", label: "C2", email: "customer2@example.com" },
  { role: "Customer", label: "C3", email: "customer3@example.com" },
  { role: "Interior designer", label: "D1 Nordic Nest Interiors", email: "hello@nordicnest.example.com" },
  { role: "Interior designer", label: "D2 Studio Linea", email: "studio@linea.example.com" },
  { role: "Interior designer", label: "D3 Habitat & Co", email: "team@habitatco.example.com" },
  { role: "User Admin", label: "A1", email: "admin@example.com" },
];

export default function LoginPg() {
  const router = useRouter();
  const account = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState(null);
  const [busy, setBusy] = useState(false);

  const displayErrorMsg = (message) => setErrorMsg(message);
  const goToHomePage = (homePage) => router.replace(homePage);

  // Already logged in: nothing to do here.
  useEffect(() => {
    if (account) router.replace(LoginController.getHomePage());
  }, [account, router]);

  const submitLogin = async (event) => {
    event.preventDefault();
    setBusy(true);
    const result = await LoginController.login(email, password);
    setBusy(false);
    if (result.status === "ok") goToHomePage(result.homePage);
    else displayErrorMsg(result.message);
  };

  const fillDemoAccount = (demoEmail) => {
    setEmail(demoEmail);
    setPassword(DEMO_PASSWORD);
    setErrorMsg(null);
  };

  return (
    <main className="mx-auto w-full max-w-md p-8">
      <h1 className="text-3xl font-semibold">Log in</h1>
      <p className="mt-2 text-zinc-500">For customers and interior designers.</p>

      <form onSubmit={submitLogin} className="mt-6 grid gap-4" noValidate>
        <label htmlFor="login-email" className="grid gap-1">
          <span className="text-sm font-medium">Email</span>
          <input
            id="login-email"
            type="email"
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded border px-3 py-2"
          />
        </label>
        <label htmlFor="login-password" className="grid gap-1">
          <span className="text-sm font-medium">Password</span>
          <input
            id="login-password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="rounded border px-3 py-2"
          />
        </label>
        {errorMsg && (
          <p role="alert" className="text-sm text-red-600">
            {errorMsg}
          </p>
        )}
        <button
          type="submit"
          disabled={busy}
          className="rounded bg-black px-4 py-2 text-white disabled:opacity-50"
        >
          {busy ? "Logging in..." : "Log in"}
        </button>
      </form>

      <section className="mt-10 rounded border p-4">
        <h2 className="font-medium">Test: demo accounts</h2>
        <p className="mt-1 text-sm text-zinc-500">
          Click one to fill in the form. Password for all: {DEMO_PASSWORD}
        </p>
        <ul className="mt-3 grid gap-2">
          {DEMO_ACCOUNTS.map((demo) => (
            <li key={demo.email}>
              <button
                type="button"
                onClick={() => fillDemoAccount(demo.email)}
                className="w-full rounded border px-3 py-2 text-left text-sm hover:border-zinc-400"
              >
                <span className="font-medium">{demo.role}</span> {demo.label}
                <span className="block text-zinc-500">{demo.email}</span>
              </button>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
