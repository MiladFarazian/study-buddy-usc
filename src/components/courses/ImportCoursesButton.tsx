
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ImportCoursesButtonProps {
  selectedTerm: string;
  onImportComplete: () => void;
}

const ImportCoursesButton = ({ selectedTerm, onImportComplete }: ImportCoursesButtonProps) => {
  const [importing, setImporting] = useState(false);
  const { toast } = useToast();

  const handleImportCourses = async () => {
    if (!selectedTerm) {
      toast({
        title: "Error",
        description: "Please select a term first",
        variant: "destructive",
      });
      return;
    }

    try {
      setImporting(true);
      
      toast({
        title: "Importing Courses",
        description: "This may take a few minutes...",
      });

      console.log(`Starting USC course import for term ${selectedTerm}`);
      const { data, error } = await supabase.functions.invoke('fetch-usc-courses', {
        body: { term: selectedTerm },
      });

      if (error) {
        console.error('Course import error:', error);
        throw error;
      }

      console.log('Course import response:', data);
      
      toast({
        title: "Success",
        description: data.message || `Successfully imported ${data.coursesProcessed || 'multiple'} courses`,
      });
      
      onImportComplete();
    } catch (error) {
      console.error('Error importing courses:', error);
      toast({
        title: "Import Failed",
        description: error instanceof Error ? error.message : "Failed to import courses. Please try again.",
        variant: "destructive",
      });
    } finally {
      setImporting(false);
    }
  };

  return (
    <Button
      variant="outline"
      onClick={handleImportCourses}
      disabled={importing || !selectedTerm}
      className="flex items-center gap-2"
    >
      {importing ? (
        <>
          <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full mr-2"></div>
          Importing...
        </>
      ) : (
        <>
          <Download className="h-4 w-4" />
          Import USC Courses
        </>
      )}
    </Button>
  );
};

export default ImportCoursesButton;
