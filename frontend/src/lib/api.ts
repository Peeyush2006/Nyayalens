export const getApiBase = (): string => {
  if (process.env.NEXT_PUBLIC_API_URL) {
    const raw = process.env.NEXT_PUBLIC_API_URL.replace(/\/$/, "");
    return raw.endsWith("/api") ? raw : `${raw}/api`;
  }
  // In the browser, relative /api leverages Next.js proxy rewrites to prevent all CORS & CORP blocks
  if (typeof window !== "undefined") {
    return "/api";
  }
  return "http://127.0.0.1:8000/api";
};

export const API_BASE = getApiBase();

import {
  fallbackGetDocuments,
  fallbackGetDocumentDetail,
  fallbackUploadDocument,
  fallbackAskDocument,
  fallbackUpdateObligation,
  fallbackCompareDocuments,
  fallbackGetLawyerBrief,
  fallbackGetLegalConcepts,
  fallbackGetObservability
} from "./fallbackService";

export interface SourceReference {
  page: number;
  section?: string;
  snippet: string;
}

export interface Clause {
  id: string;
  clause_type: string;
  title: string;
  original_text: string;
  plain_english: string;
  hinglish?: string;
  why_it_matters: string;
  user_obligation?: string;
  counterparty_obligation?: string;
  potential_concern?: string;
  risk_level: "Critical" | "High Attention" | "Moderate" | "Informational";
  source: SourceReference;
  confidence: number;
}

export interface RiskFinding {
  id: string;
  title: string;
  severity: "Critical" | "High Attention" | "Moderate" | "Informational";
  detected_issue: string;
  why_it_matters: string;
  potential_user_impact: string;
  source_clause_id?: string;
  source_text: string;
  page_number: number;
  suggested_lawyer_question: string;
}

export interface ObligationItem {
  id: string;
  task: string;
  responsible_party: string;
  deadline: string;
  source_clause: string;
  page_number: number;
  consequence_of_breach?: string;
  status: "Pending" | "In Progress" | "Completed";
}

export interface TimelineEvent {
  id: string;
  date_text: string;
  normalized_date?: string;
  event_type: string;
  description: string;
  page_number: number;
  source_clause: string;
}

export interface DocumentPageContent {
  page_number: number;
  text: string;
  sections: string[];
}

export interface DocumentMetadata {
  id: string;
  filename: string;
  file_type: string;
  file_size: number;
  page_count: number;
  uploaded_at: string;
  doc_type: string;
  parties: string[];
  effective_date?: string;
  governing_law?: string;
  jurisdiction: string;
  dispute_mechanism?: string;
  executive_summary: string;
  plain_language_summary: string;
  hinglish_summary: string;
  risk_score: number;
  risk_breakdown: Record<string, number>;
}

export interface DocumentDetail extends DocumentMetadata {
  clauses: Clause[];
  risks: RiskFinding[];
  obligations: ObligationItem[];
  timeline: TimelineEvent[];
  pages_content: DocumentPageContent[];
}

export interface Citation {
  document_id: string;
  document_name: string;
  page: number;
  section?: string;
  snippet: string;
  relevance_score: number;
}

export interface GroundedAnswer {
  question: string;
  answer: string;
  citations: Citation[];
  confidence: number;
  is_grounded: boolean;
  uncertainty_note?: string;
  suggested_followups: string[];
}

export interface ClauseComparisonDiff {
  id: string;
  category: "All" | "Financial" | "Obligations" | "Termination" | "Liability" | "Privacy" | "Dispute Resolution" | "Other";
  diff_type: "Added" | "Removed" | "Modified" | "Unchanged";
  title: string;
  doc_a_clause?: string;
  doc_b_clause?: string;
  what_changed: string;
  who_is_affected: string;
  what_to_review: string;
  significance: string;
}

export interface ComparisonResult {
  id: string;
  doc_a_id: string;
  doc_a_name: string;
  doc_b_id: string;
  doc_b_name: string;
  summary_of_changes: string;
  total_changes: number;
  diffs: ClauseComparisonDiff[];
}

export interface LawyerConsultationBrief {
  document_id: string;
  document_name: string;
  document_type: string;
  generated_at: string;
  executive_summary: string;
  key_issues: string[];
  important_clauses: Array<{
    title: string;
    page: number;
    summary: string;
    risk: string;
    why_it_matters: string;
  }>;
  user_obligations: Array<{
    task: string;
    deadline: string;
    consequence: string;
    page: number;
  }>;
  questions_to_ask_lawyer: string[];
  missing_information: string[];
  ambiguous_provisions: string[];
  critical_deadlines: Array<{
    milestone: string;
    date_text: string;
    description: string;
    page: number;
  }>;
  recommended_documents_to_bring: string[];
  user_notes: string;
  disclaimer: string;
}

export interface LegalConcept {
  term: string;
  plain_meaning: string;
  why_it_matters: string;
  common_in: string[];
  statutory_framework: string;
  india_code_reference?: string;
  case_law_doctrine?: string;
  sample_clause: string;
}

