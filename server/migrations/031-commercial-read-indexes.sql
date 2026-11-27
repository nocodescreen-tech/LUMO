-- Targeted read indexes for tenant-scoped commercial registers. No business data changes.
-- Migrations execute in a transaction; schedule index creation on large databases during maintenance.
CREATE INDEX IF NOT EXISTS lumo_rc_sales_tenant_date ON "Sales" ("userId","createdAt" DESC,id DESC) WHERE "deletedAt" IS NULL;
CREATE INDEX IF NOT EXISTS lumo_rc_sales_branch_date ON "Sales" ("userId","warehouseId","createdAt" DESC,id DESC) WHERE "deletedAt" IS NULL;
CREATE INDEX IF NOT EXISTS lumo_rc_sales_client_date ON "Sales" ("userId","clientId","createdAt" DESC,id DESC) WHERE "deletedAt" IS NULL;
CREATE INDEX IF NOT EXISTS lumo_rc_products_tenant_date ON "Products" ("userId","createdAt" DESC,id DESC);
CREATE INDEX IF NOT EXISTS lumo_rc_clients_tenant_name ON "Clients" ("userId",nom,id) WHERE "deletedAt" IS NULL;
CREATE INDEX IF NOT EXISTS lumo_rc_purchases_tenant_date ON "Purchases" ("userId","createdAt" DESC,id DESC);
CREATE INDEX IF NOT EXISTS lumo_rc_serial_product_location ON "SerialUnits" ("userId","productId","locationKey",status);
CREATE INDEX IF NOT EXISTS lumo_rc_journal_currency_date ON "JournalEntries" ("userId",currency,"createdAt" DESC,id DESC);
CREATE INDEX IF NOT EXISTS lumo_rc_receivables_open_due ON "Receivables" ("userId","dueOn") WHERE balance>0;
CREATE INDEX IF NOT EXISTS lumo_rc_receivables_tenant_id ON "Receivables" ("userId",id DESC);
CREATE INDEX IF NOT EXISTS lumo_rc_notifications_inbox ON "Notifications" ("userId",id DESC) WHERE "archivedAt" IS NULL;
