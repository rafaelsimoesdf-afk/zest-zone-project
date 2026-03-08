ALTER TABLE vehicles ADD COLUMN app_driver_rental boolean DEFAULT false;
ALTER TABLE vehicles ADD COLUMN app_driver_weekly_price numeric DEFAULT NULL;
ALTER TABLE vehicles ADD COLUMN app_driver_monthly_price numeric DEFAULT NULL;