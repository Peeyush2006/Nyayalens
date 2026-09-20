# Security Policy & OWASP Hardening Specification

NyayaLens treats legal data privacy, integrity, and security with enterprise-grade standards.

## 1. Supported Versions
| Version | Supported          |
| ------- | ------------------ |
| 2.1.x   | :white_check_mark: |
| 2.0.x   | :white_check_mark: |
| < 2.0   | :x:                |

---

## 2. OWASP Top 10 Fortifications & Protections

### A. HTTP Security Headers
Every HTTP response issued by NyayaLens includes strict OWASP-mandated headers:
- `X-Content-Type-Options: nosniff`: Prevents MIME-type sniffing attacks.
- `X-Frame-Options: DENY`: Complete clickjacking defense by disallowing framing.
- `X-XSS-Protection: 1; mode=block`: Blocks cross-site scripting attacks in legacy browsers.
- `Referrer-Policy: strict-origin-when-cross-origin`: Restricts referrer data leakage.
- `Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=()`: Completely disables sensitive browser hardware APIs.
- `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload`: Enforces TLS/HTTPS connections for a minimum of 1 year.
- `Content-Security-Policy: default-src 'self'; frame-ancestors 'none';`: Strict source white-listing.
- `Cross-Origin-Opener-Policy: same-origin` & `Cross-Origin-Resource-Policy: same-origin`: Isolation against Spectre-class microarchitectural side-channel attacks.

### B. Path Traversal Defense
File uploads and document lookups employ strict sanitization (`sanitize_filename`):
- All path separators (`/`, `\`), relative markers (`..`), and null bytes (`\x00`) are eliminated.
- Filenames are normalized to safe alphanumeric characters with strictly verified extensions.

### C. File Signature Magic Byte Verification
- Extension checking alone is recognized as vulnerable to file spoofing.
- Every PDF upload must strictly begin with `%PDF` magic bytes (`validate_uploaded_file`).
- DOCX uploads require verified `PK\x03\x04` zip archive headers.
- File size is limited to 25MB (`MAX_FILE_SIZE_MB`).

### D. Sliding Window Rate Limiting (Anti-DoS)
- Client IP addresses are limited to 150 requests/minute via `RateLimiterMiddleware`.
- HTTP 429 status is returned upon exceeding threshold, with `Retry-After` and `X-RateLimit-*` headers.

### E. Strict Origin Whitelist CORS
- CORS requests are restricted to validated domains (`localhost:3000`, `nyayalens.vercel.app`).
- Wildcards (`*`) with credentials are completely prohibited.

---

## 3. Reporting a Vulnerability
If you discover a potential security vulnerability in NyayaLens, please report it via GitHub Security Advisories or email security@nyayalens.org.
Reports will receive an initial response within 24 hours.
