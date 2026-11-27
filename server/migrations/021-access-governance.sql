CREATE TABLE IF NOT EXISTS "AccessRevisions"(id serial PRIMARY KEY,"userId" integer NOT NULL,"staffId" integer NOT NULL,"actorId" integer NOT NULL,kind varchar(16) NOT NULL,before jsonb,after jsonb NOT NULL,reason varchar(250) NOT NULL,"createdAt" timestamptz NOT NULL DEFAULT now());
CREATE INDEX IF NOT EXISTS access_revision_history ON "AccessRevisions"("userId","staffId",id DESC);
ALTER TABLE "AccessRevisions" ADD CONSTRAINT access_revision_kind CHECK(kind IN ('CREATE','UPDATE'));
CREATE TRIGGER lumo_access_revision_tenant BEFORE INSERT ON "AccessRevisions" FOR EACH ROW EXECUTE FUNCTION lumo_guard_hr_tenant();
CREATE TRIGGER lumo_access_revision_immutable BEFORE UPDATE OR DELETE ON "AccessRevisions" FOR EACH ROW EXECUTE FUNCTION lumo_guard_support_message();
