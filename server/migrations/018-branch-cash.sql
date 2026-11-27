ALTER TABLE "CashSessions" ADD COLUMN IF NOT EXISTS "branchKey" integer NOT NULL DEFAULT 0;
ALTER TABLE "CashSessions" ADD COLUMN IF NOT EXISTS "openedBy" integer;
ALTER TABLE "CashSessions" ADD COLUMN IF NOT EXISTS "closedBy" integer;
DROP INDEX IF EXISTS cash_one_open_per_tenant;
CREATE UNIQUE INDEX IF NOT EXISTS cash_one_open_per_branch ON "CashSessions"("userId","branchKey") WHERE status='OPEN';
CREATE INDEX IF NOT EXISTS cash_branch_history ON "CashSessions"("userId","branchKey",id);
ALTER TABLE "CashSessions" ADD CONSTRAINT cash_branch_nonnegative CHECK("branchKey">=0);
CREATE OR REPLACE FUNCTION lumo_cash_branch_guard() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN
 IF TG_OP='UPDATE' THEN
  IF (OLD."userId",OLD."branchKey",OLD."openedBy") IS DISTINCT FROM (NEW."userId",NEW."branchKey",NEW."openedBy") THEN RAISE EXCEPTION 'Cash session identity immutable'; END IF;
  IF OLD.status='CLOSED' THEN RAISE EXCEPTION 'Closed cash session immutable'; END IF;
 END IF;
 IF NEW."branchKey">0 AND NOT EXISTS(SELECT 1 FROM "Branches" b JOIN "Organizations" o ON o.id=b."organizationId" WHERE b.id=NEW."branchKey" AND o."ownerId"=NEW."userId") THEN RAISE EXCEPTION 'Invalid cash branch'; END IF;
 RETURN NEW;
END; $$;
CREATE TRIGGER lumo_cash_branch_identity BEFORE INSERT OR UPDATE ON "CashSessions" FOR EACH ROW EXECUTE FUNCTION lumo_cash_branch_guard();
