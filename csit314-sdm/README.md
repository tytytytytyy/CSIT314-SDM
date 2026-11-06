# Code structure

The code follows the **B-C-E** (Boundary, Control, Entity) pattern. Each use case has one boundary page and one controller, named the same way, e.g. `CreateIDPPg` + `CreateIDPController`.

```
csit314-sdm/
├── app/            URLs only. Each page.jsx just shows a boundary page.
│   ├── page.jsx              /
│   ├── customer/             /customer/...
│   ├── designer/             /designer/...
│   ├── user-admin/           /user-admin/...
│   └── platform-manager/     /platform-manager/...
├── boundary/       B: what the user sees (pages and shared UI parts such as NavBar)
├── controller/     C: one controller per use case; business rules and checks
├── entity/         E: data classes, plus LocalStore (storage) and DummyData (test data generator)
├── lib/            small shared helpers (dates)
├── public/
│   └── demo-photos/  interior photos used by the generated IDPs
└── tests/          unit tests, same folders as the code
    ├── controller/
    └── entity/
```

## Rules

- **Boundary** only talks to its **controller**. It never reads storage directly.
- **Controller** only talks to **entities** (and `SessionController` for the logged-in user).
- **Entity** is the only layer that reads or writes storage, through `entity/LocalStore.js`.
- **Pages in `app/`** go in the folder of the actor who uses them. Folder names are lowercase with hyphens, no spaces.
- **Tests** are written before the code (TDD) and live in `tests/`, in the same folder as the class they test, named `<ClassName>.test.js`.

## Data

`entity/LocalStore.js` keeps one table per entity (`idp`, `idp_photo`, `idp_view`, `idp_like`, ...) in the browser's localStorage. On the first visit it fills them with the hand-made rows plus the rows from `entity/DummyData.js` (fixed seed, so everyone gets the same data). Changing `KEY_PREFIX` in `LocalStore.js` makes every browser reload fresh data.
