-- Create temporary function to set admin password
CREATE OR REPLACE FUNCTION setup_admin_password(admin_email text, new_password text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update the user to enable email auth and set password
  UPDATE auth.users 
  SET 
    encrypted_password = crypt(new_password, gen_salt('bf')),
    email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
    updated_at = NOW()
  WHERE email = admin_email;
  
  RETURN FOUND;
END;
$$;

-- Call the function to enable password for admin
SELECT setup_admin_password('noah@studybuddyusc.com', 'StudyBuddy9!');

-- Ensure email is confirmed for password login
UPDATE auth.users 
SET email_confirmed_at = NOW() 
WHERE email = 'noah@studybuddyusc.com' AND email_confirmed_at IS NULL;

-- Drop the function after use for security
DROP FUNCTION setup_admin_password;