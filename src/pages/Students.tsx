
import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Search, UserMinus } from "lucide-react";
import StudentCard from "@/components/students/StudentCard";
import AddStudentDialog from "@/components/students/AddStudentDialog";
import { useTutorStudents } from "@/hooks/useTutorStudents";
import { useToast } from "@/hooks/use-toast";

const Students = () => {
  const { students, loading, addStudent, removeStudent } = useTutorStudents();
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();

  // Filter students based on search query
  const filteredStudents = students.filter((student) =>
    student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (student.major && student.major.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleRemoveStudent = async (studentId: string) => {
    const result = await removeStudent(studentId);
    
    if (result.success) {
      toast({
        title: "Student removed",
        description: "The student has been removed from your list",
      });
    } else {
      toast({
        title: "Failed to remove student",
        description: result.error || "An error occurred",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="py-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">My Students</h1>
          <p className="text-muted-foreground">Manage your student roster and schedule sessions</p>
        </div>
        <AddStudentDialog onAddStudent={addStudent} />
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input 
          placeholder="Search students..." 
          className="pl-9" 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-usc-cardinal" />
          <span className="ml-2">Loading students...</span>
        </div>
      ) : filteredStudents.length === 0 ? (
        <div className="text-center py-12">
          {students.length === 0 ? (
            <>
              <UserMinus className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-lg text-muted-foreground">No students assigned yet.</p>
              <p className="text-muted-foreground mb-4">Use the "Add Student" button to add students to your roster.</p>
            </>
          ) : (
            <>
              <p className="text-lg text-muted-foreground">No students found matching your search.</p>
              <p className="text-muted-foreground">Try a different search term.</p>
            </>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStudents.map((student) => (
            <StudentCard 
              key={student.id} 
              student={student} 
              onRemove={handleRemoveStudent}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Students;
