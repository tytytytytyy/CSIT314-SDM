# CSIT314-SDM
Design and develop an online platform to match renovation customers to interior designers

## Running the app

Run every command inside the `csit314-sdm` folder (the one with `package.json`).

```bash
npm install      # download libraries (first time, or after package.json changes)
npm run seed     # create data/app.db with 100+ test records
npm run dev      # start the app at http://localhost:3000
npm test         # run the unit tests
```

Features so far:
- Create IDP: http://localhost:3000/designer/idp/create

## Code structure (B-C-E)

- `boundary/`: UI pages (`XxxPg.tsx`). No business rules, no database.
- `controller/`: one controller per use case (`XxxController.ts`). All business rules.
- `entity/`: one class per database table. The only code that touches the database.
- `app/`: Next.js routes. Each `page.tsx` only shows its boundary page.
- `lib/db.ts`: the shared SQLite connection and table definitions.
- `tests/`: unit tests, written before the code (TDD).
- `scripts/seed.ts`: test data generator.
