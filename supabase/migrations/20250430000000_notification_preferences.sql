
-- Create notification_preferences table
CREATE TABLE public.notification_preferences (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    session_reminders boolean DEFAULT true NOT NULL,
    new_messages boolean DEFAULT true NOT NULL,
    resource_updates boolean DEFAULT true NOT NULL,
    platform_updates boolean DEFAULT false NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL,
    CONSTRAINT unique_user_notification_prefs UNIQUE (user_id)
);

-- Add appropriate indexes
CREATE INDEX notification_preferences_user_id_idx ON public.notification_preferences (user_id);

-- Add RLS policies
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to read only their own notification preferences
CREATE POLICY notification_preferences_select_policy 
  ON public.notification_preferences 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Policy to allow users to update only their own notification preferences
CREATE POLICY notification_preferences_update_policy 
  ON public.notification_preferences 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Policy to allow users to insert only their own notification preferences
CREATE POLICY notification_preferences_insert_policy 
  ON public.notification_preferences 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Create function for updating the 'updated_at' timestamp
CREATE OR REPLACE FUNCTION update_notification_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatically updating 'updated_at'
CREATE TRIGGER notification_preferences_updated_at_trigger
BEFORE UPDATE ON public.notification_preferences
FOR EACH ROW
EXECUTE FUNCTION update_notification_preferences_updated_at();
