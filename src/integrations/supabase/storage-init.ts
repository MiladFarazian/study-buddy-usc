
import { supabase } from "./client";

/**
 * Checks if required storage buckets exist and logs error if not
 */
export const checkRequiredStorageBuckets = async () => {
  try {
    // Get list of all buckets
    const { data: buckets, error } = await supabase.storage.listBuckets();
    
    if (error) {
      console.error('Error checking storage buckets:', error);
      return;
    }
    
    // Check if profile-pictures bucket exists
    const profilePicturesBucketExists = buckets.some(
      bucket => bucket.name === 'profile-pictures'
    );
    
    if (!profilePicturesBucketExists) {
      console.error('CRITICAL: The profile-pictures storage bucket does not exist in Supabase');
      console.error('Please create this bucket in the Supabase dashboard');
    } else {
      console.log('Storage bucket check: profile-pictures bucket exists');
    }
  } catch (error) {
    console.error('Error checking storage buckets:', error);
  }
};
