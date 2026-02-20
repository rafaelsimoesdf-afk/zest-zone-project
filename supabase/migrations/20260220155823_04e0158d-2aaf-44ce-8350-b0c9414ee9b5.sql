
-- Mark the recently cancelled duplicate with proper note
UPDATE bookings SET notes = 'Duplicado' WHERE id = '3e76147f-fcd7-4701-bebe-f674e9ad700f';

-- Add cancelled_reason column to distinguish cancellation sources
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS cancelled_reason text DEFAULT NULL;

-- Mark existing duplicates
UPDATE bookings SET cancelled_reason = 'duplicate' WHERE notes = 'Duplicado' AND status = 'cancelled';
