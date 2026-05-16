-- Replace abstract due_day with a concrete first due date
-- Payments are generated from first_due_date + n months
ALTER TABLE students ADD COLUMN IF NOT EXISTS first_due_date date;
