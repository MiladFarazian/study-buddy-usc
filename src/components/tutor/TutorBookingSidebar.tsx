
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare } from "lucide-react";
import { Tutor } from "@/types/tutor";
import MessageButton from "@/components/messaging/MessageButton";

interface TutorBookingSidebarProps {
  tutor: Tutor;
}

export const TutorBookingSidebar = ({ tutor }: TutorBookingSidebarProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Contact Tutor</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <p className="font-bold text-2xl text-usc-cardinal">
            ${tutor.hourlyRate?.toFixed(2) || "25.00"}/hour
          </p>
        </div>

        <div className="space-y-4 mb-6">
          <div className="flex items-center">
            <MessageSquare className="h-5 w-5 mr-2 text-muted-foreground" />
            <div>
              <p className="font-medium">Send a message</p>
              <p className="text-sm text-muted-foreground">Ask questions or discuss your needs</p>
            </div>
          </div>
        </div>
          
        <MessageButton 
          recipient={tutor} 
          className="w-full"
        />
      </CardContent>
    </Card>
  );
}
