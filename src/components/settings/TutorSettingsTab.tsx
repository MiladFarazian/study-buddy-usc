
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Eye, EyeOff, Users, Calendar } from "lucide-react";

export const TutorSettingsTab = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profileVisibility, setProfileVisibility] = useState<string>('public');
  const [maxWeeklySessions, setMaxWeeklySessions] = useState<string>('');

  useEffect(() => {
    loadSettings();
  }, [user?.id]);

  const loadSettings = async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('tutors')
        .select('profile_visibility, max_weekly_sessions')
        .eq('profile_id', user.id)
        .single();

      if (error) throw error;

      if (data) {
        setProfileVisibility(data.profile_visibility || 'public');
        setMaxWeeklySessions(data.max_weekly_sessions?.toString() || '');
      }
    } catch (error) {
      console.error('Error loading tutor settings:', error);
      toast({
        title: "Error",
        description: "Failed to load your settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user?.id) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('tutors')
        .update({
          profile_visibility: profileVisibility,
          max_weekly_sessions: maxWeeklySessions ? parseInt(maxWeeklySessions) : null,
        })
        .eq('profile_id', user.id);

      if (error) throw error;

      toast({
        title: "Settings Saved",
        description: "Your tutor settings have been updated successfully.",
      });
    } catch (error) {
      console.error('Error saving tutor settings:', error);
      toast({
        title: "Error",
        description: "Failed to save your settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-usc-cardinal" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Profile Visibility
          </CardTitle>
          <CardDescription>
            Control who can see and book sessions with you
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="visibility">Visibility Setting</Label>
            <Select value={profileVisibility} onValueChange={setProfileVisibility}>
              <SelectTrigger id="visibility">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="public">
                  <div className="flex items-center gap-2">
                    <Eye className="h-4 w-4" />
                    <div>
                      <div className="font-medium">Public</div>
                      <div className="text-xs text-muted-foreground">Visible to all students</div>
                    </div>
                  </div>
                </SelectItem>
                <SelectItem value="course_match">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <div>
                      <div className="font-medium">Course Match Only</div>
                      <div className="text-xs text-muted-foreground">Only visible to students in courses you teach</div>
                    </div>
                  </div>
                </SelectItem>
                <SelectItem value="hidden">
                  <div className="flex items-center gap-2">
                    <EyeOff className="h-4 w-4" />
                    <div>
                      <div className="font-medium">Hidden</div>
                      <div className="text-xs text-muted-foreground">Not visible in tutor search (existing students can still book)</div>
                    </div>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              {profileVisibility === 'public' && "Your profile will appear in all tutor searches."}
              {profileVisibility === 'course_match' && "Only students enrolled in courses you teach will see your profile."}
              {profileVisibility === 'hidden' && "Your profile won't appear in searches, but students you've worked with can still book sessions."}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Weekly Session Limit
          </CardTitle>
          <CardDescription>
            Set a maximum number of sessions you want to teach per week
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="max-sessions">Max Sessions Per Week</Label>
            <Input
              id="max-sessions"
              type="number"
              min="1"
              max="50"
              placeholder="No limit"
              value={maxWeeklySessions}
              onChange={(e) => setMaxWeeklySessions(e.target.value)}
            />
            <p className="text-sm text-muted-foreground">
              {maxWeeklySessions 
                ? `Students won't be able to book sessions once you reach ${maxWeeklySessions} session${parseInt(maxWeeklySessions) > 1 ? 's' : ''} in a calendar week (Sunday-Saturday).`
                : "Leave empty for no weekly limit."}
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-usc-cardinal hover:bg-usc-cardinal-dark"
        >
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            'Save Settings'
          )}
        </Button>
      </div>
    </div>
  );
};
