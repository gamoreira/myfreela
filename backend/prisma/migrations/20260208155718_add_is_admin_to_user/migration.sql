-- AlterTable
ALTER TABLE `monthly_closures` ALTER COLUMN `hourly_rate` DROP DEFAULT;

-- AlterTable
ALTER TABLE `users` ADD COLUMN `is_admin` BOOLEAN NOT NULL DEFAULT false;
