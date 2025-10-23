BEGIN;

-- Add session_id to carts and make user_id nullable
ALTER TABLE IF EXISTS public.carts
  ADD COLUMN IF NOT EXISTS session_id text;

ALTER TABLE IF EXISTS public.carts
  ALTER COLUMN user_id DROP NOT NULL;

CREATE INDEX IF NOT EXISTS idx_carts_session_id ON public.carts (session_id);

-- Add session_id to slot_holds and make user_id nullable
ALTER TABLE IF EXISTS public.slot_holds
  ADD COLUMN IF NOT EXISTS session_id text;

ALTER TABLE IF EXISTS public.slot_holds
  ALTER COLUMN user_id DROP NOT NULL;

CREATE INDEX IF NOT EXISTS idx_slot_holds_session ON public.slot_holds (session_id, tutor_id, start_datetime, expires_at);

COMMIT;


