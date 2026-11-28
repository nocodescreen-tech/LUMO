CREATE TABLE IF NOT EXISTS "Opportunities"(id serial PRIMARY KEY,"userId" integer NOT NULL,"assigneeId" integer NOT NULL,"actorId" integer NOT NULL,"clientId" integer,title varchar(160) NOT NULL,"contactName" varchar(160) NOT NULL,"contactPhone" varchar(50),"contactEmail" varchar(254),amount numeric(20,2) NOT NULL,currency varchar(3) NOT NULL,stage varchar(24) NOT NULL,"followUpOn" date,version integer NOT NULL DEFAULT 1,"createdAt" timestamptz NOT NULL DEFAULT now(),"updatedAt" timestamptz NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS "OpportunityEvents"(id serial PRIMARY KEY,"userId" integer NOT NULL,"opportunityId" integer NOT NULL,"actorId" integer NOT NULL,kind varchar(24) NOT NULL,note varchar(500) NOT NULL,snapshot jsonb NOT NULL,"createdAt" timestamptz NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS "SalesTargets"(id serial PRIMARY KEY,"userId" integer NOT NULL,"sellerKey" integer NOT NULL,"actorId" integer NOT NULL,month date NOT NULL,currency varchar(3) NOT NULL,amount numeric(20,2) NOT NULL,reason varchar(250) NOT NULL,"createdAt" timestamptz NOT NULL DEFAULT now());
CREATE UNIQUE INDEX IF NOT EXISTS crm_opportunity_tenant ON "Opportunities"("userId",id);
CREATE INDEX IF NOT EXISTS crm_opportunity_scope ON "Opportunities"("userId","assigneeId",stage,"followUpOn");
CREATE INDEX IF NOT EXISTS crm_event_history ON "OpportunityEvents"("userId","opportunityId",id);
CREATE INDEX IF NOT EXISTS crm_target_latest ON "SalesTargets"("userId",month,currency,"sellerKey",id DESC);
ALTER TABLE "Opportunities" ADD CONSTRAINT crm_opportunity_values CHECK(amount>=0 AND currency IN ('USD','CDF') AND stage IN ('NEW','QUALIFIED','PROPOSAL','NEGOTIATION','WON','LOST') AND version>0);
ALTER TABLE "OpportunityEvents" ADD CONSTRAINT crm_event_tenant_fk FOREIGN KEY("userId","opportunityId") REFERENCES "Opportunities"("userId",id) ON DELETE RESTRICT;
ALTER TABLE "OpportunityEvents" ADD CONSTRAINT crm_event_values CHECK(kind IN ('CREATE','UPDATE','MOVE','NOTE'));
ALTER TABLE "SalesTargets" ADD CONSTRAINT crm_target_values CHECK("sellerKey">=0 AND currency IN ('USD','CDF') AND amount>0 AND extract(day from month)=1);
CREATE TRIGGER crm_event_immutable BEFORE UPDATE OR DELETE ON "OpportunityEvents" FOR EACH ROW EXECUTE FUNCTION lumo_guard_support_message();
CREATE TRIGGER crm_target_immutable BEFORE UPDATE OR DELETE ON "SalesTargets" FOR EACH ROW EXECUTE FUNCTION lumo_guard_support_message();
CREATE OR REPLACE FUNCTION lumo_crm_guard() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN
 IF TG_OP='DELETE' THEN RAISE EXCEPTION 'Opportunity cannot be deleted'; END IF;
 IF TG_OP='UPDATE' THEN
  IF OLD."userId"<>NEW."userId" OR OLD."actorId"<>NEW."actorId" OR NEW.version<>OLD.version+1 THEN RAISE EXCEPTION 'Invalid opportunity revision'; END IF;
  IF OLD.stage IN ('WON','LOST') AND (to_jsonb(OLD)-'version'-'updatedAt') IS DISTINCT FROM (to_jsonb(NEW)-'version'-'updatedAt') THEN RAISE EXCEPTION 'Closed opportunity immutable'; END IF;
 END IF;
 IF NOT EXISTS(SELECT 1 FROM "Users" WHERE id=NEW."assigneeId" AND (id=NEW."userId" OR "parentId"=NEW."userId")) THEN RAISE EXCEPTION 'Invalid opportunity assignee'; END IF;
 IF NEW."clientId" IS NOT NULL AND NOT EXISTS(SELECT 1 FROM "Clients" WHERE id=NEW."clientId" AND "userId"=NEW."userId") THEN RAISE EXCEPTION 'Invalid opportunity client'; END IF;
 RETURN NEW;
END; $$;
CREATE TRIGGER crm_opportunity_guard BEFORE INSERT OR UPDATE OR DELETE ON "Opportunities" FOR EACH ROW EXECUTE FUNCTION lumo_crm_guard();
