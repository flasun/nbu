import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ErrorBoundary } from "@/components/error-boundary";
import { QrPosters } from "@/components/qr-posters";
import { HTML_LANG, MESSAGES } from "@/lib/i18n";
import { startLang } from "@/lib/prefs";
import "./styles.css";
import "./poster.css";

const lang = startLang();
document.documentElement.lang = HTML_LANG[lang];
document.title = `${MESSAGES[lang].poster.title} · Next Bus Up`;

const root = document.getElementById("root");
if (!root) throw new Error("Missing #root");

createRoot(root).render(
  <StrictMode>
    <ErrorBoundary>
      <QrPosters lang={lang} />
    </ErrorBoundary>
  </StrictMode>,
);
