
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

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
        <CardContent>
          <p className="text-muted-foreground">Tutor settings will be available here.</p>
        </CardContent>
      </Card>
    </div>
  );
};
