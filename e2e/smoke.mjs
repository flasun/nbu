// Browser smoke test against the built site: `npm run build && npm run e2e`.
// Uses `vite preview`. Set CHROMIUM_PATH to use a Chromium that is already installed.
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { readFileSync } from "node:fs";
import { createServer } from "node:net";
import { after, before, test } from "node:test";
import jsQR from "jsqr";
import { chromium } from "playwright";
import { PNG } from "pngjs";

const MOBILE = { width: 390, height: 844 };

let BASE = "";
let server;
let browser;

/** A port nothing else is using, so the test never talks to some other server. */
function freePort() {
  return new Promise((resolve, reject) => {
    const probe = createServer();
    probe.once("error", reject);
    probe.listen(0, "127.0.0.1", () => {
      const { port } = probe.address();
      probe.close(() => resolve(port));
    });
  });
}

before(async () => {
  const script = /src="(\/assets\/index-[^"]+\.js)"/.exec(readFileSync("dist/index.html", "utf8"))?.[1];
  assert.ok(script, "dist/index.html has no app script: run npm run build first");
  const port = await freePort();
  BASE = `http://127.0.0.1:${port}/`;
  server = spawn(
    "npx",
    ["vite", "preview", "--port", String(port), "--strictPort", "--host", "127.0.0.1"],
    { stdio: "ignore" },
  );
  let exited = null;
  server.once("exit", (code) => (exited = code ?? "signal"));
  let html = "";
  for (let i = 0; i < 60 && exited === null; i++) {
    try {
      const res = await fetch(BASE);
      if (res.ok) {
        html = await res.text();
        break;
      }
    } catch {
      // not up yet
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  assert.equal(exited, null, `vite preview exited early (${exited})`);
  assert.ok(html.includes(script), "the preview isn't serving this checkout's dist/");
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

test("switches language, keeps the printed times, and remembers the choice", async () => {
  // 7:22 AM in Orlando.
  const { context, page, errors } = await open("?dir=to", { iso: "2026-10-03T11:22:00Z" });
  await page.getByTestId("lang-es").click();
  assert.equal(await page.evaluate(() => document.documentElement.lang), "es");
  assert.equal(await page.getByTestId("lang-es").getAttribute("aria-pressed"), "true");
  await assert.doesNotReject(page.getByText("7:30 AM", { exact: true }).first().waitFor());
  assert.notEqual(await page.getByTestId("direction-to").innerText(), "To hotel\nLeaves the lot");
  await page.reload({ waitUntil: "load" });
  await page.locator('[data-testid="clock"]').waitFor();
  assert.equal(await page.evaluate(() => document.documentElement.lang), "es");
  assert.deepEqual(errors, []);
  await context.close();
});

test("opens a shared ?lang= link in that language", async () => {
  const { context, page, errors } = await open("?lang=ht&dir=from", { iso: "2026-10-03T21:12:00Z" });
  assert.equal(await page.evaluate(() => document.documentElement.lang), "ht");
  assert.equal(await page.getByTestId("direction-from").getAttribute("aria-checked"), "true");
  assert.equal(new URL(page.url()).search, "", "?lang= and ?dir= are dropped from the address");
  assert.deepEqual(errors, []);
  await context.close();
});

/** The text a phone reads from the QR code in a screenshot, or null if it can't read one. */
function readQr(screenshot) {
  const { data, width, height } = PNG.sync.read(screenshot);
  const pixels = new Uint8ClampedArray(data.buffer, data.byteOffset, data.length);
  return jsQR(pixels, width, height)?.data ?? null;
}

function pdfPages(pdf) {
  return (pdf.toString("latin1").match(/\/Type\s*\/Page[^s]/g) ?? []).length;
}

async function openPosters(path = "poster", viewport = { width: 1280, height: 900 }) {
  const context = await browser.newContext({ viewport });
  await context.route(/^https?:\/\/(?!127\.0\.0\.1)/, (route) => route.abort());
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(String(error)));
  page.on("console", (message) => message.type() === "error" && errors.push(message.text()));
  await page.goto(BASE + path, { waitUntil: "load" });
  await page.getByTestId("qr").first().waitFor();
  await page.evaluate(() => document.fonts.ready);
  return { context, page, errors };
}

test("prints a poster for each stop, with a code that opens its column", async () => {
  const { context, page, errors } = await openPosters();
  const expected = {
    "to-hotel": `${BASE}?dir=to`,
    "from-hotel": `${BASE}?dir=from`,
    anywhere: BASE,
  };
  for (const [kind, url] of Object.entries(expected)) {
    const poster = page.getByTestId(`poster-${kind}`);
    assert.equal(readQr(await poster.getByTestId("qr").screenshot()), url, `${kind} code`);
    assert.equal(
      await poster.getByTestId("poster-url").innerText(),
      url.replace(/^https?:\/\//, "").replace(/\/$/, ""),
    );
  }
  // 127.0.0.1 is no address to print.
  await assert.doesNotReject(page.getByTestId("temporary").waitFor());

  // One poster per page on both paper sizes, with a big code and nothing cut off.
  for (const format of ["Letter", "A4"]) {
    assert.equal(pdfPages(await page.pdf({ format })), 3, `${format} pages`);
  }
  await page.emulateMedia({ media: "print" });
  const sheets = await page.locator(".poster-sheet").evaluateAll((nodes) =>
    nodes.map((sheet) => {
      const box = sheet.getBoundingClientRect();
      const mm = (px) => (px / 96) * 25.4;
      const spills = [...sheet.querySelectorAll("*")].filter((node) => {
        const r = node.getBoundingClientRect();
        return r.left < box.left - 0.5 || r.right > box.right + 0.5 || r.bottom > box.bottom + 0.5;
      });
      return {
        width: Math.round(mm(box.width)),
        height: Math.round(mm(box.height)),
        code: Math.round(mm(sheet.querySelector('[data-testid="qr"]').getBoundingClientRect().width)),
        spills: spills.length,
      };
    }),
  );
  for (const sheet of sheets) {
    assert.deepEqual({ ...sheet, code: sheet.code >= 85 }, { width: 190, height: 250, code: true, spills: 0 });
  }
  assert.equal(await page.locator("header").isVisible(), false, "the buttons don't print");
  assert.deepEqual(errors, []);
  await context.close();
});

test("prints only the posters that are ticked", async () => {
  const { context, page, errors } = await openPosters();
  await page.evaluate(() => {
    window.print = () => (window.printed = (window.printed ?? 0) + 1);
  });
  await page.getByTestId("pick-to-hotel").uncheck();
  await page.getByTestId("pick-anywhere").uncheck();
  await page.getByTestId("print").click();
  assert.equal(await page.evaluate(() => window.printed), 1);
  // The browser's own Print menu prints the same: the choice is on the page, not in print events.
  await page.evaluate(() => window.dispatchEvent(new Event("afterprint")));
  await page.emulateMedia({ media: "print" });
  const visible = await page.locator("figure").evaluateAll((nodes) =>
    nodes.filter((node) => node.offsetParent !== null).map((node) => node.dataset.testid),
  );
  assert.deepEqual(visible, ["poster-from-hotel"]);
  await page.emulateMedia({ media: null });
  assert.equal(pdfPages(await page.pdf({ format: "Letter" })), 1);

  await page.getByTestId("pick-anywhere").check();
  assert.equal(pdfPages(await page.pdf({ format: "A4" })), 2);
  await page.getByTestId("pick-from-hotel").uncheck();
  await page.getByTestId("pick-anywhere").uncheck();
  assert.equal(await page.getByTestId("print").isDisabled(), true, "nothing ticked, nothing to print");
  assert.deepEqual(errors, []);
  await context.close();
});

test("shows the poster page in the reader's language, without sideways scrolling", async () => {
  const { context, page, errors } = await openPosters("poster?lang=es", { width: 390, height: 844 });
  assert.equal(await page.evaluate(() => document.documentElement.lang), "es");
  assert.equal(await page.title(), "Carteles QR · Next Bus Up");
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  assert.equal(overflow, false);
  assert.deepEqual(errors, []);
  await context.close();
});
