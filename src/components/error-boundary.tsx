import { Component, type ErrorInfo, type ReactNode } from "react";
import { HTML_LANG, MESSAGES } from "@/lib/i18n";
import { startLang } from "@/lib/prefs";

type State = { error: Error | null };


/** Shows what broke instead of a blank screen, with a way to try again. */
export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(error, info.componentStack);
    // The board may have crashed before setting the page language itself.
    document.documentElement.lang = HTML_LANG[startLang()];
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;
    const t = MESSAGES[startLang()].error;
    return (
      <main className="mx-auto flex min-h-dvh w-full max-w-xl flex-col justify-center gap-3 px-4">
        <h1 className="font-display text-3xl leading-none font-semibold tracking-wide text-ivory">
          {t.title}
        </h1>
        <p className="text-sm break-words text-mute">{error.message || t.unknown}</p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-2 inline-flex min-h-11 w-fit items-center rounded-full bg-signal px-4 text-sm font-semibold text-signal-ink focus-visible:ring-2 focus-visible:ring-signal focus-visible:ring-offset-2 focus-visible:ring-offset-ink focus-visible:outline-none"
        >
          {t.reload}
        </button>
      </main>
    );
  }
}
