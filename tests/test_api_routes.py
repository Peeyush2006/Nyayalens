import sys
from pathlib import Path

# Add backend directory to path
backend_dir = Path(__file__).resolve().parent.parent / "backend"
sys.path.insert(0, str(backend_dir))

from fastapi.testclient import TestClient
from app.main import app
from app.models.schemas import ObligationStatus

client = TestClient(app)

def test_root_endpoint():
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "operational"
    assert "NyayaLens" in data["platform"]
    assert "security" in data
    assert "efficiency" in data

def test_health_check_endpoint():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "cache_stats" in data

def test_list_documents():
    response = client.get("/api/documents")
    assert response.status_code == 200
    docs = response.json()
    assert len(docs) >= 4
    filenames = [d["filename"] for d in docs]
    assert any("Employment" in f for f in filenames)

def test_get_document_detail_success():
    response = client.get("/api/documents/doc-demo-employment")
    assert response.status_code == 200
    doc = response.json()
    assert doc["id"] == "doc-demo-employment"
    assert len(doc["clauses"]) >= 4
    assert len(doc["risks"]) >= 3
    assert len(doc["obligations"]) >= 2
    assert len(doc["timeline"]) >= 3

def test_get_document_detail_not_found():
    response = client.get("/api/documents/nonexistent-id-999")
    assert response.status_code == 404
    assert response.json()["detail"] == "Document not found"

def test_get_clauses():
    response = client.get("/api/documents/doc-demo-employment/clauses")
    assert response.status_code == 200
    clauses = response.json()
    assert len(clauses) >= 4
    types = [c["clause_type"] for c in clauses]
    assert "termination" in types or "termination_notice" in types

def test_get_risks():
    response = client.get("/api/documents/doc-demo-employment/risks")
    assert response.status_code == 200
    risks = response.json()
    assert len(risks) >= 3
    assert any(r["severity"] == "Critical" for r in risks)

def test_get_obligations():
    response = client.get("/api/documents/doc-demo-employment/obligations")
    assert response.status_code == 200
    obs = response.json()
    assert len(obs) >= 2

def test_update_obligation_status():
    doc_res = client.get("/api/documents/doc-demo-employment").json()
    assert len(doc_res["obligations"]) > 0
    first_ob_id = doc_res["obligations"][0]["id"]
    
    response = client.patch(
        f"/api/documents/doc-demo-employment/obligations/{first_ob_id}?status=Completed"
    )
    assert response.status_code == 200
    doc = response.json()
    matched = [o for o in doc["obligations"] if o["id"] == first_ob_id]
    assert len(matched) == 1
    assert matched[0]["status"] == "Completed"

def test_ask_document_grounded_english():
    response = client.post(
        "/api/documents/doc-demo-employment/ask",
        json={"question": "What is the notice period for termination?", "language": "english"}
    )
    assert response.status_code == 200
    ans = response.json()
    assert ans["is_grounded"] is True
    assert len(ans["citations"]) >= 1
    assert "notice" in ans["answer"].lower()

def test_ask_document_grounded_hinglish():
    response = client.post(
        "/api/documents/doc-demo-employment/ask",
        json={"question": "Notice period kitne din ka hai?", "language": "hinglish"}
    )
    assert response.status_code == 200
    ans = response.json()
    assert ans["is_grounded"] is True
    assert len(ans["citations"]) >= 1

def test_ask_document_hallucination_refusal():
    response = client.post(
        "/api/documents/doc-demo-employment/ask",
        json={"question": "Does this contract permit crypto token mining on mars?", "language": "english"}
    )
    assert response.status_code == 200
    ans = response.json()
    assert ans["is_grounded"] is False
    assert len(ans["citations"]) == 0
    assert "couldn't find" in ans["answer"].lower() or "not found" in ans["answer"].lower()

def test_compare_contracts():
    response = client.post(
        "/api/compare?doc_a_id=doc-demo-employment&doc_b_id=doc-demo-rental"
    )
    assert response.status_code == 200
    comp = response.json()
    assert comp["total_changes"] > 0
    assert len(comp["diffs"]) > 0

def test_generate_lawyer_brief():
    response = client.post(
        "/api/documents/doc-demo-employment/lawyer-brief",
        data={"user_notes": "Ask advocate about IP transfer timing"}
    )
    assert response.status_code == 200
    brief = response.json()
    assert len(brief["key_issues"]) > 0
    assert len(brief["questions_to_ask_lawyer"]) > 0
    assert "IP transfer" in brief["user_notes"]

def test_export_lawyer_brief_markdown():
    response = client.get("/api/documents/doc-demo-employment/lawyer-brief/markdown")
    assert response.status_code == 200
    data = response.json()
    assert "markdown" in data
    assert "Briefing Dossier" in data["markdown"] or "NyayaLens" in data["markdown"]

def test_legal_info_search():
    response = client.get("/api/legal-info?q=non-compete")
    assert response.status_code == 200
    concepts = response.json()
    assert len(concepts) > 0
    assert any("27" in c["statutory_framework"] for c in concepts)

def test_observability_endpoint():
    response = client.get("/api/observability")
    assert response.status_code == 200
    metrics = response.json()
    assert "citation_accuracy_target" in metrics
    assert metrics["unsupported_claim_rate"] == "0.0%"
    assert metrics["hallucination_guard_status"] == "Active & Enforced"

def test_problem_statement_alignment_endpoint():
    response = client.get("/api/problem-statement-alignment")
    assert response.status_code == 200
    data = response.json()
    assert data["overall_compliance"] == "100.0%"
    assert len(data["requirements"]) == 9
    ids = [r["id"] for r in data["requirements"]]
    for i in range(1, 10):
        assert f"REQ-{i}" in ids

def test_document_upload_valid_text():
    sample_content = b"TechFlow Services Agreement. Section 1. Term: 12 months. Section 2. Governing Law: Delhi, India."
    response = client.post(
        "/api/documents/upload",
        files={"file": ("consulting_agreement.txt", sample_content, "text/plain")}
    )
    assert response.status_code == 200
    doc = response.json()
    assert doc["filename"] == "consulting_agreement.txt"
    assert len(doc["clauses"]) >= 1
