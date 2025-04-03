
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AvailabilitySettings } from "@/components/scheduling/AvailabilitySettings";

export const TutorSettingsTab = () => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Tutor Settings</CardTitle>
          <CardDescription>
            Manage your tutor profile and availability
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Tutor Availability</h3>
            <AvailabilitySettings />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
