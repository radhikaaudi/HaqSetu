import { useState } from "react";
import { pick, UI } from "../i18n";
import { factLabel, formatBenefit } from "../format";
import { speak, stopSpeaking } from "../speech";
import type { ClaimDossier, DecodedDocument, Entitlement, FilledForm, Lang } from "../types";

interface Props {
  lang: Lang;
  speechLang: string;
  dossier: ClaimDossier;
  onReset: () => void;
}

const STATUS_META: Record<string, { className: string; emoji: string }> = {
  eligible: { className: "eligible", emoji: "✅" },
  likely: { className: "eligible", emoji: "✅" },
  missing_info: { className: "needs", emoji: "❓" },
  not_eligible: { className: "no", emoji: "—" }
};

const RISK_EMOJI = { info: "ℹ️", action: "📌", warning: "⚠️" } as const;

export function DossierScreen({ lang, speechLang, dossier, onReset }: Props) {
  const t = UI[lang];
  const [speakingKey, setSpeakingKey] = useState<string | null>(null);

  const readAloud = (key: string, text: string) => {
    if (speakingKey === key) {
      stopSpeaking();
      setSpeakingKey(null);
      return;
    }
    if (speak(text, speechLang)) setSpeakingKey(key);
  };

  const ReadButton = ({ id, text }: { id: string; text: string }) => (
    <button className="read-btn" onClick={() => readAloud(id, text)} aria-label={t.read_aloud}>
      {speakingKey === id ? "⏹ " + t.stop_reading : "🔊 " + t.read_aloud}
    </button>
  );

  return (
    <div className="dossier">
      <button className="back-button" onClick={onReset}>
        ← {t.start_over}
      </button>

      <p className="verifier-banner">🛡️ {t.verifier_note}</p>

      {dossier.decoded_documents.length > 0 && (
        <section className="dossier-section">
          <h2 className="section-title">📄 {t.sec_papers}</h2>
          {dossier.decoded_documents.map((doc) => (
            <DocumentCard key={doc.docId} doc={doc} lang={lang} onRead={readAloud} />
          ))}
        </section>
      )}

      <section className="dossier-section">
        <h2 className="section-title">💰 {t.sec_claims}</h2>
        {dossier.entitlements.filter((e) => e.status !== "not_eligible").length === 0 && (
          <p className="empty-note">{t.empty_claims}</p>
        )}
        {dossier.entitlements.map((entitlement) => (
          <EntitlementCard
            key={entitlement.scheme_id}
            entitlement={entitlement}
            lang={lang}
            ReadButton={ReadButton}
          />
        ))}
      </section>

      {dossier.filled_forms.length > 0 && (
        <section className="dossier-section">
          <h2 className="section-title">✅ {t.sec_paperwork}</h2>
          {dossier.filled_forms.map((form) => (
            <PaperworkCard key={form.scheme_id} form={form} dossier={dossier} lang={lang} />
          ))}
        </section>
      )}
    </div>
  );
}

function DocumentCard({ doc, lang, onRead }: { doc: DecodedDocument; lang: Lang; onRead: (key: string, text: string) => void }) {
  const t = UI[lang];
  const summary = pick(doc.summary, lang);
  const risk = pick(doc.risk_or_opportunity.text, lang);
  return (
    <article className="card doc-card">
      <div className="doc-type">{doc.doc_type}</div>
      <p className="doc-summary">{summary}</p>
      {doc.deadline && (
        <div className="deadline-badge">⏳ {t.deadline}: {doc.deadline}</div>
      )}
      <div className={"risk-chip " + doc.risk_or_opportunity.level}>
        {RISK_EMOJI[doc.risk_or_opportunity.level]} {risk}
      </div>
      <button className="read-btn" onClick={() => onRead(doc.docId, `${doc.doc_type}. ${summary}. ${risk}`)}>
        🔊 {t.read_aloud}
      </button>
    </article>
  );
}

