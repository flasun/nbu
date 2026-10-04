// Browser smoke test against the built site: `npm run build && npm run e2e`.
// Uses `vite preview`. Set CHROMIUM_PATH to use a Chromium that is already installed.
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { after, before, test } from "node:test";
import { chromium } from "playwright";

const PORT = 4173;
const BASE = `http://127.0.0.1:${PORT}/`;
const MOBILE = { width: 390, height: 844 };

let server;
let browser;

before(async () => {
  server = spawn(
    "npx",
    ["vite", "preview", "--port", String(PORT), "--strictPort", "--host", "127.0.0.1"],
    {
      stdio: "ignore",
    },
  );
  for (let i = 0; i < 60; i++) {
    try {
      if ((await fetch(BASE)).ok) break;
    } catch {
      // not up yet
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  browser = await chromium.launch(
    process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {},
  );
});

after(async () => {
  await browser?.close();
  server?.kill();
});

/** Open the board at a fixed instant, with the phone set to another time zone on purpose. */
async function open(path, { iso, viewport = MOBILE } = {}) {
  const context = await browser.newContext({ viewport, timezoneId: "America/Los_Angeles" });
  await context.route(/^https?:\/\/(?!127\.0\.0\.1)/, (route) => route.abort());
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(String(error)));
  page.on("console", (message) => message.type() === "error" && errors.push(message.text()));
  if (iso) await page.clock.install({ time: new Date(iso) });
  await page.goto(BASE + path, { waitUntil: "load" });
  await page.locator('[data-testid="clock"]').waitFor();
  if (iso) await page.clock.runFor(1500);
  return { context, page, errors };
}

test("shows the next lot bus in Orlando time, from a QR link", async () => {
  // 7:22 AM in Orlando (EDT).
  const { context, page, errors } = await open("?dir=to", { iso: "2026-10-03T11:22:00Z" });
  assert.equal(await page.getByTestId("direction-to").getAttribute("aria-checked"), "true");
  assert.equal(new URL(page.url()).search, "", "the ?dir= link is dropped from the address");
  await assert.doesNotReject(page.getByText("7:30 AM", { exact: true }).first().waitFor());
  assert.match(await page.getByTestId("countdown").innerText(), /^0[78]:\d\d$/);
  assert.match(await page.getByTestId("arrival").innerText(), /Gets to the hotel around 7:37 AM/);
  assert.equal(
    await page.getByTestId("sheet-date").innerText(),
    "Times published/updated as of 4.28.26",
  );
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth,
  );
  assert.equal(overflow, false, "no sideways scrolling on a phone");
  assert.deepEqual(errors, []);
  await context.close();
});

test("says nothing runs in the overnight gap", async () => {
  // 2:00 AM in Orlando.
  const { context, page, errors } = await open("?dir=from", { iso: "2026-10-04T06:00:00Z" });
  await assert.doesNotReject(page.getByText("No bus", { exact: true }).waitFor());
  await assert.doesNotReject(page.getByText("Nothing is scheduled until 3:15 AM.").waitFor());
  assert.deepEqual(errors, []);
  await context.close();
});

test("opens the full list on a desktop", async () => {
  const { context, page, errors } = await open("?dir=to", {
    viewport: { width: 1280, height: 800 },
  });
  assert.equal(
    await page
      .locator("details")
      .first()
      .evaluate((node) => node.open),
    true,
  );
  assert.deepEqual(errors, []);
  await context.close();
});

test("opens offline after a single visit", async () => {
  const { context, page, errors } = await open("");
  await page.waitForFunction(() => navigator.serviceWorker?.controller != null, null, {
    timeout: 15000,
  });
  await page.waitForTimeout(1000);
  await context.setOffline(true);
  await page.reload({ waitUntil: "load" });
  await page.locator('[data-testid="clock"]').waitFor();
  assert.equal(await page.locator("h1").innerText(), "Next Bus Up");
  assert.equal(
    await page
      .locator('[data-testid="clock"]')
      .innerText()
      .then((t) => t.includes("–")),
    false,
  );
  assert.deepEqual(
    errors.filter((e) => !e.includes("ERR_INTERNET_DISCONNECTED")),
    [],
  );
  await context.close();
});
