export const API_BASE = "http://127.0.0.1:8000/api";

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

export async function fetchDocuments(): Promise<DocumentMetadata[]> {
  const res = await fetch(`${API_BASE}/documents`);
  if (!res.ok) throw new Error("Failed to fetch documents");
  return res.json();
}

export async function fetchDocumentDetail(docId: string): Promise<DocumentDetail> {
  const res = await fetch(`${API_BASE}/documents/${docId}`);
  if (!res.ok) throw new Error(`Failed to fetch document ${docId}`);
  return res.json();
}

export async function uploadDocument(file: File): Promise<DocumentDetail> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch(`${API_BASE}/documents/upload`, {
    method: "POST",
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Failed to upload document");
  }
  return res.json();
}

export async function askDocument(docId: string, question: string, language: string = "english"): Promise<GroundedAnswer> {
  const res = await fetch(`${API_BASE}/documents/${docId}/ask`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question, language, jurisdiction: "India" }),
  });
  if (!res.ok) throw new Error("Failed to query document");
  return res.json();
}

export async function updateObligationStatus(docId: string, obId: string, status: string): Promise<DocumentDetail> {
  const res = await fetch(`${API_BASE}/documents/${docId}/obligations/${obId}?status=${status}`, {
    method: "PATCH",
  });
  if (!res.ok) throw new Error("Failed to update obligation status");
  return res.json();
}

export async function compareDocuments(docAId: string, docBId: string): Promise<ComparisonResult> {
  const res = await fetch(`${API_BASE}/compare?doc_a_id=${docAId}&doc_b_id=${docBId}`, {
    method: "POST",
  });
  if (!res.ok) throw new Error("Failed to compare documents");
  return res.json();
}

export async function fetchLawyerBrief(docId: string, userNotes: string = ""): Promise<LawyerConsultationBrief> {
  const formData = new FormData();
  formData.append("user_notes", userNotes);
  const res = await fetch(`${API_BASE}/documents/${docId}/lawyer-brief`, {
    method: "POST",
    body: formData,
  });
  if (!res.ok) throw new Error("Failed to generate lawyer consultation brief");
  return res.json();
}

export async function fetchLegalConcepts(query?: string, jurisdiction: string = "India"): Promise<LegalConcept[]> {
  const url = query
    ? `${API_BASE}/legal-info?q=${encodeURIComponent(query)}&jurisdiction=${jurisdiction}`
    : `${API_BASE}/legal-info?jurisdiction=${jurisdiction}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch legal knowledge concepts");
  return res.json();
}

export async function fetchObservability(): Promise<Record<string, any>> {
  const res = await fetch(`${API_BASE}/observability`);
  if (!res.ok) throw new Error("Failed to fetch observability metrics");
  return res.json();
}
