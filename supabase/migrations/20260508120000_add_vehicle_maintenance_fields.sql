-- Backward-compatible vehicle maintenance fields for reminder automation.
ALTER TABLE public.vehicles
  ADD COLUMN IF NOT EXISTS last_service_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_service_mileage INTEGER,
  ADD COLUMN IF NOT EXISTS next_service_due_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS next_service_due_mileage INTEGER,
  ADD COLUMN IF NOT EXISTS maintenance_status TEXT NOT NULL DEFAULT 'ok';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'vehicles_maintenance_status_check'
  ) THEN
    ALTER TABLE public.vehicles
      ADD CONSTRAINT vehicles_maintenance_status_check
      CHECK (maintenance_status IN ('ok', 'due_soon', 'overdue'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_vehicles_maintenance_status
  ON public.vehicles(maintenance_status, next_service_due_date);
