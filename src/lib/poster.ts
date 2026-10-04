import type { Direction } from "./shuttle/schedule.ts";

/** One poster per stop, plus one for a notice board that lets the board pick the column. */
export type PosterKind = Direction | "anywhere";

export const POSTER_KINDS: readonly PosterKind[] = ["to-hotel", "from-hotel", "anywhere"];

/** Blank modules around the code. Scanners need at least 4. */
export const QUIET_ZONE = 4;

/**
 * Origin the codes point at. A page opened over plain http on a real domain still gets https
 * codes: without it, riders would get no offline copy and no location for as long as the poster
 * hangs. Local addresses keep their scheme (they get the temporary warning anyway).
 */
export function posterOrigin(protocol: string, host: string, hostname: string): string {
  const scheme = protocol === "http:" && !isLocalHost(hostname) ? "https:" : protocol;
  return `${scheme}//${host}`;
}

/** Address a poster's code opens: the same links as the README (`/?dir=to`, `/?dir=from`). */
export function posterUrl(origin: string, kind: PosterKind): string {
  const base = origin.replace(/\/+$/, "");
  if (kind === "to-hotel") return `${base}/?dir=to`;
  if (kind === "from-hotel") return `${base}/?dir=from`;
  return `${base}/`;
}

/** The address as printed under the code, short enough to type: no "https://", no lone "/". */
export function printedUrl(url: string): string {
  return url.replace(/^https?:\/\//, "").replace(/\/$/, "");
}

/** Names that only work on this computer or this network. */
const LOCAL_SUFFIXES = [".localhost", ".local", ".lan", ".home", ".internal", ".home.arpa"];

/** Free subdomains, preview links and tunnels. */
const TEMPORARY_SUFFIXES = [
  ".workers.dev",
  ".pages.dev",
  ".trycloudflare.com",
  ".vercel.app",
  ".netlify.app",
  ".github.io",
  ".ngrok.io",
  ".ngrok.app",
  ".ngrok-free.app",
  ".ngrok-free.dev",
  ".loca.lt",
];

function normalHost(hostname: string): string {
  return hostname.toLowerCase().replace(/\.$/, "");
}

/** This computer or the local network: IP addresses, single-label names, .local and friends. */
export function isLocalHost(hostname: string): boolean {
  const host = normalHost(hostname);
  if (!host.includes(".") || host.startsWith("[") || /^\d{1,3}(?:\.\d{1,3}){3}$/.test(host)) return true;
  return LOCAL_SUFFIXES.some((suffix) => host.endsWith(suffix));
}

/**
 * Addresses that are likely to change before the site settles: free subdomains, preview links,
 * tunnels, this computer and local network addresses. A printed code keeps pointing at them for years.
 */
export function isTemporaryHost(hostname: string): boolean {
  const host = normalHost(hostname);
  return isLocalHost(host) || TEMPORARY_SUFFIXES.some((suffix) => host.endsWith(suffix));
}

/**
 * SVG path for a QR code: one rectangle per run of dark modules in a row, offset by the quiet
 * zone, in a viewBox of `size + 2 * margin` units.
 */
export function qrPath(size: number, dark: (row: number, col: number) => boolean, margin = QUIET_ZONE): string {
  const parts: string[] = [];
  for (let row = 0; row < size; row++) {
    let col = 0;
    while (col < size) {
      if (!dark(row, col)) {
        col++;
        continue;
      }
      const start = col;
      while (col < size && dark(row, col)) col++;
      parts.push(`M${start + margin} ${row + margin}h${col - start}v1h-${col - start}z`);
    }
  }
  return parts.join("");
}
