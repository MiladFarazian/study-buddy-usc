
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Profile } from "@/types/profile";

export const useAuthProfile = (userId: string | undefined) => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchProfile = async (id: string) => {
    setLoading(true);
    try {
      console.log("Fetching profile for user ID:", id);
      // Use safe_profiles to exclude Stripe IDs from client access
      const { data, error } = await supabase
        .from('safe_profiles')
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
        console.log("Profile fetched successfully:", {
          first_name: data.first_name,
          last_name: data.last_name,
          major: data.major
        });
        setProfile(data as Profile);
      } else {
        console.log("No profile found for user ID:", id);
      }
    } catch (error) {
      console.error('Profile fetch error:', error);
    } finally {
      setLoading(false);
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
    if (!userId || !profile) return { success: false, error: "No user ID or profile found" };
    
    setLoading(true);
    try {
      // Ensure role is properly typed if it's included
      const profileUpdate = {
        ...updatedProfile,
        updated_at: new Date().toISOString()
      };
      
      const { data, error } = await supabase
        .from('profiles')
        .update(profileUpdate)
        .eq('id', userId)
        .select()
        .single();
      
      if (error) {
        console.error('Error updating profile:', error);
        toast({
          title: "Error",
          description: "Failed to update your profile. Please try again.",
          variant: "destructive",
        });
        return { success: false, error };
      }
      
      // Immediately update the local state with the server response
      console.log('Profile updated successfully:', data);
      setProfile(data as Profile);
      
      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully.",
      });
      
      return { success: true, error: null };
    } catch (error) {
      console.error('Profile update error:', error);
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  };

  return { profile, loading, updateProfile, fetchProfile };
};