async function apiFetch(endpoint: string, options?: RequestInit): Promise<Response> {
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  const url = endpoint.startsWith("http") ? endpoint : `${API_BASE}${cleanEndpoint}`;

  try {
    const res = await fetch(url, options);
    return res;
  } catch (err: any) {
    // If running in browser and relative /api failed (e.g. Next.js rewrite not active),
    // automatically attempt fallback to direct FastAPI backend http://127.0.0.1:8000/api
    if (API_BASE.startsWith("/") && typeof window !== "undefined") {
      try {
        const fallbackUrl = `http://127.0.0.1:8000/api${cleanEndpoint}`;
        const fallbackRes = await fetch(fallbackUrl, options);
        return fallbackRes;
      } catch {
        throw new Error(
          "Could not connect to NyayaLens API backend (Failed to fetch). Please verify the FastAPI backend is running: python -m uvicorn app.main:app --reload --port 8000"
        );
      }
    }
    throw new Error(
      `Could not connect to NyayaLens API at ${url} (Failed to fetch). Please ensure the backend server is running.`
    );
  }
}

async function handleApiResponse<T>(res: Response, defaultMessage: string): Promise<T> {
  if (!res.ok) {
    let errorMessage = defaultMessage;
    try {
      const err = await res.json();
      if (typeof err.detail === "string") {
        errorMessage = err.detail;
      } else if (Array.isArray(err.detail)) {
        errorMessage = err.detail.map((d: any) => d.msg || JSON.stringify(d)).join("; ");
      } else if (err.message) {
        errorMessage = err.message;
      }
    } catch {
      errorMessage = `${defaultMessage} (Status ${res.status}: ${res.statusText || "Server Error"})`;
    }
    throw new Error(errorMessage);
  }
  return res.json();
}

export async function fetchDocuments(): Promise<DocumentMetadata[]> {
  try {
    const res = await apiFetch("/documents");
    return await handleApiResponse<DocumentMetadata[]>(res, "Failed to fetch documents");
  } catch (e) {
    console.warn("Backend API unavailable, using embedded documents:", e);
    return fallbackGetDocuments();
  }
}

export async function fetchDocumentDetail(docId: string): Promise<DocumentDetail> {
  try {
    const res = await apiFetch(`/documents/${docId}`);
    return await handleApiResponse<DocumentDetail>(res, `Failed to fetch document ${docId}`);
  } catch (e) {
    console.warn("Backend API unavailable, using embedded document detail:", e);
    return fallbackGetDocumentDetail(docId);
  }
}

export async function uploadDocument(file: File): Promise<DocumentDetail> {
  try {
    const formData = new FormData();
    formData.append("file", file);
    const res = await apiFetch("/documents/upload", {
      method: "POST",
      body: formData,
    });
    return await handleApiResponse<DocumentDetail>(res, "Failed to upload document");
  } catch (e) {
    console.warn("Backend API unavailable, processing upload with embedded intelligence engine:", e);
    return await fallbackUploadDocument(file);
  }
}

export async function askDocument(docId: string, question: string, language: string = "english"): Promise<GroundedAnswer> {
  try {
    const res = await apiFetch(`/documents/${docId}/ask`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question, language, jurisdiction: "India" }),
    });
    return await handleApiResponse<GroundedAnswer>(res, "Failed to query document");
  } catch (e) {
    return fallbackAskDocument(docId, question, language);
  }
}

export async function updateObligationStatus(docId: string, obId: string, status: string): Promise<DocumentDetail> {
  try {
    const res = await apiFetch(`/documents/${docId}/obligations/${obId}?status=${status}`, {
      method: "PATCH",
    });
    return await handleApiResponse<DocumentDetail>(res, "Failed to update obligation status");
  } catch (e) {
    return fallbackUpdateObligation(docId, obId, status);
  }
}

export async function compareDocuments(docAId: string, docBId: string): Promise<ComparisonResult> {
  try {
    const res = await apiFetch(`/compare?doc_a_id=${docAId}&doc_b_id=${docBId}`, {
      method: "POST",
    });
    return await handleApiResponse<ComparisonResult>(res, "Failed to compare documents");
  } catch (e) {
    return fallbackCompareDocuments(docAId, docBId);
  }
}

export async function fetchLawyerBrief(docId: string, userNotes: string = ""): Promise<LawyerConsultationBrief> {
  try {
    const formData = new FormData();
    formData.append("user_notes", userNotes);
    const res = await apiFetch(`/documents/${docId}/lawyer-brief`, {
      method: "POST",
      body: formData,
    });
    return await handleApiResponse<LawyerConsultationBrief>(res, "Failed to generate lawyer consultation brief");
  } catch (e) {
    return fallbackGetLawyerBrief(docId, userNotes);
  }
}

export async function fetchLegalConcepts(query?: string, jurisdiction: string = "India"): Promise<LegalConcept[]> {
  try {
    const endpoint = query
      ? `/legal-info?q=${encodeURIComponent(query)}&jurisdiction=${jurisdiction}`
      : `/legal-info?jurisdiction=${jurisdiction}`;
    const res = await apiFetch(endpoint);
    return await handleApiResponse<LegalConcept[]>(res, "Failed to fetch legal knowledge concepts");
  } catch (e) {
    return fallbackGetLegalConcepts(query);
  }
}

export async function fetchObservability(): Promise<Record<string, any>> {
  try {
    const res = await apiFetch("/observability");
    return await handleApiResponse<Record<string, any>>(res, "Failed to fetch observability metrics");
  } catch (e) {
    return fallbackGetObservability();
  }
}
