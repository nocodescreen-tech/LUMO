CREATE TABLE IF NOT EXISTS "InventoryLots"(id serial PRIMARY KEY,"userId" integer NOT NULL,"productId" integer NOT NULL,"locationKey" integer NOT NULL,code varchar(80) NOT NULL,"manufacturedOn" date,"expiresOn" date,quantity integer NOT NULL DEFAULT 0,"createdAt" timestamptz NOT NULL DEFAULT now(),"updatedAt" timestamptz NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS "LotMovements"(id serial PRIMARY KEY,"userId" integer NOT NULL,"actorId" integer NOT NULL,"lotId" integer NOT NULL,"productId" integer NOT NULL,kind varchar(24) NOT NULL,quantity integer NOT NULL,"saleId" integer,reason varchar(250) NOT NULL,"createdAt" timestamptz NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS "ReorderRules"(id serial PRIMARY KEY,"userId" integer NOT NULL,"productId" integer NOT NULL,"locationKey" integer NOT NULL,minimum integer NOT NULL,"createdAt" timestamptz NOT NULL DEFAULT now(),"updatedAt" timestamptz NOT NULL DEFAULT now());
CREATE UNIQUE INDEX IF NOT EXISTS lot_identity ON "InventoryLots"("userId","productId","locationKey",code);
CREATE UNIQUE INDEX IF NOT EXISTS lot_owner_product_id ON "InventoryLots"("userId","productId",id);
CREATE UNIQUE INDEX IF NOT EXISTS reorder_identity ON "ReorderRules"("userId","productId","locationKey");
CREATE INDEX IF NOT EXISTS lot_sale_trace ON "LotMovements"("userId","saleId");
DO $$ BEGIN
 IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname='lot_values' AND conrelid='"InventoryLots"'::regclass) THEN ALTER TABLE "InventoryLots" ADD CONSTRAINT lot_values CHECK(quantity>=0 AND "locationKey">=0 AND ("manufacturedOn" IS NULL OR "expiresOn" IS NULL OR "manufacturedOn"<="expiresOn")); END IF;
 IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname='lot_product_owner_fk') THEN ALTER TABLE "InventoryLots" ADD CONSTRAINT lot_product_owner_fk FOREIGN KEY("userId","productId") REFERENCES "Products"("userId",id) ON DELETE RESTRICT; END IF;
 IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname='lot_movement_identity_fk') THEN ALTER TABLE "LotMovements" ADD CONSTRAINT lot_movement_identity_fk FOREIGN KEY("userId","productId","lotId") REFERENCES "InventoryLots"("userId","productId",id) ON DELETE RESTRICT; END IF;
 IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname='lot_movement_values') THEN ALTER TABLE "LotMovements" ADD CONSTRAINT lot_movement_values CHECK(quantity<>0 AND kind IN ('ASSIGN','SALE','REFUND','TRANSFER_OUT','TRANSFER_IN','DISPOSAL')); END IF;
 IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname='reorder_values') THEN ALTER TABLE "ReorderRules" ADD CONSTRAINT reorder_values CHECK(minimum>=0 AND "locationKey">=0); END IF;
 IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname='reorder_product_owner_fk') THEN ALTER TABLE "ReorderRules" ADD CONSTRAINT reorder_product_owner_fk FOREIGN KEY("userId","productId") REFERENCES "Products"("userId",id) ON DELETE RESTRICT; END IF;
END $$;
CREATE OR REPLACE FUNCTION lumo_validate_lot_allocation() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE pid integer; uid integer; total integer;
BEGIN
 IF TG_TABLE_NAME='Products' THEN pid:=NEW.id; uid:=NEW."userId"; ELSE pid:=NEW."productId"; uid:=NEW."userId"; END IF;
 SELECT stock INTO total FROM "Products" WHERE id=pid AND "userId"=uid FOR UPDATE;
 IF EXISTS(SELECT 1 FROM "InventoryLots" l LEFT JOIN "WarehouseBalances" w ON w."userId"=uid AND w."productId"=pid AND w."warehouseId"=l."locationKey" WHERE l."userId"=uid AND l."productId"=pid GROUP BY l."locationKey",w.quantity HAVING SUM(l.quantity)>CASE WHEN l."locationKey"=0 THEN total-COALESCE((SELECT SUM(quantity) FROM "WarehouseBalances" WHERE "userId"=uid AND "productId"=pid),0) ELSE COALESCE(w.quantity,0) END) THEN RAISE EXCEPTION 'Lot allocation exceeds physical stock' USING ERRCODE='23514'; END IF;
 IF EXISTS(SELECT 1 FROM "InventoryLots" l WHERE l."userId"=uid AND l."productId"=pid AND l."locationKey">0 AND NOT EXISTS(SELECT 1 FROM "Warehouses" w JOIN "Organizations" o ON o.id=w."organizationId" WHERE w.id=l."locationKey" AND o."ownerId"=uid)) THEN RAISE EXCEPTION 'Invalid lot warehouse' USING ERRCODE='23514'; END IF;
 RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS lumo_lot_balance_guard ON "InventoryLots";
CREATE CONSTRAINT TRIGGER lumo_lot_balance_guard AFTER INSERT OR UPDATE ON "InventoryLots" DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION lumo_validate_lot_allocation();
DROP TRIGGER IF EXISTS lumo_lot_product_guard ON "Products";
CREATE CONSTRAINT TRIGGER lumo_lot_product_guard AFTER UPDATE OF stock ON "Products" DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION lumo_validate_lot_allocation();
DROP TRIGGER IF EXISTS lumo_lot_warehouse_guard ON "WarehouseBalances";
CREATE CONSTRAINT TRIGGER lumo_lot_warehouse_guard AFTER INSERT OR UPDATE ON "WarehouseBalances" DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION lumo_validate_lot_allocation();
CREATE OR REPLACE FUNCTION lumo_guard_lot_identity() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF TG_OP='DELETE' THEN RAISE EXCEPTION 'Lot history cannot be deleted'; END IF; IF (OLD."userId",OLD."productId",OLD."locationKey",OLD.code,OLD."manufacturedOn",OLD."expiresOn") IS DISTINCT FROM (NEW."userId",NEW."productId",NEW."locationKey",NEW.code,NEW."manufacturedOn",NEW."expiresOn") THEN RAISE EXCEPTION 'Lot identity immutable'; END IF; RETURN NEW; END; $$;
DROP TRIGGER IF EXISTS lumo_lot_identity_guard ON "InventoryLots";
CREATE TRIGGER lumo_lot_identity_guard BEFORE UPDATE OR DELETE ON "InventoryLots" FOR EACH ROW EXECUTE FUNCTION lumo_guard_lot_identity();
DROP TRIGGER IF EXISTS lumo_lot_movement_immutable ON "LotMovements";
CREATE TRIGGER lumo_lot_movement_immutable BEFORE UPDATE OR DELETE ON "LotMovements" FOR EACH ROW EXECUTE FUNCTION lumo_guard_support_message();
