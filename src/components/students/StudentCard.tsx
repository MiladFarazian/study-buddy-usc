
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Calendar, GraduationCap, Clock, UserMinus } from "lucide-react";
import { format } from "date-fns";
import { Student } from "@/hooks/useTutorStudents";
import { useIsMobile } from "@/hooks/use-mobile";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface StudentCardProps {
  student: Student;
  onRemove: (studentId: string) => Promise<void>;
}

const StudentCard: React.FC<StudentCardProps> = ({ student, onRemove }) => {
  const isMobile = useIsMobile();
  
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("");
  };

  const handleRemove = async () => {
    await onRemove(student.id);
  };

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <CardContent className={isMobile ? "p-4" : "p-6"}>
        <div className="flex flex-col gap-3 md:gap-4">
          <div className="flex items-center gap-3 md:gap-4">
            <Avatar className={`${isMobile ? "h-12 w-12" : "h-16 w-16"}`}>
              <AvatarImage src={student.avatarUrl || ""} alt={student.name} />
              <AvatarFallback className="bg-usc-cardinal text-white">
                {getInitials(student.name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className={`${isMobile ? "text-lg" : "text-xl"} font-semibold`}>{student.name}</h3>
              <p className="text-gray-500 text-sm">{student.major || "No major specified"}</p>
            </div>
          </div>
          
          <div className={`grid grid-cols-${isMobile ? "1" : "2"} gap-2 md:gap-4 py-1 md:py-2`}>
            <div className="flex items-center">
              <GraduationCap className="h-4 w-4 text-gray-500 mr-2" />
              <span className="text-xs md:text-sm text-gray-500">
                Class of {student.graduationYear || "N/A"}
              </span>
            </div>
            <div className="flex items-center">
              <Calendar className="h-4 w-4 text-gray-500 mr-2" />
              <span className="text-xs md:text-sm text-gray-500">
                Joined {format(new Date(student.joined), "MMM d, yyyy")}
              </span>
            </div>
          </div>
          
          <div className="flex items-center py-1">
            <Clock className="h-4 w-4 text-gray-500 mr-2" />
            <span className="text-xs md:text-sm text-gray-500">
              {student.sessions || 0} sessions completed
            </span>
          </div>
          
          <div className="flex gap-2 mt-1 md:mt-2">
            <Button 
              className="w-full bg-usc-cardinal hover:bg-usc-cardinal-dark text-sm md:text-base"
              disabled
            >
              Schedule Session
            </Button>
            
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="icon" className="h-9 w-9">
                  <UserMinus className="h-4 w-4 text-red-500" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className={isMobile ? "w-[90%] max-w-md" : ""}>
                <AlertDialogHeader>
                  <AlertDialogTitle>Remove Student</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to remove {student.name} from your students? 
                    This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={handleRemove}
                    className="bg-red-500 hover:bg-red-600"
                  >
                    Remove
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default StudentCard;
