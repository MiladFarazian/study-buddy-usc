-- Drop old INSERT-only trigger
DROP TRIGGER IF EXISTS after_profile_insert_referral ON public.profiles;

-- Replace function with defensive version that handles INSERT and UPDATE
CREATE OR REPLACE FUNCTION public.increment_referrer_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Handle INSERT: increment if referral code was used
  IF TG_OP = 'INSERT' AND NEW.referred_by_code IS NOT NULL THEN
    UPDATE public.profiles
    SET referral_count = COALESCE(referral_count, 0) + 1
    WHERE referral_code = NEW.referred_by_code;
    
  -- Handle UPDATE: adjust counts if referral code changed
  ELSIF TG_OP = 'UPDATE' AND (OLD.referred_by_code IS DISTINCT FROM NEW.referred_by_code) THEN
    -- Decrement old referrer (if there was one)
    IF OLD.referred_by_code IS NOT NULL THEN
      UPDATE public.profiles
      SET referral_count = GREATEST(COALESCE(referral_count, 0) - 1, 0)
      WHERE referral_code = OLD.referred_by_code;
    END IF;
    
    -- Increment new referrer (if there is one)
    IF NEW.referred_by_code IS NOT NULL THEN
      UPDATE public.profiles
      SET referral_count = COALESCE(referral_count, 0) + 1
      WHERE referral_code = NEW.referred_by_code;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create new trigger for both INSERT and UPDATE
CREATE TRIGGER after_profile_referral_change
  AFTER INSERT OR UPDATE OF referred_by_code ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.increment_referrer_count();

-- Backfill all existing referral counts to fix current data
UPDATE public.profiles AS referrer
SET referral_count = (
  SELECT COUNT(*)
  FROM public.profiles AS referred
  WHERE referred.referred_by_code = referrer.referral_code
)
WHERE referral_code IS NOT NULL;