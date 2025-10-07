-- Add admin role for noah@studybuddyusc.com
-- This migration makes admin authentication secure by using the user_roles table

-- Insert admin role for the user with email noah@studybuddyusc.com
INSERT INTO public.user_roles (user_id, role)
SELECT au.id, 'admin'::app_role
FROM auth.users au
WHERE au.email = 'noah@studybuddyusc.com'
ON CONFLICT (user_id, role) DO NOTHING;