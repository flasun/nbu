import { fileURLToPath, URL } from "node:url";
import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

/**
 * Public address of the site, e.g. https://next-bus-up.example.workers.dev or your own
 * domain later. Share cards need absolute links, so tags that use it are left out
 * when it isn't set.
 */
const SITE_URL = (process.env.SITE_URL ?? "").trim().replace(/\/+$/, "");

/** Fills %SITE_URL% in index.html, or drops the tags that need it. */
function siteUrl(): Plugin {
  return {
    name: "nbu:site-url",
    transformIndexHtml: (html) =>
      SITE_URL
        ? html.replaceAll("%SITE_URL%", SITE_URL)
        : html.replace(/^\s*<meta[^>]*(?:%SITE_URL%|"og:image:)[^>]*>\n/gm, ""),
  };
}

/** Preloads the two fonts the first screen uses, so the countdown doesn't reflow. */
function preloadFonts(): Plugin {
  const wanted =
    /^assets\/(?:barlow-condensed-latin-600-normal|outfit-latin-wght-normal)-[\w-]+\.woff2$/;
  return {
    name: "nbu:preload-fonts",
    apply: "build",
    transformIndexHtml: {
      order: "post",
      handler: (_html, ctx) =>
        Object.keys(ctx.bundle ?? {})
          .filter((file) => wanted.test(file))
          .map((file) => ({
            tag: "link",
            attrs: {
              rel: "preload",
              href: `/${file}`,
              as: "font",
              type: "font/woff2",
              crossorigin: "",
            },
            injectTo: "head" as const,
          })),
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), siteUrl(), preloadFonts()],
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
});
