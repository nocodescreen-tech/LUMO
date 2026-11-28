CREATE TABLE IF NOT EXISTS "Receivables"(id serial PRIMARY KEY,"userId" integer NOT NULL,"clientId" integer NOT NULL,"saleId" integer NOT NULL,currency varchar(3) NOT NULL,original numeric(20,2) NOT NULL,balance numeric(20,2) NOT NULL,"dueOn" date,"createdAt" timestamptz NOT NULL DEFAULT now(),"updatedAt" timestamptz NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS "ReceivablePayments"(id serial PRIMARY KEY,"userId" integer NOT NULL,"actorId" integer NOT NULL,"clientId" integer NOT NULL,"receivableId" integer,"cashSessionId" integer NOT NULL,amount numeric(20,2) NOT NULL,currency varchar(3) NOT NULL,kind varchar(20) NOT NULL,note varchar(250) NOT NULL,"createdAt" timestamptz NOT NULL DEFAULT now());
CREATE UNIQUE INDEX IF NOT EXISTS receivable_sale_unique ON "Receivables"("userId","saleId");
CREATE UNIQUE INDEX IF NOT EXISTS receivable_client_identity ON "Receivables"("userId","clientId",id);
CREATE UNIQUE INDEX IF NOT EXISTS receivable_client_owner ON "Clients"("userId",id);
CREATE INDEX IF NOT EXISTS receivable_payment_history ON "ReceivablePayments"("userId","receivableId",id);
DO $$ BEGIN
 IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname='receivable_values') THEN ALTER TABLE "Receivables" ADD CONSTRAINT receivable_values CHECK(original>=0 AND balance>=0 AND balance<=original AND currency IN ('USD','CDF')); END IF;
 IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname='receivable_sale_fk') THEN ALTER TABLE "Receivables" ADD CONSTRAINT receivable_sale_fk FOREIGN KEY("userId","saleId") REFERENCES "Sales"("userId",id) ON DELETE RESTRICT; END IF;
 IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname='receivable_client_fk') THEN ALTER TABLE "Receivables" ADD CONSTRAINT receivable_client_fk FOREIGN KEY("userId","clientId") REFERENCES "Clients"("userId",id) ON DELETE RESTRICT; END IF;
 IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname='receivable_payment_fk') THEN ALTER TABLE "ReceivablePayments" ADD CONSTRAINT receivable_payment_fk FOREIGN KEY("userId","clientId","receivableId") REFERENCES "Receivables"("userId","clientId",id) ON DELETE RESTRICT; END IF;
 IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname='receivable_payment_values') THEN ALTER TABLE "ReceivablePayments" ADD CONSTRAINT receivable_payment_values CHECK(amount>0 AND currency IN ('USD','CDF') AND kind IN ('DEPOSIT','PAYMENT','LEGACY') AND ((kind='LEGACY')=("receivableId" IS NULL))); END IF;
END $$;
CREATE TRIGGER lumo_receivable_payment_immutable BEFORE UPDATE OR DELETE ON "ReceivablePayments" FOR EACH ROW EXECUTE FUNCTION lumo_guard_support_message();
CREATE OR REPLACE FUNCTION lumo_guard_receivable() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF TG_OP='DELETE' THEN RAISE EXCEPTION 'Receivable history immutable'; END IF; IF (to_jsonb(OLD)-'balance'-'updatedAt') IS DISTINCT FROM (to_jsonb(NEW)-'balance'-'updatedAt') THEN RAISE EXCEPTION 'Receivable identity immutable'; END IF; RETURN NEW; END; $$;
CREATE TRIGGER lumo_receivable_guard BEFORE UPDATE OR DELETE ON "Receivables" FOR EACH ROW EXECUTE FUNCTION lumo_guard_receivable();
