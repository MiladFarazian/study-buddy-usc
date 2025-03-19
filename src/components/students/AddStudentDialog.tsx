
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Search, Plus, UserPlus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface AddStudentDialogProps {
  onAddStudent: (studentId: string) => Promise<{ success: boolean; error?: string }>;
}

type StudentSearchResult = {
  id: string;
  name: string;
  avatarUrl: string | null;
  major: string | null;
};

const AddStudentDialog: React.FC<AddStudentDialogProps> = ({ onAddStudent }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<StudentSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [adding, setAdding] = useState(false);
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    try {
      setSearching(true);
      
      // Search for students by name or email
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, avatar_url, major, role')
        .eq('role', 'student')
        .or(`first_name.ilike.%${searchQuery}%,last_name.ilike.%${searchQuery}%`)
        .limit(5);
      
      if (error) throw error;
      
      const results: StudentSearchResult[] = data.map(student => ({
        id: student.id,
        name: `${student.first_name || ''} ${student.last_name || ''}`.trim(),
        avatarUrl: student.avatar_url,
        major: student.major
      }));
      
      setSearchResults(results);
    } catch (error) {
      console.error('Error searching for students:', error);
      toast({
        title: "Search failed",
        description: "Failed to search for students. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSearching(false);
    }
  };

  const handleAddStudent = async (studentId: string) => {
    try {
      setAdding(true);
      
      const result = await onAddStudent(studentId);
      
      if (result.success) {
        toast({
          title: "Student added",
          description: "The student has been added to your list",
        });
        setOpen(false);
        setSearchQuery("");
        setSearchResults([]);
      } else {
        toast({
          title: "Failed to add student",
          description: result.error || "An error occurred",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error adding student:', error);
      toast({
        title: "Failed to add student",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setAdding(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-usc-cardinal hover:bg-usc-cardinal-dark">
          <UserPlus className="mr-2 h-4 w-4" />
          Add Student
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add a Student</DialogTitle>
          <DialogDescription>
            Search for students to add to your list.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex items-center space-x-2 my-4">
          <div className="grid flex-1 gap-2">
            <Label htmlFor="student-search" className="sr-only">
              Search for students
            </Label>
            <Input
              id="student-search"
              placeholder="Search by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSearch();
                }
              }}
            />
          </div>
          <Button 
            type="submit" 
            size="sm" 
            className="px-3" 
            onClick={handleSearch}
            disabled={searching || !searchQuery.trim()}
          >
            {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          </Button>
        </div>
        
        <div className="max-h-64 overflow-y-auto">
          {searchResults.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">
              {searching ? "Searching..." : "No students found. Try a different search."}
            </p>
          ) : (
            <div className="space-y-2">
              {searchResults.map((student) => (
                <div key={student.id} className="flex items-center justify-between p-2 border rounded-md">
                  <div className="flex items-center space-x-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={student.avatarUrl || ""} alt={student.name} />
                      <AvatarFallback className="bg-muted text-muted-foreground text-sm">
                        {getInitials(student.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{student.name}</p>
                      <p className="text-xs text-muted-foreground">{student.major || "No major"}</p>
                    </div>
                  </div>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    onClick={() => handleAddStudent(student.id)}
                    disabled={adding}
                  >
                    {adding ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <DialogFooter className="sm:justify-start">
          <Button variant="secondary" onClick={() => setOpen(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddStudentDialog;
