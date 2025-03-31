
import React from 'react';
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const SignupPage = () => {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Sign Up</h1>
      <p className="mb-4">Create your TutorTime account.</p>
      <div className="flex gap-4">
        <Button asChild>
          <Link to="/login">Already have an account? Login</Link>
        </Button>
      </div>
    </div>
  );
};

export default SignupPage;
