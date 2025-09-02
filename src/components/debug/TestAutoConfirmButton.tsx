import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const TestAutoConfirmButton = () => {
  const [sessionId, setSessionId] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleTestAutoConfirm = async () => {
    if (!sessionId.trim()) {
      toast.error('Please enter a session ID');
      return;
    }

    setLoading(true);
    try {
      console.log('Testing auto-confirm with session ID:', sessionId);
      
      const { data, error } = await supabase.functions.invoke('auto-confirm-session', {
        body: { sessionId: sessionId.trim() }
      });

      if (error) {
        console.error('Auto-confirm error:', error);
        toast.error(`Error: ${error.message}`);
        setResult({ error: error.message });
      } else {
        console.log('Auto-confirm result:', data);
        toast.success('Auto-confirm completed successfully!');
        setResult(data);
      }
    } catch (err) {
      console.error('Unexpected error:', err);
      toast.error('Unexpected error occurred');
      setResult({ error: 'Unexpected error occurred' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Test Auto-Confirm Session</CardTitle>
        <CardDescription>
          Enter a session ID to automatically confirm both student and tutor completion
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="sessionId" className="text-sm font-medium">
            Session ID
          </label>
          <Input
            id="sessionId"
            value={sessionId}
            onChange={(e) => setSessionId(e.target.value)}
            placeholder="Enter session UUID..."
            disabled={loading}
          />
        </div>
        
        <Button 
          onClick={handleTestAutoConfirm} 
          disabled={loading || !sessionId.trim()}
          className="w-full"
        >
          {loading ? 'Processing...' : 'Test Auto-Confirm'}
        </Button>

        {result && (
          <div className="mt-4 p-3 bg-muted rounded-md">
            <h4 className="font-medium mb-2">Result:</h4>
            <pre className="text-sm overflow-auto">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </CardContent>
    </Card>
  );
};