import { fileURLToPath, URL } from "node:url";
import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

/**
 * Public address of the site, e.g. https://bus.example.com. Set it as a build
 * variable once the domain is chosen. Share cards need an absolute image URL;
 * without it they fall back to a relative one.
 */
const SITE_URL = (process.env.SITE_URL ?? "").trim().replace(/\/+$/, "");

/** Fills %SITE_URL% in index.html. */
function siteUrl(): Plugin {
  return {
    name: "nbu:site-url",
    transformIndexHtml: (html) => html.replaceAll("%SITE_URL%", SITE_URL),
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
