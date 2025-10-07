-- Phase 2: Create enums for resources system
CREATE TYPE public.resource_status AS ENUM ('pending', 'approved', 'rejected', 'deleted');
CREATE TYPE public.resource_type AS ENUM ('notes', 'practice_exam', 'study_guide', 'slides', 'summary', 'other');

-- Phase 2: Create resources table
CREATE TABLE public.resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  uploader_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status public.resource_status NOT NULL DEFAULT 'pending',
  resource_type public.resource_type NOT NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  file_type TEXT NOT NULL,
  download_count INTEGER NOT NULL DEFAULT 0,
  uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID REFERENCES public.profiles(id),
  rejection_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for common queries
CREATE INDEX idx_resources_status ON public.resources(status);
CREATE INDEX idx_resources_uploader ON public.resources(uploader_id);
CREATE INDEX idx_resources_type ON public.resources(resource_type);

-- Phase 2: Create resource_courses junction table
CREATE TABLE public.resource_courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_id UUID NOT NULL REFERENCES public.resources(id) ON DELETE CASCADE,
  course_number TEXT NOT NULL,
  course_title TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_resource_courses_resource ON public.resource_courses(resource_id);
CREATE INDEX idx_resource_courses_course ON public.resource_courses(course_number);

-- Phase 3: Create storage buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('pending-resources', 'pending-resources', false, 52428800, ARRAY[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'image/jpeg',
    'image/png'
  ]),
  ('approved-resources', 'approved-resources', false, 52428800, ARRAY[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'image/jpeg',
    'image/png'
  ])
ON CONFLICT (id) DO NOTHING;

-- Phase 4: RLS policies for resources table
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;

-- Students with 1+ referrals can view approved resources
CREATE POLICY "Students with referrals can view approved resources"
ON public.resources
FOR SELECT
TO authenticated
USING (
  status = 'approved' 
  AND EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND COALESCE(profiles.referral_count, 0) >= 1
  )
);

-- Students can view their own resources
CREATE POLICY "Users can view own resources"
ON public.resources
FOR SELECT
TO authenticated
USING (uploader_id = auth.uid());

-- Students with 1+ referrals can insert resources
CREATE POLICY "Students with referrals can upload resources"
ON public.resources
FOR INSERT
TO authenticated
WITH CHECK (
  uploader_id = auth.uid()
  AND status = 'pending'
  AND EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND COALESCE(profiles.referral_count, 0) >= 1
  )
);

-- Admins can manage all resources
CREATE POLICY "Admins can manage all resources"
ON public.resources
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Service role can manage all
CREATE POLICY "Service role manages all resources"
ON public.resources
FOR ALL
USING (true);

-- Phase 4: RLS policies for resource_courses table
ALTER TABLE public.resource_courses ENABLE ROW LEVEL SECURITY;

-- Students can view courses for approved resources
CREATE POLICY "Users can view courses for approved resources"
ON public.resource_courses
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.resources 
    WHERE resources.id = resource_courses.resource_id 
    AND resources.status = 'approved'
  )
);

-- Students can insert courses when creating resources
CREATE POLICY "Users can add courses to own resources"
ON public.resource_courses
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.resources 
    WHERE resources.id = resource_courses.resource_id 
    AND resources.uploader_id = auth.uid()
  )
);

-- Admins can manage all
CREATE POLICY "Admins can manage all resource courses"
ON public.resource_courses
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Service role can manage all
CREATE POLICY "Service role manages all resource courses"
ON public.resource_courses
FOR ALL
USING (true);

-- Phase 4: Storage policies for pending-resources bucket
CREATE POLICY "Uploader and admins can access pending resources"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'pending-resources'
  AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR public.has_role(auth.uid(), 'admin')
  )
);

CREATE POLICY "Users can upload to pending resources"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'pending-resources'
  AND (storage.foldername(name))[1] = auth.uid()::text
  AND EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND COALESCE(profiles.referral_count, 0) >= 1
  )
);

CREATE POLICY "Service role manages pending resources"
ON storage.objects
FOR ALL
USING (bucket_id = 'pending-resources');

-- Phase 4: Storage policies for approved-resources bucket
CREATE POLICY "Users with referrals can access approved resources"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'approved-resources'
  AND EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND COALESCE(profiles.referral_count, 0) >= 1
  )
);

CREATE POLICY "Service role manages approved resources"
ON storage.objects
FOR ALL
USING (bucket_id = 'approved-resources');