import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import TutorCard from "@/components/ui/TutorCard";
import { useTutors } from "@/hooks/useTutors";
import { Loader2 } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { enableDemoMode, isDemoMode, disableDemoMode } from "@/contexts/AuthContext";

function SecretFeaturesModal({ open, onClose, onActivateDemoMode }: { open: boolean, onClose: () => void, onActivateDemoMode: () => void }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-end md:items-center justify-center">
      <div className="bg-white w-full max-w-md mx-auto rounded-t-lg md:rounded-lg shadow-xl p-6 m-0 md:mb-20">
        <h2 className="text-xl font-bold mb-4 text-usc-cardinal">🔓 Demo: All Features</h2>
        <div className="flex flex-col space-y-3 pb-3 border-b">
          <Link to="/schedule" className="font-medium text-usc-cardinal hover:underline">Schedule Page</Link>
          <Link to="/tutors" className="font-medium text-usc-cardinal hover:underline">All Tutors</Link>
          <Link to="/resources" className="font-medium text-usc-cardinal hover:underline">Resources</Link>
          <Link to="/courses" className="font-medium text-usc-cardinal hover:underline">Courses</Link>
          <Link to="/settings" className="font-medium text-usc-cardinal hover:underline">Settings</Link>
          <Link to="/students" className="font-medium text-usc-cardinal hover:underline">Students</Link>
          <Link to="/messages" className="font-medium text-usc-cardinal hover:underline">Messages</Link>
        </div>
        <Button 
          className="w-full mt-4 bg-usc-cardinal text-white hover:bg-usc-gold font-bold" 
          onClick={() => {
            onActivateDemoMode();
            onClose();
            setTimeout(() => window.location.reload(), 120); // ensure full refresh/redirect
          }}
        >
          👨‍🏫 Enter Demo Tutor Mode
        </Button>
        <Button className="w-full mt-2" variant="outline" onClick={onClose}>Close</Button>
        <div className="mt-3 text-xs text-gray-500 text-center">
          This menu is for demo/testing only.
        </div>
      </div>
    </div>
  );
}

const FeaturedTutors = () => {
  const tutorsData = useTutors();
  const authData = useAuth();
  const { tutors, loading } = tutorsData;
  const { user } = authData;
  
  const isMobile = useIsMobile();
  const [showSecret, setShowSecret] = useState(false);

  const featuredTutors = [...tutors]
    .sort((a, b) => b.rating - a.rating)
    .slice(0, isMobile ? 2 : 3);

  return (
    <div className="mt-8 md:mt-12 container px-0 relative">
      <div className="flex items-center justify-between mb-4 md:mb-6">
        <h2 className={`${isMobile ? 'text-lg' : 'text-2xl'} font-bold`}>Featured Tutors</h2>
        <Button asChild variant="ghost" className="text-usc-cardinal">
          <Link to="/tutors" className="flex items-center text-sm md:text-base">
            View All
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="ml-1 h-3 w-3 md:h-4 md:w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </Button>
      </div>
      {loading ? (
        <div className="flex justify-center items-center py-8 md:py-12">
          <Loader2 className="h-5 w-5 md:h-6 md:w-6 animate-spin text-usc-cardinal" />
          <span className="ml-2 text-sm md:text-base">Loading featured tutors...</span>
        </div>
      ) : featuredTutors.length === 0 ? (
        <div className="text-center py-8 md:py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-500">No featured tutors available at the moment.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {featuredTutors.map((tutor) => (
            <TutorCard key={tutor.id} tutor={tutor} />
          ))}
        </div>
      )}

      {!user && !isDemoMode() && (
        <>
          <Button 
            className="w-full mt-8 bg-gray-200 hover:bg-gray-300 text-usc-cardinal font-semibold"
            onClick={() => setShowSecret(true)}
          >
            🔓 Show All Features (Demo)
          </Button>
          <SecretFeaturesModal 
            open={showSecret} 
            onClose={() => setShowSecret(false)} 
            onActivateDemoMode={() => {
              enableDemoMode();
              window.dispatchEvent(new Event("demoModeChanged"));
            }} 
          />
        </>
      )}
      {isDemoMode() && (
        <div className="fixed z-40 bottom-5 right-5">
          <Button
            onClick={() => {
              disableDemoMode();
              window.dispatchEvent(new Event("demoModeChanged"));
              setTimeout(() => window.location.reload(), 120);
            }}
            className="bg-usc-cardinal text-white hover:bg-usc-gold font-bold shadow-lg"
          >
            👋 Exit Demo Mode
          </Button>
        </div>
      )}
    </div>
  );
};

export default FeaturedTutors;
