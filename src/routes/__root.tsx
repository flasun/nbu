import { createRootRoute, HeadContent, Outlet, Scripts } from "@tanstack/react-router";
import { AuthProvider } from "@/lib/auth/provider";
import { PreviewHostBridge } from "@/components/preview-host-bridge";
import appCss from "../styles.css?url";
import displayFont from "@fontsource/barlow-condensed/files/barlow-condensed-latin-600-normal.woff2?url";
import bodyFont from "@fontsource-variable/outfit/files/outfit-latin-wght-normal.woff2?url";

const APP_NAME = "Next Bus Up";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: APP_NAME },
      {
        name: "description",
        content:
          "Next employee shuttle between the Dream Tree Blvd hotel and the parking lot, with a live countdown and a to-hotel / from-hotel switch.",
      },
      { name: "apple-mobile-web-app-title", content: "Next Bus Up" },
      { name: "theme-color", content: "#10140f" },
    ],
    links: [
      { rel: "icon", type: "image/png", sizes: "192x192", href: "/nbu-icon-192.png" },
      { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
      { rel: "stylesheet", href: appCss },
      { rel: "manifest", href: "/manifest.webmanifest" },
      { rel: "manifest", href: "/__grok/manifest.webmanifest" },
      { rel: "apple-touch-icon", sizes: "180x180", href: "/nbu-icon-180.png" },
      { rel: "preload", href: "/__grok/icon-180.png", as: "image" },
      { rel: "preload", href: displayFont, as: "font", type: "font/woff2", crossOrigin: "anonymous" },
      { rel: "preload", href: bodyFont, as: "font", type: "font/woff2", crossOrigin: "anonymous" },
    ],
  }),
  component: () => (
    <html lang="en" className="antialiased" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body>
        <PreviewHostBridge />
        <AuthProvider>
          <Outlet />
        </AuthProvider>
        <Scripts />
      </body>
    </html>
  ),
});
