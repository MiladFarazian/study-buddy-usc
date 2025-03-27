
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Home() {
  const navigate = useNavigate();
  
  useEffect(() => {
    // Redirect to courses page (this is temporary until we build a proper home page)
    navigate('/courses');
  }, [navigate]);
  
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-usc-cardinal"></div>
    </div>
  );
}
