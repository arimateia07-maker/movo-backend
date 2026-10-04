ALTER TABLE "deleted_accounts" ALTER COLUMN "openId" SET DATA TYPE varchar(128);--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "openId" SET DATA TYPE varchar(128);