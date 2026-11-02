// Who is logged in?
//
// Login is not part of the features we are implementing, so for now this
// returns a fixed demo account. The seed script makes account 1 a verified
// (active) interior designer and account 2 a pending (unverified) one.
//
// To try the "not verified" error, start the app with:  DEMO_ACCOUNT_ID=2 npm run dev
// Replace this with real login later if the group adds it.

export function getLoggedInAccountID(): number {
  return Number(process.env.DEMO_ACCOUNT_ID ?? 1);
}
