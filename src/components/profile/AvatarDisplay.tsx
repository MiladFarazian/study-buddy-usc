
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface AvatarDisplayProps {
  avatarUrl: string | null;
  userEmail?: string;
  firstName: string;
  lastName: string;
}

export const AvatarDisplay = ({
  avatarUrl,
  userEmail,
  firstName,
  lastName,
}: AvatarDisplayProps) => {
  const getInitials = (name: string = userEmail || "") => {
    if (firstName && lastName) {
      return `${firstName[0]}${lastName[0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <Avatar className="h-32 w-32 mb-4">
      <AvatarImage 
        src={avatarUrl || ""} 
        alt={userEmail || ""}
      />
      <AvatarFallback className="bg-usc-cardinal text-white text-xl">
        {getInitials(userEmail || "")}
      </AvatarFallback>
    </Avatar>
  );
};
