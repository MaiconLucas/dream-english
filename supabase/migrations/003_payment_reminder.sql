-- Track when the last reminder was sent for each payment
-- Used to avoid sending duplicate reminders on the same day
ALTER TABLE payments ADD COLUMN IF NOT EXISTS reminder_sent_at timestamptz;

-- Index to speed up the cron query that filters by due_date + status
CREATE INDEX IF NOT EXISTS idx_payments_reminder ON payments (due_date, status, reminder_sent_at);
