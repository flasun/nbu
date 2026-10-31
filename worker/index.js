// Next Bus Up: static assets + TOTALS-ONLY page-view counter (Workers Analytics Engine).
// Runs on "/" only (run_worker_first ["/"]); every other path stays on the static fast path with _headers.
// No visitor id of any kind. Adding one would need a code change and a fresh review.
export const COUNT_HOST = "nbu.racason.workers.dev";
const BOT_RE = /bot|crawl|spider|slurp|preview|headless|lighthouse|monitor|curl|wget|python|httpclient|facebookexternalhit/i;

// Same as public/_headers "/*" (live v7). _headers is NOT applied to Worker-returned responses
// (docs: workers/static-assets/headers), so re-apply here. A test keeps these in sync with _headers.
export const SECURITY_HEADERS = {
  "content-security-policy": "default-src 'self'; script-src 'self' https://static.cloudflareinsights.com; style-src 'self'; font-src 'self'; img-src 'self' data:; connect-src 'self' https://cloudflareinsights.com; manifest-src 'self'; worker-src 'self'; object-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'",
  "permissions-policy": "geolocation=(self), camera=(), microphone=(), payment=()",
  "referrer-policy": "no-referrer",
  "x-content-type-options": "nosniff",
  "x-frame-options": "DENY",
};

export function isPageView(request) {
  if (request.method !== "GET") return false;
  if (new URL(request.url).hostname !== COUNT_HOST) return false; // skip preview URLs
  const h = request.headers;
  if (h.get("sec-fetch-mode") !== "navigate") return false;
  if (h.get("sec-fetch-dest") && h.get("sec-fetch-dest") !== "document") return false;
  if ((h.get("sec-purpose") || h.get("purpose") || "").includes("prefetch")) return false;
  const ua = h.get("user-agent") || "";
  if (!ua || BOT_RE.test(ua)) return false;
  if (!h.get("accept-language")) return false; // bot signal
  return true;
}

// 200 must be text/html; 304 (browser/sw revalidation of "/") counts without a content-type check.
export function isCountableResponse(response) {
  if (response.status === 304) return true;
  return response.status === 200 && (response.headers.get("content-type") || "").startsWith("text/html");
}

export function record(request, env) {
  if (!env.PAGEVIEWS) return;
  env.PAGEVIEWS.writeDataPoint({ blobs: [request.cf?.country || ""], doubles: [1] });
}

export default {
  async fetch(request, env, ctx) {
    const assetRes = await env.ASSETS.fetch(request);
    const res = new Response(assetRes.body, assetRes);
    for (const [k, v] of Object.entries(SECURITY_HEADERS)) res.headers.set(k, v);
    try {
      if (isPageView(request) && isCountableResponse(res)) {
        ctx.waitUntil(
          Promise.resolve()
            .then(() => record(request, env))
            .catch(() => {}),
        );
      }
    } catch {
      // counting must never break the page
    }
    return res;
  },
};
