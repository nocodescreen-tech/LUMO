CREATE TABLE IF NOT EXISTS "StaffProfileRevisions"(id serial PRIMARY KEY,"userId" integer NOT NULL,"staffId" integer NOT NULL,"actorId" integer NOT NULL,"jobTitle" varchar(120) NOT NULL,department varchar(120) NOT NULL,"contractType" varchar(24) NOT NULL,"hiredOn" date,reason varchar(250) NOT NULL,"createdAt" timestamptz NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS "AttendanceRevisions"(id serial PRIMARY KEY,"userId" integer NOT NULL,"staffId" integer NOT NULL,"actorId" integer NOT NULL,day date NOT NULL,status varchar(24) NOT NULL,"workedMinutes" integer,"branchKey" integer,reason varchar(250) NOT NULL,"createdAt" timestamptz NOT NULL DEFAULT now());
CREATE INDEX IF NOT EXISTS hr_profile_history ON "StaffProfileRevisions"("userId","staffId",id DESC);
CREATE INDEX IF NOT EXISTS hr_attendance_history ON "AttendanceRevisions"("userId",day,"staffId",id DESC);
ALTER TABLE "StaffProfileRevisions" ADD CONSTRAINT hr_contract_values CHECK("contractType" IN ('UNSPECIFIED','PERMANENT','FIXED_TERM','INTERN','OTHER'));
ALTER TABLE "AttendanceRevisions" ADD CONSTRAINT hr_attendance_values CHECK(status IN ('PRESENT','ABSENT','LEAVE','REST','UNRECORDED') AND ("workedMinutes" IS NULL OR (status='PRESENT' AND "workedMinutes" BETWEEN 0 AND 1440)) AND ("branchKey" IS NULL OR "branchKey">=0));
CREATE OR REPLACE FUNCTION lumo_guard_hr_tenant() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN
 IF NOT EXISTS(SELECT 1 FROM "Users" WHERE id=NEW."staffId" AND "parentId"=NEW."userId") THEN RAISE EXCEPTION 'Invalid HR tenant'; END IF;
 RETURN NEW;
END; $$;
CREATE TRIGGER lumo_hr_profile_tenant BEFORE INSERT ON "StaffProfileRevisions" FOR EACH ROW EXECUTE FUNCTION lumo_guard_hr_tenant();
CREATE TRIGGER lumo_hr_attendance_tenant BEFORE INSERT ON "AttendanceRevisions" FOR EACH ROW EXECUTE FUNCTION lumo_guard_hr_tenant();
CREATE TRIGGER lumo_hr_profile_immutable BEFORE UPDATE OR DELETE ON "StaffProfileRevisions" FOR EACH ROW EXECUTE FUNCTION lumo_guard_support_message();
CREATE TRIGGER lumo_hr_attendance_immutable BEFORE UPDATE OR DELETE ON "AttendanceRevisions" FOR EACH ROW EXECUTE FUNCTION lumo_guard_support_message();
