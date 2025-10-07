-- Create function to increment referrer count when someone uses their code
CREATE OR REPLACE FUNCTION public.increment_referrer_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- If a referral code was used during signup, increment the referrer's count
  IF NEW.referred_by_code IS NOT NULL THEN
    UPDATE public.profiles
    SET referral_count = referral_count + 1
    WHERE referral_code = NEW.referred_by_code;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger to automatically increment referral count
CREATE TRIGGER after_profile_insert_referral
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.increment_referrer_count();

-- Backfill existing referrals (fix current counts)
UPDATE public.profiles AS referrer
SET referral_count = (
  SELECT COUNT(*)
  FROM public.profiles AS referred
  WHERE referred.referred_by_code = referrer.referral_code
)
WHERE referral_code IS NOT NULL;