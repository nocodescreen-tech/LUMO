CREATE TABLE IF NOT EXISTS "SerialUnits"(id serial PRIMARY KEY,"userId" integer NOT NULL,"productId" integer NOT NULL,"locationKey" integer NOT NULL,serial varchar(100) NOT NULL,imei varchar(15),status varchar(16) NOT NULL DEFAULT 'AVAILABLE',"warrantyDays" integer NOT NULL DEFAULT 0,"saleId" integer,"createdAt" timestamptz NOT NULL DEFAULT now(),"updatedAt" timestamptz NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS "SerialEvents"(id serial PRIMARY KEY,"userId" integer NOT NULL,"actorId" integer NOT NULL,"productId" integer NOT NULL,"unitId" integer NOT NULL,kind varchar(24) NOT NULL,"fromLocation" integer,"toLocation" integer,"saleId" integer,"warrantyUntil" date,reason varchar(250) NOT NULL,"createdAt" timestamptz NOT NULL DEFAULT now());
CREATE UNIQUE INDEX IF NOT EXISTS serial_tenant_code ON "SerialUnits"("userId",serial);
CREATE UNIQUE INDEX IF NOT EXISTS serial_tenant_imei ON "SerialUnits"("userId",imei);
CREATE UNIQUE INDEX IF NOT EXISTS serial_tenant_product_id ON "SerialUnits"("userId","productId",id);
CREATE INDEX IF NOT EXISTS serial_location_stock ON "SerialUnits"("userId","productId","locationKey",status);
DO $$ BEGIN
 IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname='serial_unit_values') THEN ALTER TABLE "SerialUnits" ADD CONSTRAINT serial_unit_values CHECK("locationKey">=0 AND "warrantyDays" BETWEEN 0 AND 3650 AND status IN ('AVAILABLE','SOLD','QUARANTINE') AND ((status='SOLD')=("saleId" IS NOT NULL)) AND (imei IS NULL OR imei ~ '^[0-9]{15}$')); END IF;
 IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname='serial_product_owner_fk') THEN ALTER TABLE "SerialUnits" ADD CONSTRAINT serial_product_owner_fk FOREIGN KEY("userId","productId") REFERENCES "Products"("userId",id) ON DELETE RESTRICT; END IF;
 IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname='serial_event_unit_fk') THEN ALTER TABLE "SerialEvents" ADD CONSTRAINT serial_event_unit_fk FOREIGN KEY("userId","productId","unitId") REFERENCES "SerialUnits"("userId","productId",id) ON DELETE RESTRICT; END IF;
END $$;
CREATE OR REPLACE FUNCTION lumo_validate_serial_allocation() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE pid integer; uid integer; total integer;
BEGIN
 IF TG_TABLE_NAME='Products' THEN pid:=NEW.id; uid:=NEW."userId"; ELSE pid:=NEW."productId"; uid:=NEW."userId"; END IF;
 SELECT stock INTO total FROM "Products" WHERE id=pid AND "userId"=uid FOR UPDATE;
 IF EXISTS(SELECT 1 FROM "SerialUnits" WHERE "userId"=uid AND "productId"=pid) AND EXISTS(SELECT 1 FROM "InventoryLots" WHERE "userId"=uid AND "productId"=pid) THEN RAISE EXCEPTION 'Mixed lot and serial tracking forbidden' USING ERRCODE='23514'; END IF;
 IF EXISTS(SELECT 1 FROM "SerialUnits" s LEFT JOIN "WarehouseBalances" w ON w."userId"=uid AND w."productId"=pid AND w."warehouseId"=s."locationKey" WHERE s."userId"=uid AND s."productId"=pid AND s.status<>'SOLD' GROUP BY s."locationKey",w.quantity HAVING COUNT(*)>CASE WHEN s."locationKey"=0 THEN total-COALESCE((SELECT SUM(quantity) FROM "WarehouseBalances" WHERE "userId"=uid AND "productId"=pid),0) ELSE COALESCE(w.quantity,0) END) THEN RAISE EXCEPTION 'Serial allocation exceeds physical stock' USING ERRCODE='23514'; END IF;
 IF EXISTS(SELECT 1 FROM "SerialUnits" s WHERE s."userId"=uid AND s."productId"=pid AND s."locationKey">0 AND NOT EXISTS(SELECT 1 FROM "Warehouses" w JOIN "Organizations" o ON o.id=w."organizationId" WHERE w.id=s."locationKey" AND o."ownerId"=uid)) THEN RAISE EXCEPTION 'Invalid serial warehouse' USING ERRCODE='23514'; END IF;
 RETURN NEW;
END; $$;
CREATE CONSTRAINT TRIGGER lumo_serial_unit_guard AFTER INSERT OR UPDATE ON "SerialUnits" DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION lumo_validate_serial_allocation();
CREATE CONSTRAINT TRIGGER lumo_serial_product_guard AFTER UPDATE OF stock ON "Products" DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION lumo_validate_serial_allocation();
CREATE CONSTRAINT TRIGGER lumo_serial_warehouse_guard AFTER INSERT OR UPDATE ON "WarehouseBalances" DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION lumo_validate_serial_allocation();
CREATE CONSTRAINT TRIGGER lumo_serial_lot_guard AFTER INSERT OR UPDATE ON "InventoryLots" DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION lumo_validate_serial_allocation();
CREATE OR REPLACE FUNCTION lumo_guard_serial_identity() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF TG_OP='DELETE' THEN RAISE EXCEPTION 'Serial identity cannot be deleted'; END IF; IF (OLD."userId",OLD."productId",OLD.serial,OLD.imei,OLD."warrantyDays") IS DISTINCT FROM (NEW."userId",NEW."productId",NEW.serial,NEW.imei,NEW."warrantyDays") THEN RAISE EXCEPTION 'Serial identity immutable'; END IF; RETURN NEW; END; $$;
CREATE TRIGGER lumo_serial_identity_guard BEFORE UPDATE OR DELETE ON "SerialUnits" FOR EACH ROW EXECUTE FUNCTION lumo_guard_serial_identity();
CREATE TRIGGER lumo_serial_event_immutable BEFORE UPDATE OR DELETE ON "SerialEvents" FOR EACH ROW EXECUTE FUNCTION lumo_guard_support_message();
