ALTER TABLE "Notifications" ADD COLUMN IF NOT EXISTS category varchar(32), ADD COLUMN IF NOT EXISTS "dedupeKey" varchar(160), ADD COLUMN IF NOT EXISTS "targetPath" varchar(80), ADD COLUMN IF NOT EXISTS "archivedAt" timestamptz;
CREATE UNIQUE INDEX IF NOT EXISTS notification_personal_dedupe ON "Notifications"("userId","dedupeKey") WHERE "dedupeKey" IS NOT NULL;
CREATE INDEX IF NOT EXISTS notification_personal_inbox ON "Notifications"("userId","archivedAt",lu,"createdAt");
CREATE TABLE IF NOT EXISTS "NotificationSettings"("userId" integer PRIMARY KEY,muted jsonb NOT NULL DEFAULT '[]'::jsonb,"lastScanAt" timestamptz);
ALTER TABLE "NotificationSettings" ADD CONSTRAINT notification_muted_array CHECK(jsonb_typeof(muted)='array');
