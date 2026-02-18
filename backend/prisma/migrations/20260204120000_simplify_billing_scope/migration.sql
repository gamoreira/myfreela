-- Simplify billing scope: move hourlyRate from Client to MonthlyClosures

-- 1. Add hourly_rate column to monthly_closures
ALTER TABLE `monthly_closures` ADD COLUMN `hourly_rate` DECIMAL(10, 2) NOT NULL DEFAULT 100.00;

-- 2. Migrate existing data: use average hourlyRate from closure's clients, or 100.00 if none
UPDATE `monthly_closures` mc SET `hourly_rate` = COALESCE(
  (SELECT AVG(mcc.hourly_rate) FROM `monthly_closure_clients` mcc WHERE mcc.monthly_closure_id = mc.id),
  100.00
);

-- 3. Remove hourly_rate and monthly_rate columns from monthly_closure_clients
ALTER TABLE `monthly_closure_clients` DROP COLUMN `hourly_rate`;
ALTER TABLE `monthly_closure_clients` DROP COLUMN `monthly_rate`;

-- 4. Remove hourly_rate and monthly_rate columns from clients
ALTER TABLE `clients` DROP COLUMN `hourly_rate`;
ALTER TABLE `clients` DROP COLUMN `monthly_rate`;

