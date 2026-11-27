CREATE TABLE IF NOT EXISTS "StaffAssignments"(id serial PRIMARY KEY,"userId" integer NOT NULL,"staffId" integer NOT NULL,"actorId" integer NOT NULL,"warehouseId" integer,"branchId" integer,reason varchar(250) NOT NULL,"createdAt" timestamptz NOT NULL DEFAULT now());
CREATE INDEX IF NOT EXISTS staff_assignment_latest ON "StaffAssignments"("userId","staffId",id DESC);
ALTER TABLE "StaffAssignments" ADD CONSTRAINT staff_assignment_location CHECK(("warehouseId" IS NULL)=("branchId" IS NULL));
CREATE TRIGGER lumo_staff_assignment_immutable BEFORE UPDATE OR DELETE ON "StaffAssignments" FOR EACH ROW EXECUTE FUNCTION lumo_guard_support_message();
