import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

export default function TestEmailButton() {
  const { toast } = useToast();
  const [sending, setSending] = useState(false);

  const sendTest = async () => {
    setSending(true);
    try {
      const { data: userRes, error: userErr } = await supabase.auth.getUser();
      if (userErr || !userRes?.user) {
        toast({ title: "Not signed in", description: "Log in to send a test email.", variant: "destructive" });
        return;
      }
      const user = userRes.user;
      const fullName = `${user.user_metadata?.first_name || ""} ${user.user_metadata?.last_name || ""}`.trim() || user.email || "USC Student";

      const { data, error } = await supabase.functions.invoke('send-notification-email', {
        body: {
          recipientUserId: user.id,
          recipientName: fullName,
          subject: 'Test: USC Study Buddy Email',
          notificationType: 'platform_update',
          data: {
            updateTitle: 'Test Email',
            updateDetails: 'This is a verification email from the test button.'
          }
        }
      });

      console.log('[TestEmailButton] function response:', { data, error });

      if (error) {
        toast({ title: 'Email failed', description: error.message || 'Unknown error', variant: 'destructive' });
      } else {
        toast({ title: 'Email sent', description: 'Check your inbox. (Also check spam)' });
      }
    } catch (e: any) {
      console.error('[TestEmailButton] unexpected error', e);
      toast({ title: 'Unexpected error', description: e.message || String(e), variant: 'destructive' });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex items-center gap-3">
      <Button onClick={sendTest} disabled={sending}>
        {sending ? 'Sending…' : 'Send Test Email'}
      </Button>
      <span className="text-sm text-muted-foreground">Visible only with ?debug=email</span>
    </div>
  );
}
