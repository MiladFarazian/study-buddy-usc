-- Add SELECT policies for courses tables to restore data access
CREATE POLICY "Anyone can read courses 20251" ON public."courses-20251" FOR SELECT USING (true);
CREATE POLICY "Anyone can read courses 20252" ON public."courses-20252" FOR SELECT USING (true);
CREATE POLICY "Anyone can read courses 20253" ON public."courses-20253" FOR SELECT USING (true);

-- Add user_roles SELECT policy to restore admin role checks
CREATE POLICY "Users can view their own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);