function EntitlementCard({
  entitlement,
  lang,
  ReadButton
}: {
  entitlement: Entitlement;
  lang: Lang;
  ReadButton: (props: { id: string; text: string }) => JSX.Element;
}) {
  const t = UI[lang];
  const meta = STATUS_META[entitlement.status];
  const name = pick(entitlement.scheme_name, lang);
  const benefit = formatBenefit(entitlement.benefit, lang);
  const statusLabel =
    entitlement.status === "eligible" || entitlement.status === "likely"
      ? t.eligible
      : entitlement.status === "missing_info"
        ? t.needs_info
        : t.not_eligible;

  const whyLines = entitlement.matched_rules.map((rule) => pick(rule.explain, lang));
  const spoken = [name, benefit, statusLabel, ...whyLines].filter(Boolean).join(". ");

  return (
    <article className={"card entitlement-card " + meta.className}>
      <div className="entitlement-head">
        <h3>{name}</h3>
        {benefit && <span className="benefit-amount">{benefit}</span>}
      </div>

      <div className={"status-tag " + meta.className}>
        {meta.emoji} {statusLabel}
      </div>

      {entitlement.matched_rules.length > 0 && (
        <ul className="why-list">
          {entitlement.matched_rules.map((rule) => (
            <li key={rule.id}>
              <span className="why-check" aria-hidden>✓</span>
              <span>
                <strong>{t.why}</strong> {pick(rule.explain, lang)}
              </span>
            </li>
          ))}
        </ul>
      )}

      {entitlement.status === "missing_info" && entitlement.missing_facts?.length ? (
        <div className="needs-block">
          <div className="needs-title">{t.needs_info_hint}</div>
          <ul className="needs-list">
            {entitlement.missing_facts.map((fact) => (
              <li key={fact}>{factLabel(fact, lang)}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {entitlement.status !== "not_eligible" && <ReadButton id={entitlement.scheme_id} text={spoken} />}
    </article>
  );
}

function PaperworkCard({ form, dossier, lang }: { form: FilledForm; dossier: ClaimDossier; lang: Lang }) {
  const t = UI[lang];
  const scheme = dossier.entitlements.find((e) => e.scheme_id === form.scheme_id);
  const name = scheme ? pick(scheme.scheme_name, lang) : form.scheme_id;
  const requiredDocuments = form.required_documents ?? scheme?.required_documents ?? [];

  return (
    <article className="card paperwork-card">
      <h3>{name}</h3>

      <a className="btn-primary download-btn" href={form.pdf_url} target="_blank" rel="noreferrer" download>
        ⬇ {t.download_form}
      </a>

      {form.fields.length > 0 && (
        <div className="filled-fields">
          <div className="filled-title">{t.filled_from}</div>
          <ul>
            {form.fields.map((field) => (
              <li key={field.pdf_field}>
                <strong>{factLabel(field.from_fact, lang)}:</strong> {field.value}
              </li>
            ))}
          </ul>
        </div>
      )}

      {form.needs_info?.length ? (
        <div className="needs-block small">
          <div className="needs-title">{t.field_needs_info}</div>
          <ul className="needs-list">
            {form.needs_info.map((fact) => (
              <li key={fact}>{factLabel(fact, lang)}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {requiredDocuments.length > 0 && (
        <div className="checklist">
          <div className="checklist-title">📎 {t.bring_these}</div>
          <ul>
            {requiredDocuments.map((doc) => (
              <li key={doc.id}>
                <span className="checkbox" aria-hidden>☐</span> {pick(doc.name, lang)}
              </li>
            ))}
          </ul>
        </div>
      )}

      {form.submission && (
        <div className="submission">
          <div>
            <strong>📍 {t.where_submit}:</strong> {pick(form.submission.where, lang)}
          </div>
          <div>
            <strong>⏳ {t.deadline}:</strong> {form.submission.deadline ?? t.no_deadline}
          </div>
        </div>
      )}
    </article>
  );
}
