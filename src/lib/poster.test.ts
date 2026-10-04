import assert from "node:assert/strict";
import { describe, it } from "node:test";
import QRCode from "qrcode";
import { directionFromSearch } from "./shuttle/logic.ts";
import { POSTER_KINDS, isTemporaryHost, posterUrl, printedUrl, qrPath } from "./poster.ts";

describe("poster links", () => {
  it("opens each stop's column, and the plain board for the notice board", () => {
    assert.equal(posterUrl("https://bus.example.com", "to-hotel"), "https://bus.example.com/?dir=to");
    assert.equal(posterUrl("https://bus.example.com/", "from-hotel"), "https://bus.example.com/?dir=from");
    assert.equal(posterUrl("https://bus.example.com", "anywhere"), "https://bus.example.com/");
  });

  it("uses links the board reads as the right column", () => {
    for (const kind of POSTER_KINDS) {
      const { search } = new URL(posterUrl("https://bus.example.com", kind));
      assert.equal(directionFromSearch(search), kind === "anywhere" ? null : kind);
    }
  });

  it("prints a short address", () => {
    assert.equal(printedUrl("https://bus.example.com/?dir=to"), "bus.example.com/?dir=to");
    assert.equal(printedUrl("https://bus.example.com/"), "bus.example.com");
    assert.equal(printedUrl("http://127.0.0.1:4173/"), "127.0.0.1:4173");
  });
});

describe("temporary addresses", () => {
  it("flags free subdomains, previews and this computer", () => {
    for (const host of [
      "next-bus-up.someone.workers.dev",
      "abc123-next-bus-up.someone.workers.dev",
      "next-bus-up.pages.dev",
      "next-bus-up.vercel.app",
      "next-bus-up.netlify.app",
      "someone.github.io",
      "localhost",
      "127.0.0.1",
      "192.168.1.20",
      "[::1]",
    ]) {
      assert.equal(isTemporaryHost(host), true, host);
    }
  });

  it("trusts a real domain", () => {
    for (const host of ["bus.example.com", "nextbusup.org", "workers.dev.example.com", "BUS.EXAMPLE.COM."]) {
      assert.equal(isTemporaryHost(host), false, host);
    }
  });
});

describe("QR path", () => {
  it("draws runs of dark modules inside the quiet zone", () => {
    const grid = ["##.#", "....", "####", ".#.."];
    const path = qrPath(4, (row, col) => grid[row][col] === "#", 4);
    assert.equal(path, "M4 4h2v1h-2zM7 4h1v1h-1zM4 6h4v1h-4zM5 7h1v1h-1z");
  });

  it("covers exactly the dark modules of a real code", () => {
    const { modules } = QRCode.create("https://bus.example.com/?dir=from", { errorCorrectionLevel: "Q" });
    const dark = (row: number, col: number) => modules.get(row, col) === 1;
    const covered = new Set<string>();
    for (const [, x, y, w] of qrPath(modules.size, dark, 0).matchAll(/M(\d+) (\d+)h(\d+)v1h-\d+z/g)) {
      for (let i = 0; i < Number(w); i++) covered.add(`${y},${Number(x) + i}`);
    }
    let count = 0;
    for (let row = 0; row < modules.size; row++) {
      for (let col = 0; col < modules.size; col++) {
        assert.equal(covered.has(`${row},${col}`), dark(row, col), `module ${row},${col}`);
        if (dark(row, col)) count++;
      }
    }
    assert.equal(covered.size, count);
  });
});
