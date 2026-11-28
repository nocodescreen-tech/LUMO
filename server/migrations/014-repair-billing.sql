CREATE TABLE IF NOT EXISTS "RepairBills"(id serial PRIMARY KEY,"userId" integer NOT NULL,"orderId" integer NOT NULL,currency varchar(3) NOT NULL,"estimateCurrency" varchar(3) NOT NULL,estimate numeric(20,2) NOT NULL,rate numeric(20,8) NOT NULL,total numeric(20,2) NOT NULL,paid numeric(20,2) NOT NULL,status varchar(16) NOT NULL DEFAULT 'ADVANCE',number varchar(32),"issuedAt" timestamptz,issuer jsonb NOT NULL,customer jsonb NOT NULL,"createdAt" timestamptz NOT NULL DEFAULT now(),"updatedAt" timestamptz NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS "RepairPayments"(id serial PRIMARY KEY,"userId" integer NOT NULL,"billId" integer NOT NULL,"actorId" integer NOT NULL,"cashSessionId" integer NOT NULL,kind varchar(16) NOT NULL,amount numeric(20,2) NOT NULL,currency varchar(3) NOT NULL,"reversalOf" integer,note varchar(250) NOT NULL,"createdAt" timestamptz NOT NULL DEFAULT now());
CREATE UNIQUE INDEX IF NOT EXISTS repair_bill_order ON "RepairBills"("userId","orderId");
CREATE UNIQUE INDEX IF NOT EXISTS repair_bill_number ON "RepairBills"("userId",number);
CREATE UNIQUE INDEX IF NOT EXISTS repair_bill_identity ON "RepairBills"("userId",id);
CREATE UNIQUE INDEX IF NOT EXISTS repair_payment_identity ON "RepairPayments"("userId","billId",id);
CREATE UNIQUE INDEX IF NOT EXISTS repair_payment_reversal ON "RepairPayments"("userId","reversalOf");
DO $$ BEGIN
 IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname='repair_bill_values') THEN ALTER TABLE "RepairBills" ADD CONSTRAINT repair_bill_values CHECK(currency IN ('USD','CDF') AND "estimateCurrency" IN ('USD','CDF') AND rate>0 AND estimate>=0 AND total>=0 AND paid>=0 AND paid<=total AND status IN ('ADVANCE','ISSUED') AND ((status='ISSUED')=(number IS NOT NULL)) AND ((status='ISSUED')=("issuedAt" IS NOT NULL))); END IF;
 IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname='repair_bill_order_fk') THEN ALTER TABLE "RepairBills" ADD CONSTRAINT repair_bill_order_fk FOREIGN KEY("userId","orderId") REFERENCES "RepairOrders"("userId",id) ON DELETE RESTRICT; END IF;
 IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname='repair_payment_bill_fk') THEN ALTER TABLE "RepairPayments" ADD CONSTRAINT repair_payment_bill_fk FOREIGN KEY("userId","billId") REFERENCES "RepairBills"("userId",id) ON DELETE RESTRICT; END IF;
 IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname='repair_payment_reversal_fk') THEN ALTER TABLE "RepairPayments" ADD CONSTRAINT repair_payment_reversal_fk FOREIGN KEY("userId","billId","reversalOf") REFERENCES "RepairPayments"("userId","billId",id) ON DELETE RESTRICT; END IF;
 IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname='repair_payment_values') THEN ALTER TABLE "RepairPayments" ADD CONSTRAINT repair_payment_values CHECK(currency IN ('USD','CDF') AND amount>0 AND kind IN ('DEPOSIT','PAYMENT','REVERSAL') AND ((kind='REVERSAL')=("reversalOf" IS NOT NULL))); END IF;
END $$;
CREATE OR REPLACE FUNCTION lumo_guard_repair_bill() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN
 IF TG_OP='DELETE' THEN RAISE EXCEPTION 'Repair bill immutable'; END IF;
 IF (to_jsonb(OLD)-'paid'-'status'-'number'-'issuedAt'-'updatedAt') IS DISTINCT FROM (to_jsonb(NEW)-'paid'-'status'-'number'-'issuedAt'-'updatedAt') THEN RAISE EXCEPTION 'Repair billing snapshot immutable'; END IF;
 IF OLD.status='ISSUED' AND (OLD.status,OLD.number,OLD."issuedAt") IS DISTINCT FROM (NEW.status,NEW.number,NEW."issuedAt") THEN RAISE EXCEPTION 'Issued repair invoice immutable'; END IF;
 RETURN NEW;
END; $$;
CREATE TRIGGER lumo_repair_bill_guard BEFORE UPDATE OR DELETE ON "RepairBills" FOR EACH ROW EXECUTE FUNCTION lumo_guard_repair_bill();
CREATE TRIGGER lumo_repair_payment_immutable BEFORE UPDATE OR DELETE ON "RepairPayments" FOR EACH ROW EXECUTE FUNCTION lumo_guard_support_message();
