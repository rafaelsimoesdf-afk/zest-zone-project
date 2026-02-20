
-- Delete duplicate "Nova solicitação de reserva" notifications (keep only the latest per unique message+user combo)
-- Delete notifications related to duplicate cancellations
DELETE FROM notifications WHERE id IN (
  -- Duplicate booking request notifications (the older one of each pair created within 1 second)
  '5e5118bb-8cdc-48c3-88dc-4cb5a5408ea4',  -- duplicate of 8a622310 (same message, 0.6s earlier)
  '632592e4-714a-4b8f-abb1-e38c9e1dde2b',  -- duplicate of 5d976fbf (same message, 0.16s earlier)
  '8007ddda-e3dd-43f4-94f7-30bcdcb9289d',  -- duplicate of the jan booking notification
  -- Cancellation notifications for duplicates
  '843f4eec-e2fc-42ec-9efc-1534cb320481',  -- "Reserva cancelada - Motivo: Duplicado"
  '3d722ddc-3753-4023-bfec-6e1f2461732b'   -- "Reserva cancelada - Motivo: Duplicado"
);
