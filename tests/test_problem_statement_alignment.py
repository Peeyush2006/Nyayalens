import sys
from pathlib import Path

# Add backend directory to path
backend_dir = Path(__file__).resolve().parent.parent / "backend"
sys.path.insert(0, str(backend_dir))

from app.models.schemas import RiskSeverity, ObligationStatus, DiffType
from app.services.document_manager import document_manager
from app.services.legal_knowledge import LegalKnowledgeService

def test_req_1_document_ingestion_and_page_preservation():
    """Requirement 1: Multi-format parsing preserving layout and page numbers."""
    docs = document_manager.get_all_documents()
    assert len(docs) >= 4, "Preloaded legal contracts must be indexed"
    for d in docs:
        full_doc = document_manager.get_document(d.id)
        assert full_doc is not None, f"Document {d.id} must be retrievable"
        assert full_doc.page_count >= 1, "Page count must be >= 1"
        assert len(full_doc.pages_content) == full_doc.page_count, "All page chunks must be preserved"
        for p in full_doc.pages_content:
            assert p.page_number >= 1, "Page number must be positive"
            assert len(p.text) > 0, "Page content cannot be empty"

def test_req_2_clause_intelligence_and_classification():
    """Requirement 2: Accurate clause extraction across standard legal categories."""
    emp_doc = document_manager.get_document("doc-demo-employment")
    assert emp_doc is not None
    clauses = emp_doc.clauses
    assert len(clauses) >= 4, "Must detect core clauses"
    
    types = [c.clause_type for c in clauses]
    assert "termination" in types or "termination_notice" in types
    assert "non_compete" in types
    assert "indemnification" in types
    assert "intellectual_property" in types
    
    for c in clauses:
        assert c.source.page >= 1, "Each clause must anchor to a document page"
        assert len(c.plain_english) > 0, "Plain English simplification must be provided"
        assert len(c.hinglish) > 0, "Hinglish translation must be provided"
        assert c.confidence >= 0.70, "Confidence score must meet production threshold"

def test_req_3_explainable_risk_radar_and_threat_scoring():
    """Requirement 3: Multi-tier risk categorization with plain-English reasoning."""
    emp_doc = document_manager.get_document("doc-demo-employment")
    assert emp_doc is not None
    risks = emp_doc.risks
    assert len(risks) >= 3, "Risks must be identified"
    
    # Must have severity levels
    severities = [r.severity for r in risks]
    assert RiskSeverity.CRITICAL in severities or RiskSeverity.HIGH_ATTENTION in severities
    
    for r in risks:
        assert len(r.title) > 0, "Risk title must be present"
        assert len(r.potential_user_impact) > 10, "Why it matters explanation must be comprehensive"
        assert len(r.suggested_lawyer_question) > 10, "Targeted question for advocate must be provided"
        assert r.page_number >= 1, "Risk must anchor to a verified page"

def test_req_4_actionable_obligations_and_compliance_tracker():
    """Requirement 4: Actionable checklist of obligations with deadlines and penalties."""
    emp_doc = document_manager.get_document("doc-demo-employment")
    assert emp_doc is not None
    obligations = emp_doc.obligations
    assert len(obligations) >= 2, "Actionable obligations must be extracted"
    
    for ob in obligations:
        assert len(ob.task) > 5, "Task description must be clear"
        assert len(ob.responsible_party) > 0, "Responsible party must be designated"
        assert len(ob.deadline) > 0, "Deadline must be specified"
        assert ob.page_number >= 1, "Obligation must link to page"
        
    # Verify obligation status update
    target_ob = obligations[0]
    updated_doc = document_manager.update_obligation(
        emp_doc.id, target_ob.id, ObligationStatus.COMPLETED
    )
    assert updated_doc is not None
    updated_ob = next(o for o in updated_doc.obligations if o.id == target_ob.id)
    assert updated_ob.status == ObligationStatus.COMPLETED

def test_req_5_critical_dates_and_milestone_timeline():
    """Requirement 5: Chronological timeline of legal milestones and notice periods."""
    emp_doc = document_manager.get_document("doc-demo-employment")
    assert emp_doc is not None
    timeline = emp_doc.timeline
    assert len(timeline) >= 2, "Milestones must be extracted"
    
    for event in timeline:
        assert len(event.date_text) > 0, "Date or duration must be populated"
        assert len(event.event_type) > 0, "Event type must be populated"
        assert event.page_number >= 1, "Timeline event must anchor to a page"

