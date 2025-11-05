-- Enable RLS
ALTER TABLE public.tutor_ratings ENABLE ROW LEVEL SECURITY;

-- Helper policy notes:
-- Students can INSERT/UPDATE their own row for (student_id, tutor_id, course_id)
-- only if they have at least one completed appointment with that tutor+course.
-- Students can SELECT their own rating only.
-- Tutors can SELECT ratings for themselves (anonymized at app layer).
-- Admins: use existing supabase role mapping to bypass via auth.role() = 'admin' using users table join in app.

-- Clean existing policies with same names
DO $$ BEGIN
  PERFORM 1 FROM pg_policies WHERE policyname = 'tutor_ratings_student_write';
  IF FOUND THEN EXECUTE 'DROP POLICY tutor_ratings_student_write ON public.tutor_ratings'; END IF;
  PERFORM 1 FROM pg_policies WHERE policyname = 'tutor_ratings_student_read';
  IF FOUND THEN EXECUTE 'DROP POLICY tutor_ratings_student_read ON public.tutor_ratings'; END IF;
  PERFORM 1 FROM pg_policies WHERE policyname = 'tutor_ratings_tutor_read';
  IF FOUND THEN EXECUTE 'DROP POLICY tutor_ratings_tutor_read ON public.tutor_ratings'; END IF;
END $$;

-- Student INSERT/UPDATE (must own the row and be eligible)
CREATE POLICY tutor_ratings_student_write ON public.tutor_ratings
  FOR INSERT WITH CHECK (
    student_id = auth.uid() AND EXISTS (
      SELECT 1 FROM public.appointments a
      WHERE a.user_id = auth.uid()
        AND a.tutor_id = tutor_ratings.tutor_id
        AND a.course_id = tutor_ratings.course_id
        AND a.status = 'completed'
    )
  )
  TO authenticated;

CREATE POLICY tutor_ratings_student_update ON public.tutor_ratings
  FOR UPDATE USING (
    student_id = auth.uid()
  ) WITH CHECK (
    student_id = auth.uid()
  ) TO authenticated;

-- Student SELECT own rating
CREATE POLICY tutor_ratings_student_read ON public.tutor_ratings
  FOR SELECT USING (
    student_id = auth.uid()
  ) TO authenticated;

-- Tutor SELECT ratings for themselves (app anonymizes)
CREATE POLICY tutor_ratings_tutor_read ON public.tutor_ratings
  FOR SELECT USING (
    tutor_id = auth.uid()
  ) TO authenticated;







