-- Add admin access policies for sessions table
CREATE POLICY "Admin can view all sessions" 
ON public.sessions 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role = 'admin'
  )
);

-- Add admin access policies for profiles table  
CREATE POLICY "Admin can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() 
    AND p.role = 'admin'
  )
);