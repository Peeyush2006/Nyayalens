import os
import re
import time
from pathlib import Path
from typing import Dict, List, Tuple
from fastapi import Request, Response, HTTPException
from starlette.middleware.base import BaseHTTPMiddleware
from app.core.config import settings

class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Applies OWASP-recommended HTTP security headers to all responses."""
    
    async def dispatch(self, request: Request, call_next):
        response: Response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=(), payment=()"
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains; preload"
        response.headers["Content-Security-Policy"] = "default-src 'self'; frame-ancestors 'none';"
        response.headers["Cross-Origin-Opener-Policy"] = "same-origin"
        response.headers["Cross-Origin-Resource-Policy"] = "same-origin"
        return response

class RateLimiterMiddleware(BaseHTTPMiddleware):
    """Sliding-window IP rate limiter preventing DoS and abuse (150 req/min)."""
    
    def __init__(self, app, max_requests: int = 150, window_seconds: int = 60):
        super().__init__(app)
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self.ip_history: Dict[str, List[float]] = {}

    async def dispatch(self, request: Request, call_next):
        # Exempt health check and docs
        if request.url.path in ["/", "/docs", "/redoc", "/openapi.json"]:
            return await call_next(request)

        client_ip = request.client.host if request.client else "unknown"
        now = time.time()
        
        # Clean up old timestamps for this IP
        history = self.ip_history.get(client_ip, [])
        valid_history = [t for t in history if now - t < self.window_seconds]
        
        if len(valid_history) >= self.max_requests:
            return Response(
                content='{"detail":"Rate limit exceeded (150 requests/min). Please slow down."}',
                status_code=429,
                media_type="application/json",
                headers={
                    "Retry-After": str(self.window_seconds),
                    "X-RateLimit-Limit": str(self.max_requests),
                    "X-RateLimit-Remaining": "0"
                }
            )

        valid_history.append(now)
        self.ip_history[client_ip] = valid_history

        response = await call_next(request)
        response.headers["X-RateLimit-Limit"] = str(self.max_requests)
        response.headers["X-RateLimit-Remaining"] = str(max(0, self.max_requests - len(valid_history)))
        return response

class PerformanceTimingMiddleware(BaseHTTPMiddleware):
    """Tracks and exposes execution latency in milliseconds for efficiency observability."""
    
    async def dispatch(self, request: Request, call_next):
        start_time = time.perf_counter()
        response = await call_next(request)
        process_time_ms = (time.perf_counter() - start_time) * 1000.0
        response.headers["X-Process-Time-Ms"] = f"{process_time_ms:.2f}"
        
        # Add client-side cache header & ETag for GET endpoints
        if request.method == "GET" and request.url.path.startswith("/api"):
            response.headers["Cache-Control"] = "public, max-age=3600, stale-while-revalidate=86400"
            path_hash = hex(abs(hash(request.url.path)))[2:10]
            response.headers["ETag"] = f'W/"nyaya-{path_hash}"'
            
        return response

def sanitize_filename(filename: str) -> str:
    """Eliminates path traversal attempts, null bytes, and malicious characters."""
    # Strip directory components
    clean_name = Path(filename).name
    # Remove all characters except alphanumeric, dashes, dots, underscores
    clean_name = re.sub(r"[^a-zA-Z0-9_.-]", "_", clean_name)
    if not clean_name or clean_name.startswith("."):
        clean_name = f"document_{int(time.time())}.pdf"
    return clean_name

def validate_uploaded_file(filename: str, file_bytes: bytes, max_size_mb: int = 25) -> Tuple[bool, str]:
    """Validates file extension, byte signature (magic numbers), and size limit."""
    # 1. Size check
    max_bytes = max_size_mb * 1024 * 1024
    if len(file_bytes) > max_bytes:
        return False, f"File exceeds maximum permissible size limit of {max_size_mb} MB"

    if len(file_bytes) == 0:
        return False, "Uploaded file is empty"

    # 2. Extension check
    allowed_extensions = {".pdf", ".docx", ".doc", ".txt", ".md"}
    ext = Path(filename).suffix.lower()
    if ext not in allowed_extensions:
        return False, f"Unsupported file extension '{ext}'. Permitted: {', '.join(sorted(allowed_extensions))}"

    # 3. Magic number verification
    if ext == ".pdf" and not file_bytes.startswith(b"%PDF"):
        return False, "Corrupted or invalid PDF signature (missing %PDF magic header)"
    
    if ext == ".docx" and not file_bytes.startswith(b"PK\x03\x04"):
        return False, "Corrupted or invalid DOCX archive structure"

    return True, "Valid"
