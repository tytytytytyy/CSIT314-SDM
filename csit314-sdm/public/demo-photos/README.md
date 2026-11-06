Real interior photos for the demo. Everything in this folder is served at `/demo-photos/<file>`
by Next.js automatically — nothing else needs to change once a file lands here with the right name.

The app already builds these exact paths (see `demoPhotoURL` in `entity/DummyData.js`); until a
file exists, the `<img>` falls back to a grey placeholder via `onError` (see `PHOTO_NOT_FOUND`).

Drop in files with these exact names (lowercase, hyphenated, ends in `.jpg`, each under ~300 KB —
see the team's photo download guide for where to source them and full naming rules):

Residential (`<style>-<room>.jpg`), styles x rooms:
- scandinavian, industrial, minimalist, modern-luxury, japandi, contemporary, tropical,
  mid-century-modern, peranakan
- living-room, kitchen, bedroom, bathroom, study

Commercial (`commercial-<room>-<1 or 2>.jpg`):
- office, meeting-room, reception, retail, cafe (two photos each)

55 files total.
