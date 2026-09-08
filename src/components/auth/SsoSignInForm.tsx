import { useState } from "react";
import { Loader2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { resolveSsoMethod } from "@/lib/auth/sso";

/**
 * Email-first sign-in with home-realm discovery.
 *
 * The user types an email; we decide whether that domain federates through
 * SAML or Google and start the matching flow. This is the standard pattern for
 * an app that has to serve both an institutional IdP and a consumer provider
 * without asking people which one they have.
 */
export function SsoSignInForm() {
  const { signInWithSso } = useAuth();
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const method = email.includes("@") ? resolveSsoMethod(email).method : null;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    const trimmed = email.trim();
    if (!trimmed) {
      setError("Enter your USC email address.");
      return;
    }

    if (resolveSsoMethod(trimmed).method === "unsupported") {
      setError("StudyBuddy is open to USC accounts only. Use your @usc.edu email.");
      return;
    }

    setIsSubmitting(true);
    const result = await signInWithSso(trimmed);

    // On success the browser is already navigating to the identity provider,
    // so leave the button in its pending state rather than flashing back.
    if (result?.error) {
      setError(result.error.message ?? "Could not start sign-in.");
      setIsSubmitting(false);
    }
  };

  const errorId = "sso-email-error";
  const hintId = "sso-email-hint";

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <div className="space-y-2">
        <Label htmlFor="sso-email">USC email address</Label>
        <Input
          id="sso-email"
          name="email"
          type="email"
          autoComplete="username"
          placeholder="you@usc.edu"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          disabled={isSubmitting}
          aria-describedby={error ? `${hintId} ${errorId}` : hintId}
          aria-invalid={error ? true : undefined}
        />
        <p id={hintId} className="text-xs text-gray-500">
          We'll send you to the right sign-in page for your account.
        </p>
        {error && (
          <p id={errorId} role="alert" className="text-sm text-usc-cardinal">
            {error}
          </p>
        )}
      </div>

      {method === "saml" && (
        <p className="flex items-center gap-2 text-xs text-gray-600">
          <ShieldCheck className="h-4 w-4" aria-hidden="true" />
          This domain uses USC single sign-on.
        </p>
      )}

      <Button
        type="submit"
        className="w-full bg-usc-cardinal hover:bg-usc-cardinal-dark"
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
            Redirecting…
          </>
        ) : (
          "Continue"
        )}
      </Button>
    </form>
  );
}

export default SsoSignInForm;
