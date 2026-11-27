CREATE TABLE IF NOT EXISTS "CommercialDocuments"(id serial PRIMARY KEY,"userId" integer NOT NULL,"actorId" integer NOT NULL,type varchar(16) NOT NULL,number varchar(32) NOT NULL,status varchar(24) NOT NULL,"clientId" integer,"saleId" integer,"quoteId" integer,"warehouseId" integer,currency varchar(3) NOT NULL,rate numeric(20,8) NOT NULL,total numeric(20,2) NOT NULL,lines jsonb NOT NULL,customer jsonb NOT NULL,issuer jsonb NOT NULL,"validUntil" date,note text,"createdAt" timestamptz NOT NULL DEFAULT now(),"updatedAt" timestamptz NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS "DocumentEvents"(id serial PRIMARY KEY,"userId" integer NOT NULL,"documentId" integer NOT NULL,"actorId" integer NOT NULL,kind varchar(24) NOT NULL,note text NOT NULL,"createdAt" timestamptz NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS "DocumentSequences"(id serial PRIMARY KEY,"userId" integer NOT NULL,type varchar(16) NOT NULL,year integer NOT NULL,"lastNumber" integer NOT NULL,"createdAt" timestamptz NOT NULL DEFAULT now(),"updatedAt" timestamptz NOT NULL DEFAULT now());
CREATE UNIQUE INDEX IF NOT EXISTS doc_number_unique ON "CommercialDocuments"("userId",number);
CREATE UNIQUE INDEX IF NOT EXISTS doc_owner_id ON "CommercialDocuments"("userId",id);
CREATE UNIQUE INDEX IF NOT EXISTS doc_sale_type_unique ON "CommercialDocuments"("userId",type,"saleId") WHERE "saleId" IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS doc_sequence_unique ON "DocumentSequences"("userId",type,year);
CREATE UNIQUE INDEX IF NOT EXISTS doc_sale_owner_id ON "Sales"("userId",id);
DO $$ BEGIN
 IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname='commercial_document_values') THEN ALTER TABLE "CommercialDocuments" ADD CONSTRAINT commercial_document_values CHECK(type IN ('QUOTE','INVOICE','DELIVERY') AND currency IN ('USD','CDF') AND total>=0 AND rate>0 AND ((type='QUOTE' AND status IN ('DRAFT','ISSUED','ACCEPTED','DECLINED','CANCELLED','CONVERTED') AND "validUntil" IS NOT NULL AND ((status='CONVERTED')=("saleId" IS NOT NULL))) OR (type IN ('INVOICE','DELIVERY') AND status='ISSUED' AND "saleId" IS NOT NULL))); END IF;
 IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname='commercial_document_sale_fk') THEN ALTER TABLE "CommercialDocuments" ADD CONSTRAINT commercial_document_sale_fk FOREIGN KEY("userId","saleId") REFERENCES "Sales"("userId",id) ON DELETE RESTRICT; END IF;
 IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname='commercial_document_quote_fk') THEN ALTER TABLE "CommercialDocuments" ADD CONSTRAINT commercial_document_quote_fk FOREIGN KEY("userId","quoteId") REFERENCES "CommercialDocuments"("userId",id) ON DELETE RESTRICT; END IF;
 IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname='document_event_owner_fk') THEN ALTER TABLE "DocumentEvents" ADD CONSTRAINT document_event_owner_fk FOREIGN KEY("userId","documentId") REFERENCES "CommercialDocuments"("userId",id) ON DELETE RESTRICT; END IF;
END $$;
CREATE OR REPLACE FUNCTION lumo_guard_commercial_document() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN
 IF TG_OP='DELETE' THEN RAISE EXCEPTION 'Commercial document history cannot be deleted'; END IF;
 IF OLD.type<>'QUOTE' OR OLD.status IN ('CONVERTED','CANCELLED','DECLINED') THEN RAISE EXCEPTION 'Document immutable'; END IF;
 IF (to_jsonb(OLD)-'status'-'saleId'-'updatedAt') IS DISTINCT FROM (to_jsonb(NEW)-'status'-'saleId'-'updatedAt') THEN RAISE EXCEPTION 'Document snapshot immutable'; END IF;
 IF NOT ((OLD.status='DRAFT' AND NEW.status IN ('ISSUED','CANCELLED')) OR (OLD.status='ISSUED' AND NEW.status IN ('ACCEPTED','DECLINED','CANCELLED')) OR (OLD.status='ACCEPTED' AND NEW.status IN ('CONVERTED','CANCELLED'))) THEN RAISE EXCEPTION 'Invalid document transition'; END IF;
 RETURN NEW;
END; $$;
CREATE TRIGGER lumo_commercial_document_guard BEFORE UPDATE OR DELETE ON "CommercialDocuments" FOR EACH ROW EXECUTE FUNCTION lumo_guard_commercial_document();
CREATE TRIGGER lumo_document_event_immutable BEFORE UPDATE OR DELETE ON "DocumentEvents" FOR EACH ROW EXECUTE FUNCTION lumo_guard_support_message();
