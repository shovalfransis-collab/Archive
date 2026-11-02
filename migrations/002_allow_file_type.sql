-- "Add a file" saves items with type 'file', but the original CHECK rule
-- only allowed link/photo/note, so every file save was rejected. This
-- removes whatever CHECK rule currently restricts items.type (whatever it's
-- named) and adds one that includes 'file'.
DO $$
DECLARE c record;
BEGIN
  FOR c IN
    SELECT conname FROM pg_constraint
    WHERE conrelid = 'items'::regclass
      AND contype = 'c'
      AND pg_get_constraintdef(oid) ILIKE '%type%'
  LOOP
    EXECUTE format('ALTER TABLE items DROP CONSTRAINT %I', c.conname);
  END LOOP;
END $$;

ALTER TABLE items ADD CONSTRAINT items_type_check
  CHECK (type IN ('link', 'photo', 'note', 'file'));
