
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ImportCoursesButtonProps {
  selectedTerm: string;
  onImportComplete: () => void;
}

const ImportCoursesButton = ({ selectedTerm, onImportComplete }: ImportCoursesButtonProps) => {
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
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
      setProgress(0);
      
      toast({
        title: "Importing Courses",
        description: "This may take a few minutes...",
      });

      console.log(`Starting USC course import for term ${selectedTerm}`);
      
      // Set up a progress indicator
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev === null) return 5;
          return Math.min(prev + 5, 95); // Increase up to 95%
        });
      }, 3000);
      
      const { data, error } = await supabase.functions.invoke('fetch-usc-courses', {
        body: { term: selectedTerm },
      });

      clearInterval(progressInterval);
      setProgress(100);

      if (error) {
        console.error('Course import error:', error);
        throw error;
      }

      console.log('Course import response:', data);
      
      if (!data.success) {
        toast({
          title: "Import Notice",
          description: data.message || "No courses were found for this term",
          variant: "default",
        });
      } else {
        toast({
          title: "Success",
          description: data.message || `Successfully imported ${data.coursesProcessed || 'multiple'} courses`,
        });
        
        onImportComplete();
      }
    } catch (error) {
      console.error('Error importing courses:', error);
      toast({
        title: "Import Failed",
        description: error instanceof Error ? error.message : "Failed to import courses. Please try again.",
        variant: "destructive",
      });
    } finally {
      setImporting(false);
      setProgress(null);
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
          Importing... {progress !== null && `(${progress}%)`}
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
