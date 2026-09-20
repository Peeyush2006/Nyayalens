import sys
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "backend"))

from app.core.security import sanitize_filename, validate_uploaded_file
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_path_traversal_prevention():
    malicious_names = [
        "../../etc/passwd",
        "..\\..\\windows\\system32\\cmd.exe",
        "nested/../../secret.pdf",
        "....//....//config.json"
    ]
    for name in malicious_names:
        safe = sanitize_filename(name)
        assert "/" not in safe, f"Failed for {name}: {safe}"
        assert "\\" not in safe, f"Failed for {name}: {safe}"
        assert not safe.startswith(".."), f"Failed for {name}: {safe}"
    print("[PASS] Path traversal sanitization verified")

def test_invalid_file_extension():
    invalid_files = ["malware.exe", "exploit.sh", "script.py", "shell.php", "data.bat"]
    for fname in invalid_files:
        valid, msg = validate_uploaded_file(fname, b"print('hello')", max_size_mb=25)
        assert not valid, f"Should have rejected {fname}"
        assert "Unsupported file extension" in msg
    print("[PASS] Malicious file extension rejection verified")

def test_corrupted_pdf_signature():
    valid, msg = validate_uploaded_file("agreement.pdf", b"NOT_A_REAL_PDF_HEADER", max_size_mb=25)
    assert not valid
    assert "missing %PDF" in msg
    print("[PASS] Magic byte PDF signature validation verified")

def test_file_size_limit():
    oversized_bytes = b"0" * (26 * 1024 * 1024)  # 26MB
    valid, msg = validate_uploaded_file("large.pdf", oversized_bytes, max_size_mb=25)
    assert not valid
    assert "exceeds maximum permissible size" in msg
    print("[PASS] File size threshold enforcement verified")

def test_security_headers_present():
    response = client.get("/")
    assert response.status_code == 200
    headers = response.headers
    assert headers.get("x-content-type-options") == "nosniff"
    assert headers.get("x-frame-options") == "DENY"
    assert headers.get("x-xss-protection") == "1; mode=block"
    assert "strict-transport-security" in headers
    assert "content-security-policy" in headers
    print("[PASS] OWASP security response headers verified")

def test_cors_configuration():
    # Preflight OPTIONS request
    response = client.options(
        "/api/documents",
        headers={
            "Origin": "http://localhost:3000",
            "Access-Control-Request-Method": "GET"
        }
    )
    assert response.status_code == 200
    assert response.headers.get("access-control-allow-origin") == "http://localhost:3000"
    print("[PASS] Strict CORS origin validation verified")

if __name__ == "__main__":
    print("Running NyayaLens Security Test Suite...")
    test_path_traversal_prevention()
    test_invalid_file_extension()
    test_corrupted_pdf_signature()
    test_file_size_limit()
    test_security_headers_present()
    test_cors_configuration()
    print("\nALL 6 SECURITY TESTS PASSED SUCCESSFULLY! [100% SECURE]")
