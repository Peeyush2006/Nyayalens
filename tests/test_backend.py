import sys
from pathlib import Path

# Add backend directory to path
backend_dir = Path(__file__).resolve().parent.parent / "backend"
sys.path.insert(0, str(backend_dir))

from app.models.schemas import RiskSeverity, ObligationStatus, DiffType
from app.services.document_manager import document_manager
from app.services.legal_knowledge import LegalKnowledgeService
from app.services.comparison_engine import ContractComparisonEngine
from app.services.rag_engine import RAGEngine
from app.sample_data.sample_contracts import SAMPLE_EMPLOYMENT_CONTRACT, SAMPLE_RENTAL_AGREEMENT

def test_sample_contracts_loaded():
    """Verify that all 4 preloaded contracts are indexed on initialization."""
    docs = document_manager.get_all_documents()
    assert len(docs) >= 4
    filenames = [d.filename for d in docs]
    assert any("Employment" in f for f in filenames)
    assert any("Lease" in f or "Rental" in f for f in filenames)
    assert any("NDA" in f for f in filenames)
    assert any("SaaS" in f for f in filenames)

def test_clause_extraction_and_intelligence():
    """Verify key clause detection (termination, non-compete, indemnity)."""
    emp_doc = document_manager.get_document("doc-demo-employment")
    assert emp_doc is not None
    
    clause_types = [c.clause_type for c in emp_doc.clauses]
    assert "termination" in clause_types
    assert "non_compete" in clause_types
    assert "indemnification" in clause_types
    assert "intellectual_property" in clause_types
    
    # Check that plain English and Hinglish explanations are present
    term_clause = next(c for c in emp_doc.clauses if c.clause_type == "termination")
    assert len(term_clause.plain_english) > 10
    assert len(term_clause.hinglish) > 10
    assert term_clause.source.page >= 1

def test_risk_radar_severity_and_lawyer_questions():
    """Verify Risk Radar classifications and lawyer question generation."""
    emp_doc = document_manager.get_document("doc-demo-employment")
    assert emp_doc is not None
    assert len(emp_doc.risks) >= 3
    
    severities = [r.severity for r in emp_doc.risks]
    assert RiskSeverity.CRITICAL in severities
    
    for r in emp_doc.risks:
        assert len(r.suggested_lawyer_question) > 15
        assert r.page_number >= 1
        assert len(r.potential_user_impact) > 10

def test_obligation_tracker():
    """Verify that obligations have deadlines, responsible parties, and consequences."""
    emp_doc = document_manager.get_document("doc-demo-employment")
    assert emp_doc is not None
    assert len(emp_doc.obligations) >= 2
    
    for ob in emp_doc.obligations:
        assert ob.responsible_party is not None
        assert ob.deadline is not None
        assert ob.consequence_of_breach is not None

def test_timeline_service():
    """Verify chronological milestones are extracted with page references."""
    emp_doc = document_manager.get_document("doc-demo-employment")
    assert emp_doc is not None
    assert len(emp_doc.timeline) >= 3
    
    for event in emp_doc.timeline:
        assert event.page_number >= 1
        assert len(event.date_text) > 2
        assert len(event.description) > 5

def test_rag_grounded_qa():
    """Verify that RAG answers are grounded with exact citations."""
    emp_doc = document_manager.get_document("doc-demo-employment")
    assert emp_doc is not None
    
    answer = document_manager.ask("doc-demo-employment", "When can I terminate this agreement?", language="english")
    assert answer.is_grounded is True
    assert len(answer.citations) >= 1
    assert answer.citations[0].page >= 1
    assert "notice" in answer.answer.lower() or "terminate" in answer.answer.lower()

def test_rag_hallucination_guard():
    """Verify that hallucination guard returns 'not found' for unsupported claims."""
    emp_doc = document_manager.get_document("doc-demo-employment")
    assert emp_doc is not None
    
    # Question about completely fabricated/unrelated content
    answer = document_manager.ask("doc-demo-employment", "Does this contract permit crypto token mining on mars?", language="english")
    assert answer.is_grounded is False
    assert "couldn't find" in answer.answer.lower() or "not found" in answer.answer.lower()
    assert len(answer.citations) == 0

def test_rag_hinglish_synthesis():
    """Verify that user can query in Hinglish and get understandable grounded response."""
    emp_doc = document_manager.get_document("doc-demo-employment")
    assert emp_doc is not None
    
    answer = document_manager.ask("doc-demo-employment", "Is agreement mein notice period kitna hai?", language="hinglish")
    assert answer.is_grounded is True
    assert len(answer.citations) >= 1
    assert "notice" in answer.answer.lower()

def test_contract_comparison():
    """Verify comparison between two contracts detects differences."""
    comp = document_manager.compare("doc-demo-employment", "doc-demo-rental")
    assert comp is not None
    assert comp.total_changes > 0
    assert len(comp.diffs) > 0

def test_lawyer_brief_generation():
    """Verify all 10 required sections of Lawyer Consultation Brief."""
    brief = document_manager.generate_brief("doc-demo-employment", user_notes="Want to ask about IP clause")
    assert brief is not None
    assert len(brief.key_issues) > 0
    assert len(brief.important_clauses) > 0
    assert len(brief.user_obligations) > 0
    assert len(brief.questions_to_ask_lawyer) > 0
    assert len(brief.missing_information) > 0
    assert len(brief.ambiguous_provisions) > 0
    assert len(brief.critical_deadlines) > 0
    assert len(brief.recommended_documents_to_bring) > 0
    assert "IP clause" in brief.user_notes
    assert "not legal advice" in brief.disclaimer.lower()

def test_legal_knowledge_base():
    """Verify India-first statutory knowledge search."""
    concepts = LegalKnowledgeService.search_concept("non-compete")
    assert len(concepts) > 0
    assert any("27" in c.statutory_framework for c in concepts)
    
    indemnity_concepts = LegalKnowledgeService.search_concept("indemnity")
    assert len(indemnity_concepts) > 0
    assert any("124" in c.statutory_framework for c in indemnity_concepts)

if __name__ == "__main__":
    print("Running NyayaLens Backend Tests...")
    test_sample_contracts_loaded()
    print("[PASS] Sample contracts test passed")
    test_clause_extraction_and_intelligence()
    print("[PASS] Clause extraction and intelligence test passed")
    test_risk_radar_severity_and_lawyer_questions()
    print("[PASS] Risk radar and lawyer questions test passed")
    test_obligation_tracker()
    print("[PASS] Obligation tracker test passed")
    test_timeline_service()
    print("[PASS] Timeline service test passed")
    test_rag_grounded_qa()
    print("[PASS] Grounded RAG Q&A test passed")
    test_rag_hallucination_guard()
    print("[PASS] Hallucination guard test passed")
    test_rag_hinglish_synthesis()
    print("[PASS] Hinglish synthesis test passed")
    test_contract_comparison()
    print("[PASS] Contract comparison test passed")
    test_lawyer_brief_generation()
    print("[PASS] Lawyer brief generation test passed")
    test_legal_knowledge_base()
    print("[PASS] Legal knowledge base test passed")
    print("\nALL 11 BACKEND TESTS PASSED SUCCESSFULLY! [SUCCESS]")
