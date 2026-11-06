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
| Customer, Interior Designer | Log in / Log out | `/login`, Log out button in the nav bar |
| Customer | Home: every IDP, more load as you scroll | `/` |
| Customer | Browse Interior Designers (search by name, description or ID such as `D1`) | `/customer/designers`, or `/customer/designers?designer=D1` for one designer |
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

**Demo logins:** customer and designer pages need you to log in first; opening any of them while logged out takes you to `/login`. The login page lists the demo accounts (click one to fill in the form):

| Account | Role | Email |
|---|---|---|
| C1, C2, C3 | Customer | `customer1@example.com`, `customer2@example.com`, `customer3@example.com` |
| D1 Nordic Nest Interiors | Interior designer | `hello@nordicnest.example.com` |
| D2 Studio Linea | Interior designer | `studio@linea.example.com` |
| D3 Habitat & Co | Interior designer | `team@habitatco.example.com` |

The password for all of them is on the login page and in `entity/LocalStore.js`. Designers D4 (waiting for verification) and D5 (suspended) are turned away. Customers and designers share the same data: an IDP that designer D1 creates or edits is what customers see at `/customer/idp/...`. To be logged in as a customer and a designer at the same time, use a second (private) browser window. The user admin and platform manager pages still use their own test log in buttons.

See [`csit314-sdm/README.md`](csit314-sdm/README.md) for how the code is organised.
