CREATE TABLE IF NOT EXISTS "SaasPrices"(id serial PRIMARY KEY,plan varchar(32) NOT NULL,currency varchar(3) NOT NULL,days integer NOT NULL,amount numeric(20,2) NOT NULL,enabled boolean NOT NULL,"actorId" integer NOT NULL,reason varchar(250) NOT NULL,"createdAt" timestamptz NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS "SaasInvoices"(id serial PRIMARY KEY,"organizationId" integer NOT NULL,"ownerId" integer NOT NULL,"priceId" integer NOT NULL,"actorId" integer NOT NULL,plan varchar(32) NOT NULL,currency varchar(3) NOT NULL,days integer NOT NULL,amount numeric(20,2) NOT NULL,status varchar(16) NOT NULL,"dueOn" date NOT NULL,reference varchar(100) NOT NULL UNIQUE,reason varchar(250) NOT NULL,"createdAt" timestamptz NOT NULL DEFAULT now(),"updatedAt" timestamptz NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS "SaasPayments"(id serial PRIMARY KEY,"invoiceId" integer NOT NULL UNIQUE,"organizationId" integer NOT NULL,"ownerId" integer NOT NULL,"actorId" integer NOT NULL,amount numeric(20,2) NOT NULL,currency varchar(3) NOT NULL,method varchar(24) NOT NULL,"externalReference" varchar(100) NOT NULL,note varchar(250) NOT NULL,"periodStart" timestamptz NOT NULL,"periodEnd" timestamptz NOT NULL,"createdAt" timestamptz NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS "SaasInvoiceEvents"(id serial PRIMARY KEY,"invoiceId" integer NOT NULL,"ownerId" integer NOT NULL,"actorId" integer NOT NULL,kind varchar(16) NOT NULL,reason varchar(250) NOT NULL,"createdAt" timestamptz NOT NULL DEFAULT now());
CREATE UNIQUE INDEX IF NOT EXISTS saas_payment_ref ON "SaasPayments"(method,"externalReference");
CREATE UNIQUE INDEX IF NOT EXISTS saas_open_invoice ON "SaasInvoices"("ownerId") WHERE status='ISSUED';
CREATE UNIQUE INDEX IF NOT EXISTS saas_invoice_tenant ON "SaasInvoices"("ownerId",id);
ALTER TABLE "SaasPrices" ADD CONSTRAINT saas_price_values CHECK(plan IN ('STARTER','BUSINESS','PRO','ENTERPRISE') AND currency IN ('CDF','USD') AND days IN (30,365) AND amount>0 AND (currency<>'CDF' OR amount=trunc(amount)));
ALTER TABLE "SaasInvoices" ADD CONSTRAINT saas_invoice_values CHECK(status IN ('ISSUED','PAID','VOID') AND amount>0 AND currency IN ('CDF','USD') AND days IN (30,365));
ALTER TABLE "SaasInvoices" ADD CONSTRAINT saas_invoice_price FOREIGN KEY("priceId") REFERENCES "SaasPrices"(id);
ALTER TABLE "SaasPayments" ADD CONSTRAINT saas_payment_invoice FOREIGN KEY("ownerId","invoiceId") REFERENCES "SaasInvoices"("ownerId",id);
ALTER TABLE "SaasPayments" ADD CONSTRAINT saas_payment_values CHECK(amount>0 AND currency IN ('USD','CDF') AND "periodEnd">"periodStart" AND method IN ('BANK','MOBILE_MONEY','CASH','OTHER'));
ALTER TABLE "SaasInvoiceEvents" ADD CONSTRAINT saas_event_invoice FOREIGN KEY("ownerId","invoiceId") REFERENCES "SaasInvoices"("ownerId",id);
ALTER TABLE "SaasInvoiceEvents" ADD CONSTRAINT saas_event_values CHECK(kind IN ('ISSUE','PAY','VOID'));
CREATE TRIGGER saas_price_immutable BEFORE UPDATE OR DELETE ON "SaasPrices" FOR EACH ROW EXECUTE FUNCTION lumo_guard_support_message();
CREATE TRIGGER saas_payment_immutable BEFORE UPDATE OR DELETE ON "SaasPayments" FOR EACH ROW EXECUTE FUNCTION lumo_guard_support_message();
CREATE TRIGGER saas_event_immutable BEFORE UPDATE OR DELETE ON "SaasInvoiceEvents" FOR EACH ROW EXECUTE FUNCTION lumo_guard_support_message();
CREATE OR REPLACE FUNCTION lumo_saas_invoice_guard() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN
 IF TG_OP='DELETE' THEN RAISE EXCEPTION 'Invoice immutable'; END IF;
 IF TG_OP='INSERT' THEN
 IF NEW.status<>'ISSUED' OR NOT EXISTS(SELECT 1 FROM "Organizations" o WHERE o.id=NEW."organizationId" AND o."ownerId"=NEW."ownerId") OR NOT EXISTS(SELECT 1 FROM "SaasPrices" p WHERE p.id=NEW."priceId" AND p.plan=NEW.plan AND p.currency=NEW.currency AND p.days=NEW.days AND p.amount=NEW.amount AND p.enabled) THEN RAISE EXCEPTION 'Invalid invoice terms'; END IF;
 ELSE
 IF OLD.status<>'ISSUED' OR NEW.status NOT IN ('PAID','VOID') OR (to_jsonb(OLD)-'status'-'updatedAt') IS DISTINCT FROM (to_jsonb(NEW)-'status'-'updatedAt') THEN RAISE EXCEPTION 'Invalid invoice transition'; END IF;
 IF NEW.status='PAID' AND NOT EXISTS(SELECT 1 FROM "SaasPayments" p WHERE p."invoiceId"=NEW.id AND p."ownerId"=NEW."ownerId" AND p."organizationId"=NEW."organizationId" AND p.currency=NEW.currency AND p.amount=NEW.amount) THEN RAISE EXCEPTION 'Missing matching receipt'; END IF;
 END IF;
 RETURN NEW;
END; $$;
CREATE TRIGGER saas_invoice_guard BEFORE INSERT OR UPDATE OR DELETE ON "SaasInvoices" FOR EACH ROW EXECUTE FUNCTION lumo_saas_invoice_guard();
