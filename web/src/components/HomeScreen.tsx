import { useCallback, useRef, useState } from "react";
import { EXAMPLE_TRANSCRIPT, UI } from "../i18n";
import { useSpeechRecognition } from "../speech";
import type { Lang } from "../types";

interface Props {
  lang: Lang;
  speechLang: string;
  onSubmit: (transcript: string, imageDataUrl: string | null) => void;
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Could not read the image."));
    reader.readAsDataURL(file);
  });
}

export function HomeScreen({ lang, speechLang, onSubmit }: Props) {
  const t = UI[lang];
  const [transcript, setTranscript] = useState("");
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { supported, listening, start, stop } = useSpeechRecognition(speechLang, setTranscript);

  const onPickImage = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) setImageDataUrl(await readFileAsDataUrl(file));
  }, []);

  const canSubmit = transcript.trim().length > 0 || imageDataUrl !== null;

  return (
    <div className="home">
      {/* Voice input — the primary, literacy-optional path */}
      <section className="card">
        <div className="card-head">
          <span className="card-icon" aria-hidden>🎤</span>
          <div>
            <h2>{t.speak_title}</h2>
            <p>{t.speak_hint}</p>
          </div>
        </div>

        <button
          className={"mic-button" + (listening ? " listening" : "")}
          onClick={listening ? stop : start}
          disabled={!supported}
          aria-pressed={listening}
        >
          <span className="mic-glyph" aria-hidden>🎤</span>
          <span>{listening ? t.listening : t.tap_to_speak}</span>
        </button>

        <label className="type-label">{t.type_instead}</label>
        <textarea
          className="transcript-input"
          value={transcript}
          onChange={(event) => setTranscript(event.target.value)}
          rows={3}
          placeholder={t.nothing_yet}
        />

        <button className="link-button" onClick={() => setTranscript(EXAMPLE_TRANSCRIPT[lang])}>
          ✨ {t.try_example}
        </button>
      </section>

      {/* Document photo — the reactive "decode my paper" path */}
      <section className="card">
        <div className="card-head">
          <span className="card-icon" aria-hidden>📷</span>
          <div>
            <h2>{t.upload_title}</h2>
            <p>{t.upload_hint}</p>
          </div>
        </div>

        {imageDataUrl ? (
          <div className="image-preview">
            <img src={imageDataUrl} alt="Uploaded document" />
            <div className="image-actions">
              <button className="btn-secondary" onClick={() => fileInputRef.current?.click()}>
                {t.change_photo}
              </button>
              <button className="btn-ghost" onClick={() => setImageDataUrl(null)}>
                {t.remove}
              </button>
            </div>
          </div>
        ) : (
          <button className="upload-button" onClick={() => fileInputRef.current?.click()}>
            <span className="upload-glyph" aria-hidden>📄</span>
            <span>{t.add_photo}</span>
          </button>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={onPickImage}
          hidden
        />
      </section>

      <button className="btn-primary cta" disabled={!canSubmit} onClick={() => onSubmit(transcript, imageDataUrl)}>
        {t.cta} →
      </button>
    </div>
  );
}
