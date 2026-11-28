CREATE TABLE IF NOT EXISTS "BackupRuns" (id serial PRIMARY KEY,"ownerId" integer NOT NULL,mode varchar(16) NOT NULL,"scheduleKey" varchar(32),status varchar(24) NOT NULL DEFAULT 'RUNNING',"archiveId" uuid,bytes integer,digest varchar(64),failure varchar(40),"finishedAt" timestamptz,"createdAt" timestamptz NOT NULL DEFAULT now(),"updatedAt" timestamptz NOT NULL DEFAULT now());
CREATE INDEX IF NOT EXISTS backup_owner_date ON "BackupRuns"("ownerId","createdAt");
CREATE UNIQUE INDEX IF NOT EXISTS backup_schedule_unique ON "BackupRuns"("ownerId","scheduleKey");
