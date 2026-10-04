import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ShuttleBoard } from "@/components/shuttle-board";
import { ErrorBoundary } from "@/components/error-boundary";
import { HTML_LANG } from "@/lib/i18n";
import { startLang } from "@/lib/prefs";
import "./styles.css";

// Right language for screen readers from the first paint, before the board's effects run.
document.documentElement.lang = HTML_LANG[startLang()];

const root = document.getElementById("root");
if (!root) throw new Error("Missing #root");

createRoot(root).render(
  <StrictMode>
    <ErrorBoundary>
      <ShuttleBoard />
    </ErrorBoundary>
  </StrictMode>,
);
