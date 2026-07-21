import { useCallback, useEffect, useState } from "react";
import { fetchDossier } from "./api";
import { LANGUAGES, UI } from "./i18n";
import { HomeScreen } from "./components/HomeScreen";
import { DossierScreen } from "./components/DossierScreen";
import { stopSpeaking } from "./speech";
import type { ClaimDossier, Lang } from "./types";

type Screen = "home" | "loading" | "dossier" | "error";

const LOADING_STAGES = ["stage_understand", "stage_match", "stage_fill", "stage_verify"] as const;

/** Makes the pipeline's real stages visible while the one-shot request runs, instead of a dead spinner. */
function LoadingStages({ lang }: { lang: Lang }) {
  const t = UI[lang];
  const [active, setActive] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setActive((i) => Math.min(i + 1, LOADING_STAGES.length - 1)), 1500);
    return () => clearInterval(id);
  }, []);
  return (
    <div className="status-panel" role="status" aria-live="polite">
      <div className="spinner" aria-hidden />
      <h2>{t.working}</h2>
      <ul className="stage-list">
        {LOADING_STAGES.map((key, i) => (
          <li key={key} className={i < active ? "done" : i === active ? "active" : "pending"}>
            <span className="stage-dot" aria-hidden>{i < active ? "✓" : i === active ? "●" : "○"}</span>
            {t[key]}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function App() {
  const [lang, setLang] = useState<Lang>("hi");
  const [screen, setScreen] = useState<Screen>("home");
  const [dossier, setDossier] = useState<ClaimDossier | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  const t = UI[lang];
  const speechLang = LANGUAGES.find((l) => l.code === lang)?.speech ?? "hi-IN";

  const submit = useCallback(
    async (transcript: string, imageDataUrl: string | null) => {
      stopSpeaking();
      setScreen("loading");
      try {
        const result = await fetchDossier({
          language: lang,
          transcript: transcript.trim() || undefined,
          document_image_base64: imageDataUrl ?? undefined
        });
        setDossier(result);
        setScreen("dossier");
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : "Unknown error");
        setScreen("error");
      }
    },
    [lang]
  );

  const reset = useCallback(() => {
    stopSpeaking();
    setDossier(null);
    setScreen("home");
  }, []);

  return (
    <div className="app">
      <header className="app-header">
        <button className="brand" onClick={reset} aria-label="HaqSetu home">
          <span className="brand-mark" aria-hidden>हक़</span>
          <span className="brand-text">
            <strong>HaqSetu</strong>
            <small>{t.tagline}</small>
          </span>
        </button>
        <div className="lang-switch" role="group" aria-label="Language">
          {LANGUAGES.map((l) => (
            <button
              key={l.code}
              className={"lang-pill" + (l.code === lang ? " active" : "")}
              onClick={() => setLang(l.code)}
              aria-pressed={l.code === lang}
            >
              {l.label}
            </button>
          ))}
        </div>
      </header>

      <main className="app-main">
        {screen === "home" && <HomeScreen lang={lang} speechLang={speechLang} onSubmit={submit} />}

        {screen === "loading" && <LoadingStages lang={lang} />}

        {screen === "dossier" && dossier && (
          <DossierScreen lang={lang} speechLang={speechLang} dossier={dossier} onReset={reset} />
        )}

        {screen === "error" && (
          <div className="status-panel error" role="alert">
            <div className="status-emoji" aria-hidden>⚠️</div>
            <h2>{t.error_title}</h2>
            <p className="error-detail">{errorMessage}</p>
            <button className="btn-primary" onClick={reset}>
              {t.try_again}
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
