-- ============================================================================
-- Add student_rate_cad column to courses table
-- ============================================================================
-- Purpose: Add the dual rate system column to existing courses
-- Run this in Supabase SQL Editor
-- ============================================================================

-- Add the student_rate_cad column with default value
ALTER TABLE courses 
ADD COLUMN student_rate_cad DECIMAL(10,2) DEFAULT 45.00;

-- Update existing courses with the default rate
-- You can customize these rates as needed
UPDATE courses 
SET student_rate_cad = 45.00 
WHERE student_rate_cad IS NULL;

-- Make the column NOT NULL after setting default values
ALTER TABLE courses 
ALTER COLUMN student_rate_cad SET NOT NULL;

-- Verify the changes
SELECT id, title_fr, student_rate_cad, created_at 
FROM courses 
ORDER BY created_at;
