CREATE TABLE IF NOT EXISTS "AccountingLocks"(id serial PRIMARY KEY,"userId" integer NOT NULL,"actorId" integer NOT NULL,through date NOT NULL,note varchar(250) NOT NULL,"createdAt" timestamptz NOT NULL DEFAULT now());
CREATE UNIQUE INDEX IF NOT EXISTS accounting_lock_date ON "AccountingLocks"("userId",through);
CREATE INDEX IF NOT EXISTS journal_debit_date ON "JournalEntries"("userId","debitAccount",currency,"createdAt",id);
CREATE INDEX IF NOT EXISTS journal_credit_date ON "JournalEntries"("userId","creditAccount",currency,"createdAt",id);
CREATE INDEX IF NOT EXISTS journal_cash_session ON "JournalEntries"("userId","cashSessionId");
CREATE TRIGGER lumo_accounting_lock_immutable BEFORE UPDATE OR DELETE ON "AccountingLocks" FOR EACH ROW EXECUTE FUNCTION lumo_guard_support_message();
CREATE OR REPLACE FUNCTION lumo_guard_accounting_period() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN
 PERFORM id FROM "Users" WHERE id=NEW."userId" FOR UPDATE;
 IF EXISTS(SELECT 1 FROM "AccountingLocks" WHERE "userId"=NEW."userId" AND through>= (NEW."createdAt" AT TIME ZONE 'UTC')::date) THEN RAISE EXCEPTION 'Accounting period locked' USING ERRCODE='23514'; END IF;
 RETURN NEW;
END; $$;
CREATE TRIGGER lumo_journal_period_guard BEFORE INSERT ON "JournalEntries" FOR EACH ROW EXECUTE FUNCTION lumo_guard_accounting_period();
