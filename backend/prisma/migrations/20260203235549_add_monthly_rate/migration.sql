-- AlterTable
ALTER TABLE `clients` ADD COLUMN `monthly_rate` DECIMAL(10, 2) NULL;

-- AlterTable
ALTER TABLE `monthly_closure_clients` ADD COLUMN `monthly_rate` DECIMAL(10, 2) NULL;
