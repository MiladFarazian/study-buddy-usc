-- Create badge type enum
CREATE TYPE public.badge_type AS ENUM (
  'founding_tutor',
  'weekly_streak', 
  'top_rated',
  'sessions_50',
  'sessions_100',
  'student_success_champion',
  'quick_responder',
  'industry_professional',
  'advanced_degree',
  'superstar'
);

-- Create tutor_badges table
CREATE TABLE public.tutor_badges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tutor_id UUID NOT NULL,
  badge_type public.badge_type NOT NULL,
  earned_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  criteria_met JSONB DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(tutor_id, badge_type)
);

-- Create badge_progress table
CREATE TABLE public.badge_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tutor_id UUID NOT NULL UNIQUE,
  total_sessions INTEGER NOT NULL DEFAULT 0,
  current_streak_weeks INTEGER NOT NULL DEFAULT 0,
  last_session_date DATE,
  avg_rating NUMERIC(3,2) NOT NULL DEFAULT 0.00,
  total_stress_reduction NUMERIC(5,2) NOT NULL DEFAULT 0.00,
  avg_response_time_hours NUMERIC(5,2) NOT NULL DEFAULT 0.00,
  student_improvement_score NUMERIC(4,2) NOT NULL DEFAULT 0.00,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add indexes
CREATE INDEX idx_tutor_badges_tutor_id ON public.tutor_badges(tutor_id);
CREATE INDEX idx_tutor_badges_badge_type ON public.tutor_badges(badge_type);
CREATE INDEX idx_tutor_badges_earned_date ON public.tutor_badges(earned_date);
CREATE INDEX idx_badge_progress_last_session_date ON public.badge_progress(last_session_date);

-- Enable RLS
ALTER TABLE public.tutor_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.badge_progress ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tutor_badges
CREATE POLICY "Anyone can view active badges" 
ON public.tutor_badges 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Tutors can view their own badges" 
ON public.tutor_badges 
FOR SELECT 
USING (auth.uid() = tutor_id);

CREATE POLICY "Service role can manage badges" 
ON public.tutor_badges 
FOR ALL 
USING (true);

-- RLS Policies for badge_progress
CREATE POLICY "Tutors can view their own progress" 
ON public.badge_progress 
FOR SELECT 
USING (auth.uid() = tutor_id);

CREATE POLICY "Service role can manage progress" 
ON public.badge_progress 
FOR ALL 
USING (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_tutor_badges_updated_at
BEFORE UPDATE ON public.tutor_badges
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_badge_progress_updated_at
BEFORE UPDATE ON public.badge_progress
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to initialize badge progress for new tutors
CREATE OR REPLACE FUNCTION public.initialize_tutor_badge_progress()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.role = 'tutor' AND OLD.role IS DISTINCT FROM 'tutor' THEN
    INSERT INTO public.badge_progress (tutor_id)
    VALUES (NEW.id)
    ON CONFLICT (tutor_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to auto-initialize badge progress when someone becomes a tutor
CREATE TRIGGER initialize_badge_progress_on_role_change
AFTER UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.initialize_tutor_badge_progress();

-- Create function to update badge progress after session completion
CREATE OR REPLACE FUNCTION public.update_badge_progress_after_session()
RETURNS TRIGGER AS $$
DECLARE
  stress_reduction NUMERIC;
  new_avg_rating NUMERIC;
BEGIN
  -- Only process completed sessions
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    -- Calculate stress reduction from student reviews
    SELECT COALESCE(AVG(stress_before - stress_after), 0)
    INTO stress_reduction
    FROM public.student_reviews 
    WHERE session_id = NEW.id;
    
    -- Calculate new average rating
    SELECT COALESCE(AVG(teaching_quality), 0)
    INTO new_avg_rating
    FROM public.student_reviews sr
    JOIN public.sessions s ON sr.session_id = s.id
    WHERE s.tutor_id = NEW.tutor_id;
    
    -- Update badge progress
    INSERT INTO public.badge_progress (tutor_id, total_sessions, last_session_date, avg_rating, total_stress_reduction)
    VALUES (
      NEW.tutor_id, 
      1, 
      NEW.start_time::date,
      new_avg_rating,
      stress_reduction
    )
    ON CONFLICT (tutor_id) 
    DO UPDATE SET
      total_sessions = badge_progress.total_sessions + 1,
      last_session_date = NEW.start_time::date,
      avg_rating = new_avg_rating,
      total_stress_reduction = badge_progress.total_stress_reduction + stress_reduction,
      updated_at = now();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to update progress after each session
CREATE TRIGGER update_progress_after_session_completion
AFTER UPDATE ON public.sessions
FOR EACH ROW
EXECUTE FUNCTION public.update_badge_progress_after_session();