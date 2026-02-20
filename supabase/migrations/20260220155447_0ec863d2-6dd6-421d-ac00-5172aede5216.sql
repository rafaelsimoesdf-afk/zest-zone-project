
-- Cancel the duplicate booking (the older one of the two created at 15:48)
UPDATE bookings SET status = 'cancelled' WHERE id = '3e76147f-fcd7-4701-bebe-f674e9ad700f';
