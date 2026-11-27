-- Existing LUMO schema prerequisite. Run on a backup/staging copy first.
ALTER TABLE "Sales" ALTER COLUMN "montantTotal" TYPE numeric(20,2) USING round("montantTotal"::numeric,2), ALTER COLUMN "remise" TYPE numeric(20,2) USING round("remise"::numeric,2), ALTER COLUMN "profitNet" TYPE numeric(20,2) USING round("profitNet"::numeric,2), ALTER COLUMN "montantRecu" TYPE numeric(20,2) USING round("montantRecu"::numeric,2), ALTER COLUMN "tauxChange" TYPE numeric(20,8) USING round("tauxChange"::numeric,8);
ALTER TABLE "Sales" ADD COLUMN IF NOT EXISTS "accountingCurrency" varchar(3), ADD COLUMN IF NOT EXISTS "cashSessionId" integer;
ALTER TABLE "Purchases" ALTER COLUMN "montantTotal" TYPE numeric(20,2) USING round("montantTotal"::numeric,2);
ALTER TABLE "Purchases" ADD COLUMN IF NOT EXISTS "tauxChange" numeric(20,8), ADD COLUMN IF NOT EXISTS "accountingCurrency" varchar(3);
ALTER TABLE "CashSessions" ADD COLUMN IF NOT EXISTS "currency" varchar(3);
CREATE UNIQUE INDEX IF NOT EXISTS cash_one_open_per_tenant ON "CashSessions" ("userId") WHERE status='OPEN';
CREATE TABLE IF NOT EXISTS "JournalEntries" (id serial PRIMARY KEY,"userId" integer NOT NULL,"actorId" integer NOT NULL,event varchar(40) NOT NULL,reference varchar(100) NOT NULL,"debitAccount" varchar(40) NOT NULL,"creditAccount" varchar(40) NOT NULL,amount numeric(20,2) NOT NULL CHECK(amount>=0),currency varchar(3) NOT NULL CHECK(currency IN ('USD','CDF')),"cashSessionId" integer,rate numeric(20,8),"createdAt" timestamptz NOT NULL DEFAULT now(),CHECK("debitAccount"<>"creditAccount"));
CREATE UNIQUE INDEX IF NOT EXISTS journal_unique_posting ON "JournalEntries"("userId",event,reference,"debitAccount","creditAccount");
CREATE INDEX IF NOT EXISTS journal_tenant_date ON "JournalEntries"("userId","createdAt");
CREATE TABLE IF NOT EXISTS "OperationReceipts" (id serial PRIMARY KEY,"userId" integer NOT NULL,"actorId" integer NOT NULL,operation varchar(50) NOT NULL,key varchar(128) NOT NULL,fingerprint varchar(64) NOT NULL,"resourceId" integer NOT NULL,"createdAt" timestamptz NOT NULL DEFAULT now());
CREATE UNIQUE INDEX IF NOT EXISTS operation_unique_key ON "OperationReceipts"("userId",operation,key);
