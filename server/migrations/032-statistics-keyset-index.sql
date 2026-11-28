-- Accelerate bounded tenant ID scans over non-deleted sales.
CREATE INDEX IF NOT EXISTS lumo_stats_sales_tenant_id ON "Sales" ("userId",id) WHERE "deletedAt" IS NULL;
