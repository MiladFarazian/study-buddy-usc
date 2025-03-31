
import React from 'react';
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const HomePage = () => {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Welcome to TutorTime</h1>
      <p className="mb-6">Find the perfect tutor for your needs.</p>
      <div className="flex gap-4">
        <Button asChild>
          <Link to="/tutors">Browse Tutors</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link to="/login">Login</Link>
        </Button>
      </div>
    </div>
  );
};

export default HomePage;
