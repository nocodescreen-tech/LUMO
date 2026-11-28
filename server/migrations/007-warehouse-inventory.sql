CREATE TABLE IF NOT EXISTS "WarehouseBalances"(id serial PRIMARY KEY,"userId" integer NOT NULL,"organizationId" integer NOT NULL,"warehouseId" integer NOT NULL,"productId" integer NOT NULL,quantity integer NOT NULL DEFAULT 0 CHECK(quantity>=0),"createdAt" timestamptz NOT NULL DEFAULT now(),"updatedAt" timestamptz NOT NULL DEFAULT now(),UNIQUE("warehouseId","productId"));
CREATE TABLE IF NOT EXISTS "InventoryTransfers"(id serial PRIMARY KEY,"userId" integer NOT NULL,"actorId" integer NOT NULL,"productId" integer NOT NULL,"fromWarehouseId" integer,"toWarehouseId" integer,quantity integer NOT NULL CHECK(quantity>0),reason varchar(250) NOT NULL,"createdAt" timestamptz NOT NULL DEFAULT now());
CREATE UNIQUE INDEX IF NOT EXISTS inventory_product_owner ON "Products"("userId",id);
CREATE UNIQUE INDEX IF NOT EXISTS inventory_org_owner ON "Organizations"("ownerId",id);
CREATE UNIQUE INDEX IF NOT EXISTS inventory_warehouse_org ON "Warehouses"("organizationId",id);
CREATE UNIQUE INDEX IF NOT EXISTS inventory_balance_unique ON "WarehouseBalances"("warehouseId","productId");
CREATE INDEX IF NOT EXISTS inventory_balance_product ON "WarehouseBalances"("userId","productId");
DO $$ BEGIN
 IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname='balance_product_owner_fk') THEN ALTER TABLE "WarehouseBalances" ADD CONSTRAINT balance_product_owner_fk FOREIGN KEY("userId","productId") REFERENCES "Products"("userId",id) ON DELETE RESTRICT; END IF;
 IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname='balance_org_owner_fk') THEN ALTER TABLE "WarehouseBalances" ADD CONSTRAINT balance_org_owner_fk FOREIGN KEY("userId","organizationId") REFERENCES "Organizations"("ownerId",id) ON DELETE RESTRICT; END IF;
 IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname='balance_warehouse_org_fk') THEN ALTER TABLE "WarehouseBalances" ADD CONSTRAINT balance_warehouse_org_fk FOREIGN KEY("organizationId","warehouseId") REFERENCES "Warehouses"("organizationId",id) ON DELETE RESTRICT; END IF;
 IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname='balance_quantity_nonnegative') THEN ALTER TABLE "WarehouseBalances" ADD CONSTRAINT balance_quantity_nonnegative CHECK(quantity>=0); END IF;
 IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname='transfer_product_owner_fk') THEN ALTER TABLE "InventoryTransfers" ADD CONSTRAINT transfer_product_owner_fk FOREIGN KEY("userId","productId") REFERENCES "Products"("userId",id) ON DELETE RESTRICT; END IF;
END $$;
ALTER TABLE "Sales" ADD COLUMN IF NOT EXISTS "warehouseId" integer;
ALTER TABLE "Purchases" ADD COLUMN IF NOT EXISTS "warehouseId" integer;
CREATE OR REPLACE FUNCTION lumo_check_product_allocation() RETURNS trigger LANGUAGE plpgsql AS $$ DECLARE allocated bigint; BEGIN SELECT COALESCE(sum(quantity),0) INTO allocated FROM "WarehouseBalances" WHERE "userId"=NEW."userId" AND "productId"=NEW.id; IF NEW.stock IS NULL OR NEW.stock<allocated THEN RAISE EXCEPTION 'Stock below allocated quantity' USING ERRCODE='23514'; END IF; RETURN NEW; END; $$;
DROP TRIGGER IF EXISTS lumo_product_allocation_guard ON "Products";
CREATE TRIGGER lumo_product_allocation_guard BEFORE UPDATE OF stock ON "Products" FOR EACH ROW EXECUTE FUNCTION lumo_check_product_allocation();
CREATE OR REPLACE FUNCTION lumo_check_warehouse_allocation() RETURNS trigger LANGUAGE plpgsql AS $$ DECLARE total integer; allocated bigint; BEGIN
 IF TG_OP='UPDATE' AND (OLD."productId",OLD."warehouseId",OLD."userId",OLD."organizationId") IS DISTINCT FROM (NEW."productId",NEW."warehouseId",NEW."userId",NEW."organizationId") THEN RAISE EXCEPTION 'Balance identity immutable'; END IF;
 SELECT stock INTO total FROM "Products" WHERE id=NEW."productId" AND "userId"=NEW."userId" FOR UPDATE;
 SELECT COALESCE(sum(quantity),0) INTO allocated FROM "WarehouseBalances" WHERE "productId"=NEW."productId" AND "userId"=NEW."userId" AND id<>NEW.id;
 IF total IS NULL OR NEW.quantity<0 OR allocated+NEW.quantity>total THEN RAISE EXCEPTION 'Invalid warehouse allocation' USING ERRCODE='23514'; END IF; RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS lumo_warehouse_allocation_guard ON "WarehouseBalances";
CREATE TRIGGER lumo_warehouse_allocation_guard BEFORE INSERT OR UPDATE ON "WarehouseBalances" FOR EACH ROW EXECUTE FUNCTION lumo_check_warehouse_allocation();
DROP TRIGGER IF EXISTS lumo_transfer_immutable ON "InventoryTransfers";
CREATE TRIGGER lumo_transfer_immutable BEFORE UPDATE OR DELETE ON "InventoryTransfers" FOR EACH ROW EXECUTE FUNCTION lumo_guard_support_message();
