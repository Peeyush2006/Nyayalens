from enum import Enum
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class RiskSeverity(str, Enum):
    CRITICAL = "Critical"
    HIGH_ATTENTION = "High Attention"
    MODERATE = "Moderate"
    INFORMATIONAL = "Informational"

class ObligationStatus(str, Enum):
    PENDING = "Pending"
    IN_PROGRESS = "In Progress"
    COMPLETED = "Completed"

class DiffType(str, Enum):
    ADDED = "Added"
    REMOVED = "Removed"
    MODIFIED = "Modified"
    UNCHANGED = "Unchanged"

class ComparisonCategory(str, Enum):
    ALL = "All"
    FINANCIAL = "Financial"
    OBLIGATIONS = "Obligations"
    TERMINATION = "Termination"
    LIABILITY = "Liability"
    PRIVACY = "Privacy"
    DISPUTE_RESOLUTION = "Dispute Resolution"
    OTHER = "Other"

class SourceReference(BaseModel):
    page: int
    section: Optional[str] = None
    snippet: str

class Clause(BaseModel):
    id: str
    clause_type: str
    title: str
    original_text: str
    plain_english: str
    hinglish: Optional[str] = ""
    why_it_matters: str
    user_obligation: Optional[str] = None
    counterparty_obligation: Optional[str] = None
    potential_concern: Optional[str] = None
    risk_level: RiskSeverity = RiskSeverity.INFORMATIONAL
    source: SourceReference
    confidence: float = 0.95

class RiskFinding(BaseModel):
    id: str
    title: str
    severity: RiskSeverity
    detected_issue: str
    why_it_matters: str
    potential_user_impact: str
    source_clause_id: Optional[str] = None
    source_text: str
    page_number: int
    suggested_lawyer_question: str

class ObligationItem(BaseModel):
    id: str
    task: str
    responsible_party: str
    deadline: Optional[str] = "Not specified"
    source_clause: str
    page_number: int
    consequence_of_breach: Optional[str] = None
    status: ObligationStatus = ObligationStatus.PENDING

class TimelineEvent(BaseModel):
    id: str
    date_text: str
    normalized_date: Optional[str] = None
    event_type: str
    description: str
    page_number: int
    source_clause: str

class DocumentPageContent(BaseModel):
    page_number: int
    text: str
    sections: List[str] = []

class DocumentMetadata(BaseModel):
    id: str
    filename: str
    file_type: str
    file_size: int
    page_count: int
    uploaded_at: str
    doc_type: str
    parties: List[str] = []
    effective_date: Optional[str] = None
    governing_law: Optional[str] = None
    jurisdiction: str = "India"
    dispute_mechanism: Optional[str] = None
    executive_summary: str
    plain_language_summary: str
    hinglish_summary: str
    risk_score: int = 0
    risk_breakdown: Dict[str, int] = {}

class DocumentDetail(DocumentMetadata):
    clauses: List[Clause] = []
    risks: List[RiskFinding] = []
    obligations: List[ObligationItem] = []
    timeline: List[TimelineEvent] = []
    pages_content: List[DocumentPageContent] = []

class ClauseComparisonDiff(BaseModel):
    id: str
    category: ComparisonCategory
    diff_type: DiffType
    title: str
    doc_a_clause: Optional[str] = None
    doc_b_clause: Optional[str] = None
    what_changed: str
    who_is_affected: str
    what_to_review: str
    significance: str

class ComparisonResult(BaseModel):
    id: str
    doc_a_id: str
    doc_a_name: str
    doc_b_id: str
    doc_b_name: str
    summary_of_changes: str
    total_changes: int
    diffs: List[ClauseComparisonDiff]

class AskRequest(BaseModel):
    question: str
    language: str = "english"  # english, hindi, hinglish
    jurisdiction: str = "India"

class Citation(BaseModel):
    document_id: str
    document_name: str
    page: int
    section: Optional[str] = None
    snippet: str
    relevance_score: float = 0.95

class GroundedAnswer(BaseModel):
    question: str
    answer: str
    citations: List[Citation] = []
    confidence: float = 0.95
    is_grounded: bool = True
    uncertainty_note: Optional[str] = None
    suggested_followups: List[str] = []

class LawyerConsultationBrief(BaseModel):
    document_id: str
    document_name: str
    document_type: str
    generated_at: str
    executive_summary: str
    key_issues: List[str] = []
    important_clauses: List[Dict[str, Any]] = []
    user_obligations: List[Dict[str, Any]] = []
    questions_to_ask_lawyer: List[str] = []
    missing_information: List[str] = []
    ambiguous_provisions: List[str] = []
    critical_deadlines: List[Dict[str, Any]] = []
    recommended_documents_to_bring: List[str] = []
    user_notes: str = ""
    disclaimer: str

class LegalConcept(BaseModel):
    term: str
    plain_meaning: str
    why_it_matters: str
    common_in: List[str]
    statutory_framework: str
    india_code_reference: Optional[str] = None
    case_law_doctrine: Optional[str] = None
    sample_clause: str
