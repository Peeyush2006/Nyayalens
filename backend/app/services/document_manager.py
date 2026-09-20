import uuid
import datetime
from pathlib import Path
from typing import Dict, List, Optional, Tuple
from app.core.config import settings
from app.models.schemas import (
    DocumentDetail, DocumentMetadata, DocumentPageContent,
    ComparisonResult, GroundedAnswer, LawyerConsultationBrief,
    ObligationStatus
)
from app.services.document_parser import DocumentParser
from app.services.clause_intelligence import ClauseIntelligenceService
from app.services.risk_radar import RiskRadarService
from app.services.obligation_tracker import ObligationTrackerService
from app.services.timeline_service import TimelineService
from app.services.rag_engine import RAGEngine
from app.services.comparison_engine import ContractComparisonEngine
from app.services.lawyer_brief import LawyerBriefService
from app.sample_data.sample_contracts import SAMPLE_CONTRACTS

class DocumentManager:
    def __init__(self):
        self.documents: Dict[str, DocumentDetail] = {}
        self._initialize_sample_contracts()

    def _initialize_sample_contracts(self):
        """Pre-populate the 4 realistic demo contracts on system boot."""
        for sample in SAMPLE_CONTRACTS:
            doc_id = sample["id"]
            if doc_id in self.documents:
                continue
            
            raw_text = sample["content"]
            # Split into realistic structured pages
            sections = raw_text.split("SECTION ")
            if len(sections) < 2:
                sections = raw_text.split("CLAUSE ")
            if len(sections) < 2:
                sections = raw_text.split("\n\n\n")

            pages_content = []
            cur_text = ""
            cur_page = 1
            for sec in sections:
                sec_clean = ("SECTION " + sec if not sec.startswith("TECHFLOW") and not sec.startswith("RESIDENTIAL") and not sec.startswith("MUTUAL") and not sec.startswith("ENTERPRISE") else sec).strip()
                if len(cur_text) + len(sec_clean) > 800 and cur_text:
                    pages_content.append(DocumentPageContent(
                        page_number=cur_page,
                        text=cur_text.strip(),
                        sections=DocumentParser._detect_sections(cur_text)
                    ))
                    cur_page += 1
                    cur_text = sec_clean + "\n\n"
                else:
                    cur_text += sec_clean + "\n\n"

            if cur_text.strip():
                pages_content.append(DocumentPageContent(
                    page_number=cur_page,
                    text=cur_text.strip(),
                    sections=DocumentParser._detect_sections(cur_text)
                ))

            # Run clause extraction
            clauses = ClauseIntelligenceService.extract_clauses(pages_content)
            
            # Run risk analysis
            risks, risk_score, breakdown = RiskRadarService.analyze_risks(clauses)
            
            # Run obligation extraction
            obligations = ObligationTrackerService.extract_obligations(clauses)
            
            # Run timeline generation
            timeline = TimelineService.extract_timeline(clauses, raw_text)

            # Generate summaries
            exec_summary, plain_summary, hinglish_summary = self._generate_summaries(sample["doc_type"], sample["parties"], clauses, risk_score)

            doc_detail = DocumentDetail(
                id=doc_id,
                filename=sample["filename"],
                file_type="pdf",
                file_size=len(raw_text.encode("utf-8")),
                page_count=len(pages_content),
                uploaded_at=datetime.datetime.now().strftime("%Y-%m-%d %H:%M"),
                doc_type=sample["doc_type"],
                parties=sample["parties"],
                effective_date=sample.get("effective_date"),
                governing_law=sample.get("governing_law"),
                jurisdiction=sample["jurisdiction"],
                dispute_mechanism="Arbitration / Designated Courts",
                executive_summary=exec_summary,
                plain_language_summary=plain_summary,
                hinglish_summary=hinglish_summary,
                risk_score=risk_score,
                risk_breakdown=breakdown,
                clauses=clauses,
                risks=risks,
                obligations=obligations,
                timeline=timeline,
                pages_content=pages_content
            )
            self.documents[doc_id] = doc_detail

    def get_all_documents(self) -> List[DocumentMetadata]:
        return [
            DocumentMetadata(
                id=d.id,
                filename=d.filename,
                file_type=d.file_type,
                file_size=d.file_size,
                page_count=d.page_count,
                uploaded_at=d.uploaded_at,
                doc_type=d.doc_type,
                parties=d.parties,
                effective_date=d.effective_date,
                governing_law=d.governing_law,
                jurisdiction=d.jurisdiction,
                dispute_mechanism=d.dispute_mechanism,
                executive_summary=d.executive_summary,
                plain_language_summary=d.plain_language_summary,
                hinglish_summary=d.hinglish_summary,
                risk_score=d.risk_score,
                risk_breakdown=d.risk_breakdown
            )
            for d in self.documents.values()
        ]

    def get_document(self, doc_id: str) -> Optional[DocumentDetail]:
        return self.documents.get(doc_id)

    def process_uploaded_file(self, filename: str, file_path: Path) -> DocumentDetail:
        pages_content, page_count, full_text = DocumentParser.parse_file(file_path)
        
        doc_id = f"doc-{uuid.uuid4().hex[:8]}"
        doc_type = self._detect_document_type(filename, full_text)
        parties = self._extract_parties(full_text)
        
        clauses = ClauseIntelligenceService.extract_clauses(pages_content)
        risks, risk_score, breakdown = RiskRadarService.analyze_risks(clauses)
        obligations = ObligationTrackerService.extract_obligations(clauses)
        timeline = TimelineService.extract_timeline(clauses, full_text)
        
        exec_summary, plain_summary, hinglish_summary = self._generate_summaries(doc_type, parties, clauses, risk_score)

        doc_detail = DocumentDetail(
            id=doc_id,
            filename=filename,
            file_type=file_path.suffix.replace(".", ""),
            file_size=file_path.stat().st_size if file_path.exists() else len(full_text),
            page_count=page_count,
            uploaded_at=datetime.datetime.now().strftime("%Y-%m-%d %H:%M"),
            doc_type=doc_type,
            parties=parties,
            effective_date=timeline[0].date_text if timeline else "Upon execution",
            governing_law="Laws of India (or designated jurisdiction)",
            jurisdiction="India",
            dispute_mechanism="Arbitration / Civil Courts",
            executive_summary=exec_summary,
            plain_language_summary=plain_summary,
            hinglish_summary=hinglish_summary,
            risk_score=risk_score,
            risk_breakdown=breakdown,
            clauses=clauses,
            risks=risks,
            obligations=obligations,
            timeline=timeline,
            pages_content=pages_content
        )
        self.documents[doc_id] = doc_detail
        return doc_detail

    def update_obligation(self, doc_id: str, ob_id: str, new_status: ObligationStatus) -> Optional[DocumentDetail]:
        doc = self.documents.get(doc_id)
        if not doc:
            return None
        for ob in doc.obligations:
            if ob.id == ob_id:
                ob.status = new_status
                break
        return doc

    def ask(self, doc_id: str, question: str, language: str = "english") -> GroundedAnswer:
        doc = self.documents.get(doc_id)
        if not doc:
            return GroundedAnswer(
                question=question,
                answer="Document not found.",
                citations=[],
                confidence=0.0,
                is_grounded=False
            )
        return RAGEngine.answer_question(doc, question, language)

    def compare(self, doc_a_id: str, doc_b_id: str) -> Optional[ComparisonResult]:
        doc_a = self.documents.get(doc_a_id)
        doc_b = self.documents.get(doc_b_id)
        if not doc_a or not doc_b:
            return None
        return ContractComparisonEngine.compare_documents(doc_a, doc_b)

    def generate_brief(self, doc_id: str, user_notes: str = "") -> Optional[LawyerConsultationBrief]:
        doc = self.documents.get(doc_id)
        if not doc:
            return None
        return LawyerBriefService.generate_brief(doc, user_notes)

    def _detect_document_type(self, filename: str, text: str) -> str:
        fn = filename.lower()
        t = text.lower()
        if "employ" in fn or "offer letter" in fn or "employment agreement" in t or "ctc" in t:
            return "Employment Contract"
        elif "lease" in fn or "rent" in fn or "tenancy" in fn or "residential lease" in t:
            return "Rental Agreement"
        elif "nda" in fn or "non-disclosure" in fn or "proprietary information" in t:
            return "Non-Disclosure Agreement (NDA)"
        elif "saas" in fn or "service agreement" in fn or "sla" in fn or "cloud platform" in t:
            return "SaaS Service Agreement"
        elif "loan" in fn or "borrower" in t or "lender" in t:
            return "Loan Agreement"
        elif "partnership" in fn or "partner" in t:
            return "Partnership Agreement"
        elif "privacy policy" in fn or "data protection" in fn:
            return "Privacy Policy"
        elif "terms" in fn or "terms of service" in t:
            return "Terms & Conditions"
        return "Legal Document"

    def _extract_parties(self, text: str) -> List[str]:
        # Simple extraction heuristic for preambles
        parties = []
        if "between" in text.lower():
            lines = text.split("\n")
            for line in lines[:25]:
                l = line.strip()
                if any(k in l.upper() for k in ["LIMITED", "PVT", "INC", "MR.", "MS.", "COMPANY", "EMPLOYEE", "LESSOR", "LESSEE"]):
                    clean_p = l.replace("BY AND BETWEEN:", "").replace("AND", "").strip(" ;:,")
                    if len(clean_p) > 4 and len(clean_p) < 80:
                        parties.append(clean_p)
        return list(dict.fromkeys(parties))[:3] or ["Party A", "Party B"]

    def _generate_summaries(self, doc_type: str, parties: List[str], clauses: List[Any], risk_score: int) -> Tuple[str, str, str]:
        parties_str = " and ".join(parties) if parties else "the contracting parties"
        exec_sum = (
            f"This is a legally binding {doc_type} entered into by {parties_str}. "
            f"Key provisions govern obligations, payment schedules, notice periods, and restrictive covenants. "
            f"Overall Risk Profile is evaluated at {risk_score}/100 with emphasis on termination and liability limits."
        )
        plain_sum = (
            f"In simple terms, this {doc_type} defines what each party must deliver and what happens if something goes wrong. "
            f"Be particularly mindful of the termination notice period and any indemnity commitments before signing."
        )
        hinglish_sum = (
            f"Aasan shabdon mein, yeh {doc_type} {parties_str} ke beech ki zimmedariyon ko tay karta hai. "
            f"Sign karne se pehle termination notice period, security deposit, aur indemnity clauses ko dhyan se samajh lein."
        )
        return exec_sum, plain_sum, hinglish_sum

# Global singleton
document_manager = DocumentManager()
