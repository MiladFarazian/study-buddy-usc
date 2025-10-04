import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { CheckCircle, XCircle, Clock, AlertTriangle } from 'lucide-react';

export default function TestAutoConfirm() {
  const [sessionId, setSessionId] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [recentSessions, setRecentSessions] = useState<any[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);

  const handleTestAutoConfirm = async () => {
    if (!sessionId.trim()) {
      toast.error('Please enter a session ID');
      return;
    }

    setLoading(true);
    setResult(null);
    
    try {
      console.log('Testing auto-confirm with session ID:', sessionId);
      
      const { data, error } = await supabase.functions.invoke('auto-confirm-session', {
        body: { sessionId: sessionId.trim() }
      });

      if (error) {
        console.error('Auto-confirm error:', error);
        toast.error(`Error: ${error.message}`);
        setResult({ error: error.message, success: false });
      } else {
        console.log('Auto-confirm result:', data);
        toast.success('Auto-confirm completed successfully!');
        setResult(data);
      }
    } catch (err) {
      console.error('Unexpected error:', err);
      toast.error('Unexpected error occurred');
      setResult({ error: 'Unexpected error occurred', success: false });
    } finally {
      setLoading(false);
    }
  };

  const loadRecentSessions = async () => {
    setLoadingSessions(true);
    try {
      // Get recent sessions that might be good for testing
      const { data, error } = await supabase
        .from('sessions')
        .select('id, status, tutor_confirmed, student_confirmed, created_at, payment_status')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        console.error('Error loading sessions:', error);
        toast.error('Failed to load recent sessions');
      } else {
        setRecentSessions(data || []);
      }
    } catch (err) {
      console.error('Unexpected error loading sessions:', err);
      toast.error('Failed to load sessions');
    } finally {
      setLoadingSessions(false);
    }
  };

  const getStatusBadge = (session: any) => {
    if (session.status === 'completed') {
      return <Badge variant="default" className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />Completed</Badge>;
    }
    if (session.tutor_confirmed && session.student_confirmed) {
      return <Badge variant="secondary"><CheckCircle className="w-3 h-3 mr-1" />Both Confirmed</Badge>;
    }
    if (session.tutor_confirmed || session.student_confirmed) {
      return <Badge variant="outline"><Clock className="w-3 h-3 mr-1" />Partially Confirmed</Badge>;
    }
    return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Not Confirmed</Badge>;
  };

  React.useEffect(() => {
    loadRecentSessions();
  }, []);

  return (
    <div className="container max-w-4xl py-8">
      <Alert className="mb-6">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <strong>Debug Tool:</strong> This page is for testing the auto-confirm session functionality. 
          It will automatically confirm both student and tutor completion for any session ID you provide.
        </AlertDescription>
      </Alert>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Test Interface */}
        <Card>
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
              <div className={`mt-4 p-3 rounded-md ${result.success !== false ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                <h4 className="font-medium mb-2">
                  {result.success !== false ? '✅ Success' : '❌ Error'}
                </h4>
                <pre className="text-sm overflow-auto whitespace-pre-wrap">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Sessions */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Sessions</CardTitle>
              <CardDescription>
                Click on a session ID to use it for testing
              </CardDescription>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={loadRecentSessions}
              disabled={loadingSessions}
            >
              {loadingSessions ? 'Loading...' : 'Refresh'}
            </Button>
          </CardHeader>
          <CardContent>
            {recentSessions.length === 0 ? (
              <p className="text-muted-foreground text-sm">No sessions found</p>
            ) : (
              <div className="space-y-2">
                {recentSessions.map((session) => (
                  <div 
                    key={session.id}
                    className="p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => setSessionId(session.id)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <code className="text-xs font-mono bg-muted px-2 py-1 rounded">
                        {session.id}
                      </code>
                      {getStatusBadge(session)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Payment: {session.payment_status || 'unknown'} • 
                      Created: {new Date(session.created_at).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>How This Works</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2">
          <p>• <strong>Auto-Confirm Function:</strong> Sets both tutor_confirmed and student_confirmed to true</p>
          <p>• <strong>Session Completion:</strong> If both parties are confirmed, marks session as "completed"</p>
          <p>• <strong>Payment Processing:</strong> Creates pending transfer if payment transaction exists</p>
          <p>• <strong>Fee Calculation:</strong> 1% platform fee + 2.9% + $0.30 Stripe fee</p>
          <p>• <strong>Manual Transfer:</strong> Use the transfer-pending-funds function to actually send money</p>
        </CardContent>
      </Card>
    </div>
  );
}