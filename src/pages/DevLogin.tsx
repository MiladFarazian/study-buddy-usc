import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthMethods } from '@/hooks/useAuthMethods';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { getStripeEnvironment } from '@/lib/stripe-utils';

const DevLogin = () => {
  // Environment guard - only render in test environment
  if (getStripeEnvironment() !== 'test') {
    return <Navigate to="/" replace />;
  }

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSignUp, setIsSignUp] = useState(true);
  const { devSignUp, devSignIn } = useAuthMethods();
  const { user } = useAuth();

  // Redirect if already logged in
  if (user) {
    return <Navigate to="/" replace />;
  }

  const validateEmail = (email: string): string | null => {
    if (!email) return 'Email is required';
    if (!/\S+@\S+\.\S+/.test(email)) return 'Please enter a valid email';
    if (email.toLowerCase().endsWith('@usc.edu')) {
      return 'USC emails are not allowed in dev login. Use Google SSO instead.';
    }
    return null;
  };

  const validatePassword = (password: string): string | null => {
    if (!password) return 'Password is required';
    if (password.length < 6) return 'Password must be at least 6 characters';
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const emailError = validateEmail(email);
    const passwordError = validatePassword(password);
    
    if (emailError || passwordError) {
      return;
    }

    setIsSubmitting(true);

    try {
      const result = isSignUp ? 
        await devSignUp(email, password) : 
        await devSignIn(email, password);
      
      if (!result.error) {
        // Success - user will be redirected by auth state change
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md space-y-8 px-4">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-foreground">Dev Login</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Testing environment only
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{isSignUp ? 'Create Test Student' : 'Sign In'}</CardTitle>
            <CardDescription>
              {isSignUp ? 'Create a test student account' : 'Sign in to existing test account'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="test@example.com"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Note: USC emails (@usc.edu) are blocked in dev mode
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password (min 6 characters)"
                  required
                />
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Processing...' : (isSignUp ? 'Create Student Account' : 'Sign In')}
              </Button>
            </form>

            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-sm text-primary hover:underline"
              >
                {isSignUp ? 'Already have a test account? Sign in' : 'Need a test account? Create one'}
              </button>
            </div>

            <div className="mt-6 pt-4 border-t border-border">
              <Link 
                to="/register" 
                className="text-sm text-primary hover:underline block text-center"
              >
                ← Back to main registration
              </Link>
            </div>
          </CardContent>
        </Card>

        <div className="text-center">
          <p className="text-xs text-muted-foreground">
            For testing purposes only • Not available in production
          </p>
        </div>
      </div>
    </div>
  );
};

export default DevLogin;