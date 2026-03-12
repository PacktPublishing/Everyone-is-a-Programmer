-- Add missing fields to habits surface
ALTER TABLE habits 
ADD COLUMN IF NOT EXISTS description TEXT;

-- Add missing fields to habit_logs surface
ALTER TABLE habit_logs 
ADD COLUMN IF NOT EXISTS date DATE DEFAULT CURRENT_DATE,
ADD COLUMN IF NOT EXISTS completed BOOLEAN DEFAULT true;

-- Create indexes on new fields to improve query performance
CREATE INDEX IF NOT EXISTS idx_habit_logs_date ON habit_logs(date);
CREATE INDEX IF NOT EXISTS idx_habit_logs_completed ON habit_logs(completed);

-- Populate the date field for existing records (based on completed_at)
UPDATE habit_logs 
SET date = DATE(completed_at) 
WHERE date IS NULL;

-- Set completed to true for existing records (because all existing records are completed records)
UPDATE habit_logs 
SET completed = true 
WHERE completed IS NULL;
