-- Add direct fee fields to students table (replacing plan_id dependency)
ALTER TABLE students
  ADD COLUMN IF NOT EXISTS monthly_fee_cents integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS discount_percent  integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS due_day           integer NOT NULL DEFAULT 10;
