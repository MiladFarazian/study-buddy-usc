
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

interface ProfileHeaderProps {
  title: string;
}

export const ProfileHeader = ({ title }: ProfileHeaderProps) => {
  return (
    <div className="flex items-center mb-6">
      <Button variant="outline" asChild className="mr-4">
        <Link to="/" className="flex items-center">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Link>
      </Button>
      <h1 className="text-3xl font-bold">{title}</h1>
    </div>
  );
};
