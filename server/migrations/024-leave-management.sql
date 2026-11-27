CREATE TABLE IF NOT EXISTS "LeaveRequests"(id serial PRIMARY KEY,"userId" integer NOT NULL,"staffId" integer NOT NULL,kind varchar(24) NOT NULL,"startsOn" date NOT NULL,"endsOn" date NOT NULL,note varchar(250) NOT NULL,status varchar(16) NOT NULL,"decidedBy" integer,"createdAt" timestamptz NOT NULL DEFAULT now(),"updatedAt" timestamptz NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS "LeaveEvents"(id serial PRIMARY KEY,"userId" integer NOT NULL,"requestId" integer NOT NULL,"actorId" integer NOT NULL,kind varchar(16) NOT NULL,reason varchar(250) NOT NULL,"createdAt" timestamptz NOT NULL DEFAULT now());
CREATE UNIQUE INDEX IF NOT EXISTS leave_tenant_identity ON "LeaveRequests"("userId",id);
CREATE INDEX IF NOT EXISTS leave_calendar ON "LeaveRequests"("userId",status,"startsOn","endsOn");
CREATE INDEX IF NOT EXISTS leave_staff_scope ON "LeaveRequests"("userId","staffId",id);
CREATE INDEX IF NOT EXISTS leave_event_history ON "LeaveEvents"("userId","requestId",id);
ALTER TABLE "LeaveRequests" ADD CONSTRAINT leave_values CHECK(kind IN ('ANNUAL','PERSONAL','SICK','FAMILY','OTHER') AND "endsOn">="startsOn" AND "endsOn"-"startsOn"<366 AND status IN ('PENDING','APPROVED','REJECTED','CANCELLED') AND ("decidedBy" IS NULL OR "decidedBy"<>"staffId") AND (status NOT IN ('APPROVED','REJECTED') OR "decidedBy" IS NOT NULL) AND (status<>'PENDING' OR "decidedBy" IS NULL));
ALTER TABLE "LeaveEvents" ADD CONSTRAINT leave_event_request_fk FOREIGN KEY("userId","requestId") REFERENCES "LeaveRequests"("userId",id) ON DELETE RESTRICT;
ALTER TABLE "LeaveEvents" ADD CONSTRAINT leave_event_kind CHECK(kind IN ('SUBMIT','APPROVE','REJECT','CANCEL'));
CREATE TRIGGER leave_request_tenant BEFORE INSERT ON "LeaveRequests" FOR EACH ROW EXECUTE FUNCTION lumo_guard_hr_tenant();
CREATE TRIGGER leave_event_immutable BEFORE UPDATE OR DELETE ON "LeaveEvents" FOR EACH ROW EXECUTE FUNCTION lumo_guard_support_message();
CREATE OR REPLACE FUNCTION lumo_leave_request_guard() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN
 IF TG_OP='DELETE' THEN RAISE EXCEPTION 'Leave request immutable'; END IF;
 IF (to_jsonb(OLD)-'status'-'decidedBy'-'updatedAt') IS DISTINCT FROM (to_jsonb(NEW)-'status'-'decidedBy'-'updatedAt') THEN RAISE EXCEPTION 'Leave terms immutable'; END IF;
 IF NOT ((OLD.status='PENDING' AND NEW.status IN ('APPROVED','REJECTED','CANCELLED')) OR (OLD.status='APPROVED' AND NEW.status='CANCELLED')) THEN RAISE EXCEPTION 'Invalid leave transition'; END IF;
 IF OLD."decidedBy" IS NOT NULL AND OLD."decidedBy" IS DISTINCT FROM NEW."decidedBy" THEN RAISE EXCEPTION 'Leave decision immutable'; END IF;
 RETURN NEW;
END; $$;
CREATE TRIGGER leave_request_immutable BEFORE UPDATE OR DELETE ON "LeaveRequests" FOR EACH ROW EXECUTE FUNCTION lumo_leave_request_guard();
