-- Add referral fields to profiles table
ALTER TABLE public.profiles 
  ADD COLUMN referral_code TEXT UNIQUE,
  ADD COLUMN referred_by_code TEXT,
  ADD COLUMN referral_count INTEGER DEFAULT 0 NOT NULL;

-- Create index for fast code lookups
CREATE INDEX idx_profiles_referral_code ON public.profiles(referral_code);

-- Function to generate unique 6-character referral codes
CREATE OR REPLACE FUNCTION generate_referral_code(user_first_name TEXT, user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  base_code TEXT;
  random_suffix TEXT;
  final_code TEXT;
  counter INTEGER := 0;
BEGIN
  -- Create base from first name (uppercase, first 4 chars)
  base_code := UPPER(LEFT(COALESCE(user_first_name, 'USER'), 4));
  
  LOOP
    -- Generate random 2-character suffix
    random_suffix := LPAD(FLOOR(RANDOM() * 100)::TEXT, 2, '0');
    final_code := base_code || random_suffix;
    
    -- Check if code exists
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE referral_code = final_code) THEN
      RETURN final_code;
    END IF;
    
    counter := counter + 1;
    EXIT WHEN counter > 100; -- Safety limit
  END LOOP;
  
  -- Fallback: use UUID
  RETURN 'REF' || SUBSTRING(REPLACE(user_id::TEXT, '-', ''), 1, 6);
END;
$$;

-- Trigger to auto-generate referral codes for new users
CREATE OR REPLACE FUNCTION assign_referral_code()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.referral_code IS NULL THEN
    NEW.referral_code := generate_referral_code(NEW.first_name, NEW.id);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER before_profile_insert_referral
  BEFORE INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION assign_referral_code();

-- Backfill existing users with referral codes
UPDATE public.profiles
SET referral_code = generate_referral_code(first_name, id)
WHERE referral_code IS NULL;