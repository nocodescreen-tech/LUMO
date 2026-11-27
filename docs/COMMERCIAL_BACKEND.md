# Commercial backend hardening — phase 1
- Scoped product/client/supplier references, row locking, server-authoritative sale pricing, purchase transaction, field allowlists, authenticated sockets, single-use MFA challenge, revoked refresh rejection and OTP throttling.
- Bulk sales purge and permanent purchase deletion are blocked until audited reversal workflows exist. Payment types restricted to current POS cash/credit.
- No migration or production deployment. Remaining: actual integration tests with isolated PostgreSQL, cash reconciliation, cancellation and refunds ledger, decimal migrations, idempotency, permissions review, CSRF, backups and AI tools, organization model and subscriptions.
- Existing sessions without session IDs will need to authenticate again. Production CLIENT_URL must explicitly contain the trusted frontend origin.
