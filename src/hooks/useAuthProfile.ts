
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

  const updateProfile = async (updatedProfile: Partial<Profile>) => {
    if (!userId || !profile) return null;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({
          ...updatedProfile,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select()
        .single();
      
      if (error) {
        console.error('Error updating profile:', error);
        return { error };
      }
      
      // Update the local state with the server response
      setProfile(data as Profile);
      return { data: data as Profile };
    } catch (error) {
      console.error('Profile update error:', error);
      return { error };
    }
  };

  return { profile, updateProfile, fetchProfile };
};
