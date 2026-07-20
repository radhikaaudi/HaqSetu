import type { ClaimDossier, Lang } from "./types";

export interface DossierRequest {
  transcript?: string;
  language: Lang;
  document_image_base64?: string;
}

/** Calls the backend one-shot pipeline: intake -> decoder -> entitlement -> action -> verifier. */
export async function fetchDossier(request: DossierRequest): Promise<ClaimDossier> {
  const response = await fetch("/dossier", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request)
  });
  if (!response.ok) {
    const detail = await response.json().catch(() => ({}));
    throw new Error(detail.error || `Request failed (${response.status})`);
  }
  return response.json();
}
