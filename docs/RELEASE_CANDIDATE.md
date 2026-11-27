# LUMO commercial-v2 — Release candidate qualification

This is a checklist, not a certification or deployment authorization.

## Evidence per exact commit
- Backend CI: syntax, unit tests, dedicated PostgreSQL integration tests, migration re-run, isolated pg_dump/pg_restore with count and immutability trigger comparison.
- Frontend CI: locked dependencies, Vitest and Vite build.
- Dependency gate: npm production lockfile audit for server and client, high/critical findings or unavailable audit block this gate; review JSON artifacts. No automatic force upgrades.
- Do not merge main, tag a production release or deploy until the release owner approves the exact commit and the checks below.

## Staging configuration (never paste credentials in tickets or CI logs)
- Set NODE_ENV=production, strong unique JWT_SECRET, database connection, CLIENT_URL and BACKEND_URL HTTPS URLs, explicit LUMO_ALLOWED_ORIGINS for permitted previews. Browser refresh now requires X-Lumo-Client: 1; deploy compatible frontend and backend together. Confirm desktop/mobile clients before upgrade.
- Set and escrow LUMO_BACKUP_KEY_HEX; validate a real backup and restore into an isolated DB; never restore customer data into CI.
- Verify SMTP/Resend, Cloudinary, AI provider when enabled, Redis and single/multiple process topology. Redis fallback and per-process rate limits are not clustered protection.
- Review PostgreSQL TLS verification, secret rotation, data retention and consent, terms, tax/legal obligations and operator access. No external payment gateway is connected.

## Manual acceptance on staging, using synthetic companies A and B
1. Register, verify actual OTP, login, enable/disable 2FA, reset password, refresh after expiry, log out, revoke second session. Verify unauthorized origin and tenant rejection. Test desktop, Android and mobile browsers.
2. Create product/branch/warehouse, purchase approval and receipt, sale in both currencies, refund, inventory count, serial/lot, cash close. Confirm reconciliation and ledger entry totals match source operations, and use a repeated operation key to verify idempotency.
3. Create a credit sale, payment, document, budget warning/block, payroll, CRM, approved expense and SaaS invoice. Verify separation of currencies and role-specific controls; test across two companies and two branches.
4. Navigate every visible route in light/dark mode, FR/EN, widths 360/768/1440. Test keyboard, reduced motion, modal focus, charts, forms, loading, failure and empty states. Record screenshots and defects. Test real PDF, XLSX, printer and scanner.
5. Measure latency, errors, memory, DB connections and query load with a synthetic staging workload. Define and approve targets before calling a measurement pass. Never load-test production without authorization.
6. Execute a staging database backup/restore and compare totals, schema checksums and integrity; confirm customer archive preview (direct production import remains disabled).
7. Record commit SHA, workflow links, device/browser, date, failures, operator and approval. Any untested critical path is a release blocker.

## Current status
CI runs on synthetic data. No staging or production deployment, actual provider verification, visual sign-off, production recovery or load result is implied.

## Dependency remediation pass
Initial locked audit (run 46082134060) reported server 36 entries (3 critical/22 high), client 10 (6 high). Backend clean install failed because Resend was absent from the lock. Explicit candidate upgrades: firebase-admin 14.5.1 and nodemailer 10.6.1 (as proposed by audit); SheetJS 0.20.3 pinned to official vendor archive because npm registry xlsx 0.18.5 has no fix. The branch-only repair workflow uses npm lock-only compatible fixes without --force, tests installation/unit/UI build and workbook roundtrip before committing only the two lockfiles with a separate write-scoped job. No production deployment or main changes. GitHub token pushes may not trigger other workflows; qualification must run again on the resulting SHA via a subsequent ordinary commit/PR update. Any remaining high/critical report stays blocking; verify provider compatibility and full PostgreSQL integration before release. Do not claim all findings fixed until the new audit is available.

## Lockfile synchronization and database read indexes
Bot commit 00936096000716ba7b8f23fedd9758825e370685 contains synchronized server and client locks after the repair workflow. The associated PR workflows were action_required, not passes. This ordinary follow-up commit requests fresh qualification without weakening the vulnerability gate. The repair workflow is now manual, read-only and artifact-only; future lockfile updates need explicit review, no automatic branch pushes.
Migration 031 adds eleven tenant-scoped read indexes for sales (global, assigned branch and client history), products, clients, purchases, serial lookup, currency journal, open receivables and notifications. Stable secondary ID ordering added to sales, client history and purchases. Integration tests check index presence and scoped history ordering. Index creation is transactional and may lock large tables; evaluate staging EXPLAIN (ANALYZE, BUFFERS) and disk/write overhead before deployment. No measured speedup or fresh vulnerability count claimed. Do not apply migrations to production automatically.

## Performance pass
Baseline UI run 46084292517: POS 456.92 kB (gzip 121.49 kB), XLSX 488.37 kB (gzip 159.82 kB), precache 5097.88 KiB. Camera scanner and product spreadsheet module now lazy-loaded; heavy optional chunks and public screenshots removed from precache (network required on first use; no offline financial mutations). Product import selects the Products/Produits worksheet rather than the instructions, caps file size at 5 MiB and rows at 1000. Cancel superseded search, coalesce notification count, pause hidden-tab background requests, close audio context. Redis invalidation uses SCAN with batches, memory fallback deletes all requested keys, cancels old TTL timers, caps response cache at 500 keys and 256 KiB per response. Non-cache keys not subject to eviction. CI records bundle sizes and tests memory fallback. Actual device/network and DB timings not yet measured. Redis invalidation remains best-effort and not atomic with concurrent writes. Latest prior audit: zero high/critical, 7 lower severity entries remain.

## Synthetic concurrency and performance evidence
Prior runtime optimization backend and dependency gates passed; frontend failed because an optional-tool Workbox runtime rule was inserted in manifest.icons. Corrected placement. Sale audit hooks now use their caller transaction for user lookups, avoiding a second pool checkout while holding the tenant lock. New isolated integration scenario creates a synthetic company, submits 12 distinct simultaneous sales against eight stock units (8 creates, 4 conflicts), 12 duplicate requests against one unit (1 create, 11 replays), and 24 simultaneous protected reads. It asserts stock, sale count, journal amount and register balance, records observed p50/p95/max and elapsed durations in commercial-performance.json, and uploads the report. No production traffic, no capacity/SLA claim; measurements depend on GitHub runner and small fixtures. Full CI pending. Larger data-volume stats, slow network and real device benchmarks remain separate qualification tasks.

## Analytics scalability pass
Previous CI four gates succeeded; observed POS chunk 38.75 kB from 456.92 kB, precache 3306.31 KiB from 5097.88 KiB, stress invariants passed. Statistics now iterate sale rows by tenant/ID in 500-row repeatable-read batches, avoid the duplicate monthly scan, and use Map for arbitrary product names. Analytics monthly series uses the selected date range; explicit custom dates require both bounds and max 366 days. Recent rows ordered stably. Stats UI cancels stale requests and uses normal bounded cache keys. Unused team images excluded from PWA precache, still present as public assets. Migration 032 adds tenant ID partial index. A 2403-row synthetic legacy fixture verifies 2400 included rows, refunds/soft deletes/foreign rows excluded, FX totals and product name '__proto__', exports timings. These are legacy estimates, not ledger financial statements; distinct product aggregates still consume memory proportional to distinct keys, and long scans occupy a DB connection. No production benchmark or deployment. CI pending.
