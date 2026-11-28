ALTER TABLE "ExpensePolicies" ADD COLUMN IF NOT EXISTS "dualThreshold" numeric(20,2);
ALTER TABLE "ExpenseRequests" ADD COLUMN IF NOT EXISTS "dualRequired" boolean NOT NULL DEFAULT false, ADD COLUMN IF NOT EXISTS "reviewedBy" integer;
ALTER TABLE "ExpensePolicies" ADD CONSTRAINT expense_dual_policy_values CHECK("dualThreshold" IS NULL OR (threshold IS NOT NULL AND "dualThreshold">=threshold));
ALTER TABLE "ExpenseRequests" ADD CONSTRAINT expense_dual_request_values CHECK(("reviewedBy" IS NULL OR ("reviewedBy"<>"requesterId" AND ("approvedBy" IS NULL OR "reviewedBy"<>"approvedBy"))) AND (NOT "dualRequired" OR status NOT IN ('APPROVED','PAID') OR "reviewedBy" IS NOT NULL));
ALTER TABLE "ExpenseRequestEvents" DROP CONSTRAINT expense_request_event_kind;
ALTER TABLE "ExpenseRequestEvents" ADD CONSTRAINT expense_request_event_kind CHECK(kind IN ('SUBMIT','REVIEW','APPROVE','REJECT','CANCEL','PAY'));
CREATE OR REPLACE FUNCTION lumo_expense_request_guard() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN
 IF TG_OP='DELETE' THEN RAISE EXCEPTION 'Expense request immutable'; END IF;
 IF (to_jsonb(OLD)-'status'-'approvedBy'-'expenseId'-'reviewedBy'-'updatedAt') IS DISTINCT FROM (to_jsonb(NEW)-'status'-'approvedBy'-'expenseId'-'reviewedBy'-'updatedAt') THEN RAISE EXCEPTION 'Expense request terms immutable'; END IF;
 IF OLD."reviewedBy" IS DISTINCT FROM NEW."reviewedBy" THEN
  IF OLD."reviewedBy" IS NOT NULL OR NEW."reviewedBy" IS NULL OR OLD.status<>'PENDING' OR NEW.status<>'PENDING' OR OLD."approvedBy" IS DISTINCT FROM NEW."approvedBy" OR OLD."expenseId" IS DISTINCT FROM NEW."expenseId" THEN RAISE EXCEPTION 'Invalid expense review'; END IF;
  IF NOT EXISTS(SELECT 1 FROM "Users" WHERE id=NEW."reviewedBy" AND "parentId"=NEW."userId") THEN RAISE EXCEPTION 'Invalid review tenant'; END IF;
 ELSE
  IF NOT ((OLD.status='PENDING' AND NEW.status IN ('APPROVED','REJECTED','CANCELLED')) OR (OLD.status='APPROVED' AND NEW.status IN ('PAID','CANCELLED'))) THEN RAISE EXCEPTION 'Invalid expense request transition'; END IF;
 END IF;
 IF OLD."approvedBy" IS NOT NULL AND OLD."approvedBy" IS DISTINCT FROM NEW."approvedBy" THEN RAISE EXCEPTION 'Approval immutable'; END IF;
 RETURN NEW;
END; $$;
