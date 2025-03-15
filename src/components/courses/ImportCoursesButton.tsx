
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

      const { data, error } = await supabase.functions.invoke('fetch-usc-courses', {
        body: { term: selectedTerm },
      });

      if (error) {
        throw error;
      }

      toast({
        title: "Success",
        description: data.message || "Courses imported successfully",
      });
      
      onImportComplete();
    } catch (error) {
      console.error('Error importing courses:', error);
      toast({
        title: "Import Failed",
        description: error instanceof Error ? error.message : "Failed to import courses",
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
      <Download className="h-4 w-4" />
      {importing ? "Importing..." : "Import USC Courses"}
    </Button>
  );
};

export default ImportCoursesButton;
