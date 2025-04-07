
import { Button } from "@/components/ui/button";

interface TutorProfileCTAProps {
  tutorName: string;
  onBookSession: () => void;
}

export const TutorProfileCTA = ({ tutorName, onBookSession }: TutorProfileCTAProps) => {
  return (
    <div className="mt-12 bg-usc-cardinal text-white rounded-lg p-6">
      <div className="flex flex-col md:flex-row justify-between items-center">
        <div>
          <h2 className="text-xl md:text-2xl font-bold">Ready to get started with {tutorName}?</h2>
          <p className="mt-2">Book a session now and improve your academic performance!</p>
        </div>
        <Button 
          variant="outline" 
          className="mt-4 md:mt-0 bg-white text-usc-cardinal hover:bg-gray-100"
          onClick={onBookSession}
        >
          Book a Session
        </Button>
      </div>
    </div>
  );
};
