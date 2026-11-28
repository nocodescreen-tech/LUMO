# LUMO — authorized security qualification

Scope: commercial-v2 source and isolated synthetic CI fixtures only. No customer systems, credentials, production traffic, destructive scans, or external providers. This is a coverage plan, not a completed penetration-test report. Each finding needs an exact commit, reproduction in isolated test environment, impact, severity, corrective change and successful regression result.

| Area | Negative cases and control objectives | Evidence / remaining work |
|---|---|---|
| Authentication, OTP, 2FA, recovery | Invalid/expired/replayed codes; account enumeration; session revocation; password changes; concurrent auth; token type and signature; validation/suspension | Existing tests + new account status guard; real OTP delivery and full browser session flows pending |
| Authorization / BOLA / IDOR / BFLA | Anonymous, staff, owner A/B, platform admin; foreign identifiers, warehouse/branch scoping, privilege changes, hidden fields | Existing scoped integration cases + new route matrix; exhaustive per-method inventory pending |
| Old routes / versioning | /api and /api/v1, French/English aliases, legacy destructive operations, alternate reads | New negative read matrix; enumerate all registered methods and aliases |
| Injection and untrusted data | SQL/ORM filters, wildcard literal semantics, XSS in forms/print/email/PDF, command/path/template injection, prototype keys, malformed JSON and multipart | Email wildcard fix and prior analytics prototype test; comprehensive output encoding review pending |
| Browser security | CORS, CSRF, cookies, session fixation, unsafe redirects, CSP, clickjacking, PWA data cache, local storage and logout | Existing header and session tests; authenticated browser checks pending |
| Uploads, imports, exports | MIME/extension/signature mismatch, oversized data, decompression limits, archive integrity, spreadsheet formulas and document escaping | New image gate tests; full content decoding/AV and hostile archive format review pending |
| Financial logic | Double sale/refund/payment, negative amounts, invalid rate, tampered total, overpayment, duplicate references, cash closing, stock race, ledger and immutable history | Existing commercial tests; extend every mutation, currency and permission combination |
| ERP / SaaS | All inventory, lot/serial, SAV, CRM, procurement, HR, payroll, leave, budgets, treasury, documents, receivables, billing, subscriptions, support, backup, dashboard, alerts | Existing module tests + route matrix; endpoint-by-endpoint authorization and state transitions remain to audit |
| AI and integrations | Tenant context, prompt injection, unauthorized tools/data, SSRF, provider failure, quotas, sensitive logs, webhook verification, email and storage | Existing read-only/quotas; provider and adversarial input validation pending |
| Infrastructure and dependencies | npm audit, secret scanning, static analysis, container config, TLS, DB least privilege, cloud IAM, Redis, file permissions, backup restore, egress and deployment | npm gate and isolated recovery; hosted config and infrastructure assessment pending |
| Availability | Rate limits, request size, DB pool, concurrency, bounded queries, large data, repeated retries, cache behavior | Existing synthetic concurrency/volume tests; bounded staging resilience tests pending |
| Business data privacy | Export ownership, support/notification visibility, sensitive fields, retention, platform access, audit trails and immutable records | Existing scoped tests; privacy/legal review pending |

## Professional toolchain proposed for isolated environment
- Source review and SAST (CodeQL or Semgrep); verify rule coverage and triage false positives.
- Dependency/SBOM analysis (npm audit, OSV, CycloneDX); review advisories and version compatibility.
- Secret scanning (Gitleaks or equivalent), including authorized Git history; never print or distribute secrets; rotate confirmed exposed credentials.
- DAST (OWASP ZAP) on a dedicated local/staging instance seeded with synthetic accounts; require explicit scope and bounded requests. Use authenticated role coverage and manually verify findings.
- Manual validation against OWASP ASVS and Web Security Testing Guide and API Security guidance; use current version at execution.
- Regression tests and redacted evidence reports; critical/high findings block release; moderate issues require remediation or written risk acceptance. A successful scan cannot prove absence of vulnerabilities.

## Evidence
Previous CI passed dependency, backend and production build gates; public browser smoke failed and is being corrected. The new security tests are recorded in source but not yet executed at time of this commit. No claim of full penetration test completion.

## Automated source and history gate
`commercial-security.yml` performs Gitleaks scans of the current tree and all reachable Git history, Semgrep scans of commercial-v2 and the available default-branch snapshot, and CycloneDX production dependency inventories for server/client. Scanner image digests and commit counts are recorded per run (tags resolved at execution, not permanently pinned). Only aggregate findings, scanner status and counts are published; raw reports and logs remain ephemeral to avoid exposing secrets or actionable source locations in public CI. A candidate finding is not a confirmed exploit. Any scanner finding/error makes the corresponding step fail pending review. For private remediation, run the same scanners on an authorized local checkout and retain restricted evidence. Do not rewrite Git history or rotate real credentials without a reviewed recovery plan. History scan covers reachable refs, not deleted/unreachable objects or historic infrastructure. SAST covers current commercial and default-branch snapshots, not every historic commit; external DAST, authenticated browser tests and cloud checks remain outstanding. No production scanning.

## Realtime authorization hardening
Socket.IO now uses the same explicit origin allowlist for handshake and CORS; access JWT type, session, validation and parent state are checked before personal room membership, then rechecked at 60-second intervals. Revocation is not instantaneous; notifications carry only refresh hints. HTTP and refresh now deny a staff member of an unverified/unvalidated parent. Regression test covers identity helper and HTTP/refresh rejection; real socket connection, reconnection and distributed revocation remain to test. Fixed activities route Boolean precedence. CI pending.
