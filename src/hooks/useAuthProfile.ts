
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Profile } from "@/contexts/types/auth-types";

export const useAuthProfile = (userId: string | undefined) => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const { toast } = useToast();

  const fetchProfile = async (id: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching profile:', error);
        toast({
          title: "Error",
          description: "Failed to load your profile. Please try again.",
          variant: "destructive",
        });
      } else if (data) {
        setProfile(data as Profile);
      }
    } catch (error) {
      console.error('Profile fetch error:', error);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchProfile(userId);
    } else {
      setProfile(null);
    }
  }, [userId]);

  const updateProfile = (updatedProfile: Partial<Profile>) => {
    if (profile) {
      setProfile({
        ...profile,
        ...updatedProfile,
      });
    }
  };

  return { profile, updateProfile };
};
