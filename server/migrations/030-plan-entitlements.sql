CREATE TABLE IF NOT EXISTS "PlanEntitlements"(id serial PRIMARY KEY,plan varchar(32) NOT NULL,"actorId" integer NOT NULL,enforced boolean NOT NULL,"aiLimit" integer NOT NULL,"crmCreate" boolean NOT NULL,reason varchar(250) NOT NULL,"createdAt" timestamptz NOT NULL DEFAULT now());
ALTER TABLE "PlanEntitlements" ADD CONSTRAINT plan_entitlement_values CHECK(plan IN ('TRIAL','STARTER','BUSINESS','PRO','ENTERPRISE') AND "aiLimit" BETWEEN 0 AND 100000);
CREATE INDEX IF NOT EXISTS plan_entitlement_latest ON "PlanEntitlements"(plan,id DESC);
CREATE TRIGGER plan_entitlement_immutable BEFORE UPDATE OR DELETE ON "PlanEntitlements" FOR EACH ROW EXECUTE FUNCTION lumo_guard_support_message();
CREATE TABLE IF NOT EXISTS "AiMonthlyUsage"("userId" integer NOT NULL,month date NOT NULL,count bigint NOT NULL DEFAULT 0,PRIMARY KEY("userId",month),CHECK(count>=0),CHECK(extract(day from month)=1));
