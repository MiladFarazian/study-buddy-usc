
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const AuthSection = () => {
  const { user } = useAuth();

  if (user) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h2 className="text-xl font-semibold mb-2">Welcome back, {user.user_metadata.full_name || user.email}!</h2>
        <p className="text-gray-600 mb-4">
          Continue exploring tutoring opportunities and improve your academic performance.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Button asChild className="w-full" variant="outline">
            <Link to="/schedule">My Schedule</Link>
          </Button>
          <Button asChild className="w-full bg-usc-cardinal hover:bg-usc-cardinal-dark text-white">
            <Link to="/tutors">Find Tutors</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border">
      <h2 className="text-xl font-semibold mb-2">Join StudyBuddy</h2>
      <p className="text-gray-600 mb-4">
        Connect with qualified tutors, access course resources, and ace your classes at USC.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Button asChild variant="outline" className="w-full">
          <Link to="/login">Sign In</Link>
        </Button>
        <Button asChild className="w-full bg-usc-cardinal hover:bg-usc-cardinal-dark text-white">
          <Link to="/register">Create Account</Link>
        </Button>
      </div>
    </div>
  );
};

export default AuthSection;
