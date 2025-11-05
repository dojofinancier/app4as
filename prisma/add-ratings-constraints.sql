-- Constraints for tutor_ratings table
ALTER TABLE public.tutor_ratings
  ADD CONSTRAINT chk_tutor_ratings_q1 CHECK (q1_courtoisie BETWEEN 1 AND 5),
  ADD CONSTRAINT chk_tutor_ratings_q2 CHECK (q2_maitrise BETWEEN 1 AND 5),
  ADD CONSTRAINT chk_tutor_ratings_q3 CHECK (q3_pedagogie BETWEEN 1 AND 5),
  ADD CONSTRAINT chk_tutor_ratings_q4 CHECK (q4_dynamisme BETWEEN 1 AND 5);

-- Comment length up to 2000 chars (text has no inherent limit; enforce via length)
ALTER TABLE public.tutor_ratings
  ADD CONSTRAINT chk_tutor_ratings_comment_length CHECK (comment IS NULL OR length(comment) <= 2000);

-- General score range 1.00 to 5.00
ALTER TABLE public.tutor_ratings
  ADD CONSTRAINT chk_tutor_ratings_general_score CHECK (general_score >= 1.00 AND general_score <= 5.00);

-- Helpful index for date-filtered tutor lookups
CREATE INDEX IF NOT EXISTS idx_tutor_ratings_tutor_course_hidden_created
  ON public.tutor_ratings (tutor_id, course_id, hidden, created_at);









