import { useCallback, useState } from "react";
import { fetchDossier } from "./api";
import { LANGUAGES, UI } from "./i18n";
import { HomeScreen } from "./components/HomeScreen";
import { DossierScreen } from "./components/DossierScreen";
import { stopSpeaking } from "./speech";
import type { ClaimDossier, Lang } from "./types";

type Screen = "home" | "loading" | "dossier" | "error";

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

        {screen === "loading" && (
          <div className="status-panel" role="status" aria-live="polite">
            <div className="spinner" aria-hidden />
            <h2>{t.working}</h2>
            <p>{t.working_hint}</p>
          </div>
        )}

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
