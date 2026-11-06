# CSIT314-SDM: IDP Platform

An online platform that connects renovation customers with interior designers. Designers show their past work as **IDPs** (interior design projects); customers browse designers, view and like IDPs, and get recommendations.

CSIT314 Software Development Methodologies group project, University of Wollongong.

## Run the app

The app is in the `csit314-sdm` folder. You need Node.js 20 or newer.

```
cd csit314-sdm
npm install
npm run dev
```

- `npm install` downloads the packages listed in `package.json` (first time only, or after they change).
- `npm run dev` starts the app at http://localhost:3000.

All data is kept in the browser (localStorage) and is generated automatically on the first visit: 100 designers, 990 IDPs, 100 customers, and about 4,700 views and 455 likes over the last 90 days.

## Run the tests

```
cd csit314-sdm
npm test
```

`npm test` runs every unit test once with Vitest.

## Features and pages

| Actor | Feature | URL |
|---|---|---|
| Customer | Browse Interior Designers | `/customer/designers` |
| Customer | View IDP | `/customer/idp/[idpID]` |
| Customer | Like IDP | Like button on `/customer/idp/[idpID]` |
| Customer | View Favourites List | `/customer/favourites` |
| Customer | Get Designer Recommendations | `/customer/recommendations` |
| Interior Designer | View IDP Details (My IDPs list) | `/designer/idp`, `/designer/idp/[idpID]` |
| Interior Designer | Create IDP | `/designer/idp/create` |
| Interior Designer | Update IDP | `/designer/idp/[idpID]/edit` |
| Interior Designer | IDP Performance Dashboard | `/designer/dashboard` |
| User Admin | Verify ID Accounts | `/user-admin/verify-accounts` |
| Platform Manager | Promote IDP | `/platform-manager/promote-idp/[idpID]` |
| Platform Manager | Generate Platform Report | `/platform-manager/report` |

`[idpID]` is the IDP number, e.g. `/customer/idp/7`.

**Demo logins:** there is no real login. Customer pages have a test "Log in" button in the nav bar (customer C1), and designer pages are always logged in as designer D1.

See [`csit314-sdm/README.md`](csit314-sdm/README.md) for how the code is organised.