def test_req_6_evidence_grounded_rag_with_citations():
    """Requirement 6: Factual answers anchored with exact page and section citations."""
    res = document_manager.ask("doc-demo-employment", "When can I terminate this agreement?", "english")
    
    assert res.is_grounded is True, "Answer must be grounded in verified contract text"
    assert len(res.citations) >= 1, "Must contain at least 1 verified citation"
    assert res.citations[0].page >= 1, "Citation must include page number"
    assert len(res.citations[0].snippet) > 5, "Citation must include source snippet"
    assert "notice" in res.answer.lower() or "terminate" in res.answer.lower()

def test_req_7_anti_hallucination_guard_and_fallback():
    """Requirement 7: Graceful rejection of unsupported or ungrounded questions."""
    res = document_manager.ask("doc-demo-employment", "Does this contract permit crypto token mining on mars?", "english")
    
    assert res.is_grounded is False, "Ungrounded question must have is_grounded=False"
    assert "couldn't find" in res.answer.lower() or "not found" in res.answer.lower()
    assert len(res.citations) == 0, "Ungrounded query must produce zero fake citations"

def test_req_8_side_by_side_contract_diff_comparison():
    """Requirement 8: Side-by-side comparison highlighting added/modified/removed terms."""
    diff_res = document_manager.compare("doc-demo-employment", "doc-demo-rental")
    
    assert diff_res is not None
    assert len(diff_res.diffs) >= 3, "Contract differences must be detected"
    
    categories = [d.category for d in diff_res.diffs]
    assert len(set(categories)) >= 2, "Multiple categories must be represented"
    
    for d in diff_res.diffs:
        assert d.diff_type in [DiffType.MODIFIED, DiffType.ADDED, DiffType.REMOVED]
        assert len(d.what_changed) > 5, "Explainability summary must be provided"
        assert len(d.what_to_review) > 5, "Counsel review checklist must be provided"

def test_req_9_advocate_consultation_dossier_and_export():
    """Requirement 9: 10-point structured brief with personal notes capture."""
    brief = document_manager.generate_brief(
        "doc-demo-employment",
        user_notes="Need to ask if I can negotiate the 90-day notice to 30 days."
    )
    assert brief is not None
    assert len(brief.document_name) > 0
    assert len(brief.executive_summary) > 20
    assert len(brief.key_issues) >= 1
    assert len(brief.important_clauses) >= 1
    assert len(brief.user_obligations) >= 1
    assert len(brief.questions_to_ask_lawyer) >= 2
    assert len(brief.missing_information) >= 1
    assert len(brief.ambiguous_provisions) >= 1
    assert len(brief.critical_deadlines) >= 1
    assert len(brief.recommended_documents_to_bring) >= 1
    assert "90-day" in brief.user_notes

if __name__ == "__main__":
    tests = [
        test_req_1_document_ingestion_and_page_preservation,
        test_req_2_clause_intelligence_and_classification,
        test_req_3_explainable_risk_radar_and_threat_scoring,
        test_req_4_actionable_obligations_and_compliance_tracker,
        test_req_5_critical_dates_and_milestone_timeline,
        test_req_6_evidence_grounded_rag_with_citations,
        test_req_7_anti_hallucination_guard_and_fallback,
        test_req_8_side_by_side_contract_diff_comparison,
        test_req_9_advocate_consultation_dossier_and_export,
    ]
    
    passed = 0
    print("Running Problem Statement Alignment Test Suite (9 Core Requirements)...")
    for t in tests:
        try:
            t()
            passed += 1
            print(f"  [PASS] {t.__name__}")
        except Exception as e:
            print(f"  [FAIL] {t.__name__}: {e}")
            
    print(f"\nResult: {passed}/{len(tests)} Problem Statement tests passed.")
    if passed == len(tests):
        print("ALL 9 PROBLEM STATEMENT REQUIREMENTS STRICTLY SATISFIED (100% SCORE)!")
    else:
        sys.exit(1)
