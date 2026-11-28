ALTER TABLE "Purchases" ADD COLUMN IF NOT EXISTS "approvalState" varchar(16), ADD COLUMN IF NOT EXISTS "requestedBy" integer, ADD COLUMN IF NOT EXISTS "decidedBy" integer, ADD COLUMN IF NOT EXISTS "decisionReason" varchar(250), ADD COLUMN IF NOT EXISTS "decidedAt" timestamptz;
ALTER TABLE "Purchases" ADD CONSTRAINT purchase_approval_state CHECK (
 ("approvalState" IS NULL AND "requestedBy" IS NULL AND "decidedBy" IS NULL AND "decisionReason" IS NULL AND "decidedAt" IS NULL)
 OR ("approvalState" IS NOT NULL AND "requestedBy" IS NOT NULL AND
 (("approvalState"='PENDING' AND statut IS NOT NULL AND statut='En attente' AND "decidedBy" IS NULL AND "decisionReason" IS NULL AND "decidedAt" IS NULL)
 OR ("approvalState" IN ('APPROVED','REJECTED') AND "decidedBy" IS NOT NULL AND "decidedBy"<>"requestedBy" AND "decisionReason" IS NOT NULL AND length(trim("decisionReason"))>0 AND "decidedAt" IS NOT NULL AND ("approvalState"='APPROVED' OR (statut IS NOT NULL AND statut='En attente'))))));
CREATE INDEX IF NOT EXISTS purchase_approval_queue ON "Purchases"("userId","approvalState",id);
CREATE OR REPLACE FUNCTION lumo_purchase_approval_guard() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN
 IF OLD."approvalState" IS NULL THEN
  IF TG_OP='UPDATE' AND NEW."approvalState" IS NOT NULL THEN RAISE EXCEPTION 'Cannot retroactively create purchase approval'; END IF;
  IF TG_OP='DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
 END IF;
 IF TG_OP='DELETE' THEN RAISE EXCEPTION 'Approved purchase record immutable'; END IF;
 IF (to_jsonb(OLD)-'approvalState'-'decidedBy'-'decisionReason'-'decidedAt'-'updatedAt'-'statut'-'articles') IS DISTINCT FROM (to_jsonb(NEW)-'approvalState'-'decidedBy'-'decisionReason'-'decidedAt'-'updatedAt'-'statut'-'articles') THEN RAISE EXCEPTION 'Purchase terms immutable'; END IF;
 IF OLD."approvalState"='PENDING' THEN
  IF NEW."approvalState" IS NULL OR NEW."approvalState" NOT IN ('APPROVED','REJECTED') OR OLD.articles IS DISTINCT FROM NEW.articles OR OLD.statut IS DISTINCT FROM NEW.statut THEN RAISE EXCEPTION 'Invalid purchase decision'; END IF;
 ELSE
  IF (OLD."approvalState",OLD."decidedBy",OLD."decisionReason",OLD."decidedAt") IS DISTINCT FROM (NEW."approvalState",NEW."decidedBy",NEW."decisionReason",NEW."decidedAt") THEN RAISE EXCEPTION 'Purchase decision immutable'; END IF;
  IF OLD."approvalState"='REJECTED' THEN RAISE EXCEPTION 'Rejected purchase immutable'; END IF;
 END IF;
 RETURN NEW;
END; $$;
CREATE TRIGGER lumo_purchase_approval_immutable BEFORE UPDATE OR DELETE ON "Purchases" FOR EACH ROW EXECUTE FUNCTION lumo_purchase_approval_guard();
