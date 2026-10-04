# Next Bus Up: notes for coding agents

A static React + Vite site (no server, no database), deployed to Cloudflare Workers static assets.
`README.md` covers commands, updating the bus times, QR links and deploys.

## Before you push

Run `npm run typecheck`, `npm run lint`, `npm test` and `npm run build`. Run `npm run e2e` when you
touch the page, `public/sw.js`, `index.html` or `vite.config.ts`. CI runs all of them.

## Rules that matter for riders

- **Orlando time, always.** Use the helpers in `src/lib/shuttle/logic.ts` (`readOrlando`,
  `zonedWallToUtc`). Never use the phone's local time zone. Daylight-saving nights are tested.
- **One column at a time.** Never show the lot and entrance times side by side. Hiding the other
  column is deliberate: riders misread the two-column printed sheet.
- **Location stays on the phone.** Don't send it anywhere, store it, or add analytics. The CSP in
  `public/_headers` (`connect-src 'self'`) backs this up.
- **Offline first.** In `public/sw.js`, never answer a script or font request with HTML, only save the
  board itself as the offline page, and keep the network timeout short. Riders open this at the lot
  with one bar of signal.
- **Plain, short copy.** Spanish, Haitian Creole and Portuguese translations are planned, so write
  whole phrases, not sentences glued together from pieces.
- No accounts, database, trackers or third-party scripts without asking the owner first.
