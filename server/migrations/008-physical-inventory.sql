CREATE TABLE IF NOT EXISTS "InventoryCounts"(id serial PRIMARY KEY,"userId" integer NOT NULL,"actorId" integer NOT NULL,"productId" integer NOT NULL,"warehouseId" integer,expected integer NOT NULL,counted integer NOT NULL,delta integer NOT NULL,reason varchar(250) NOT NULL,"unitCost" numeric(20,2) NOT NULL,currency varchar(3) NOT NULL,rate numeric(20,8) NOT NULL,"createdAt" timestamptz NOT NULL DEFAULT now());
CREATE INDEX IF NOT EXISTS inventory_count_owner_date ON "InventoryCounts"("userId","createdAt");
DO $$ BEGIN
 IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname='inventory_count_values' AND conrelid='"InventoryCounts"'::regclass) THEN ALTER TABLE "InventoryCounts" ADD CONSTRAINT inventory_count_values CHECK(expected>=0 AND counted>=0 AND delta=counted-expected AND "unitCost">=0 AND rate>0 AND currency IN ('USD','CDF')); END IF;
 IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname='inventory_count_product_owner_fk' AND conrelid='"InventoryCounts"'::regclass) THEN ALTER TABLE "InventoryCounts" ADD CONSTRAINT inventory_count_product_owner_fk FOREIGN KEY("userId","productId") REFERENCES "Products"("userId",id) ON DELETE RESTRICT; END IF;
END $$;
DROP TRIGGER IF EXISTS lumo_inventory_count_immutable ON "InventoryCounts";
CREATE TRIGGER lumo_inventory_count_immutable BEFORE UPDATE OR DELETE ON "InventoryCounts" FOR EACH ROW EXECUTE FUNCTION lumo_guard_support_message();
