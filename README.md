# Next Bus Up

A live countdown for the employee shuttle between the off-site parking lot and the hotel employee
entrance on Dream Tree Blvd. It shows one column at a time, always in Orlando time, and keeps working
at the lot with no signal.

It's a static site: plain React, built with Vite, and hosted on Cloudflare. There is no server, no
database and no tracking. Location, when a rider turns it on, never leaves the phone.

## Run it

Needs Node 22.

```sh
npm install
npm run dev          # http://localhost:5173
npm test             # schedule and countdown logic
npm run typecheck
npm run lint
npm run build        # writes dist/
npm run preview      # serves dist/ at http://localhost:4173
npm run e2e          # browser smoke test against the build (after npm run build)
```

`npm run e2e` needs Chromium: run `npx playwright install chromium` once, or point `CHROMIUM_PATH`
at a Chromium you already have.

## Update the bus times

Everything lives in `src/lib/shuttle/schedule.ts`.

1. Replace the times in `TO_HOTEL` (bus leaves the parking lot) and `FROM_HOTEL` (bus leaves the
   employee entrance). Write them as on the sheet, e.g. `5:15AM 5:20AM`. A typo or a duplicate time
   makes `npm test` fail.
2. Set `SHEET_ISO` to the date on the new sheet. The board shows it as "Times published/updated as of
   4.28.26".
3. If the overnight break moves, change `GAP_START_MIN` / `GAP_END_MIN` in `src/lib/shuttle/logic.ts`.
4. Run `npm test`. The tests check details of the printed sheet, so update them along with it.

The dispatch number, the feedback forms, the stop locations and the ride time (`RIDE_MIN`) are in the
same file.

## QR codes and shortcuts

- `/?dir=to` opens the parking-lot column ("To hotel").
- `/?dir=from` opens the employee-entrance column ("From hotel").

The column applies to that visit only and never changes a rider's saved setting. Print the posters
once the domain is final, so they don't need reprinting.

## Deploy on Cloudflare

One-time setup in the Cloudflare dashboard:

1. **Workers & Pages → Create → Import a repository**, and pick this repository.
2. Name the Worker **`next-bus-up`**. It must match `name` in `wrangler.jsonc`.
3. Build command: `npm run build`. Deploy command: `npx wrangler deploy` (the default).
4. Production branch: `main`. Leave preview builds on, so every pull request gets its own link.
5. Add a build variable `SITE_URL` with the site's address, starting with the free one Cloudflare
   shows after the first deploy (`https://next-bus-up.<your-subdomain>.workers.dev`). Change it when
   you add your own domain. Link previews in group chats need it; without it the share image is
   left out.
6. To use your own domain: **Worker → Settings → Domains & Routes → Add → Custom domain**. The domain
   has to be on Cloudflare DNS.

After that, every push to `main` deploys. To deploy by hand: `npx wrangler login`, then
`SITE_URL=https://… npm run deploy`.

`public/_headers` sets the response headers: hashed files under `/assets/` are cached for a year, while
`sw.js` and the page always revalidate. It also sets a strict Content-Security-Policy and
`Referrer-Policy: no-referrer`. If you turn on a Cloudflare feature that injects scripts (Web
Analytics, Rocket Loader, email obfuscation), add its origin to the CSP first, or the browser will
block it.

## How offline works

`public/sw.js` saves the page, its scripts, its styles and its fonts on the first visit. After that:

- The page waits up to 2.5 s for the network, then uses the saved copy.
- Hashed `/assets/` files always come from the cache.
- A saved page is only replaced once everything it loads has been saved.
- Only the board itself is ever saved as the page.

Change `CACHE` in `sw.js` only when you change these rules.

## Retire bus.grok.me

Grok keeps serving its own copy, and phones that installed it keep an offline copy of the old board.
Once the Cloudflare address works, make one last edit in Grok so those riders move over:

> Replace the whole page with a short "Next Bus Up has moved" screen that links to NEW_ADDRESS and
> redirects there after 3 seconds. Replace `public/sw.js` with a service worker that, on activate,
> deletes every cache, unregisters itself and reloads open pages. Keep everything else as is.

Publish it and leave it up for a few weeks. Riders then delete the old home-screen icon and add the
new one; the board's "Add it to your phone" section already tells them how.

