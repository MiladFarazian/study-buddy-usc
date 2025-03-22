
import { BookOpen, Calendar, FileText, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

const features = [
  {
    title: "Courses",
    description: "Browse all USC courses",
    icon: BookOpen,
    path: "/courses",
    color: "bg-red-50",
    iconColor: "text-usc-cardinal"
  },
  {
    title: "Tutors",
    description: "Find qualified tutors",
    icon: Users,
    path: "/tutors",
    color: "bg-red-50",
    iconColor: "text-usc-cardinal"
  },
  {
    title: "Schedule",
    description: "Book tutoring sessions",
    icon: Calendar,
    path: "/schedule",
    color: "bg-red-50",
    iconColor: "text-usc-cardinal"
  },
  {
    title: "Resources",
    description: "Access study materials",
    icon: FileText,
    path: "/resources",
    color: "bg-red-50",
    iconColor: "text-usc-cardinal"
  }
];

const FeatureCards = () => {
  const isMobile = useIsMobile();
  
  return (
    <div className={`grid grid-cols-2 ${isMobile ? 'gap-3' : 'md:grid-cols-2 lg:grid-cols-4 gap-6'}`}>
      {features.map((feature) => (
        <Link
          key={feature.title}
          to={feature.path}
          className="group block"
        >
          <div className={`border rounded-lg ${isMobile ? 'p-3' : 'p-6'} h-full transition-all hover:shadow-md`}>
            <div className="flex">
              <div className={cn(`${isMobile ? 'p-2' : 'p-3'} rounded-full`, feature.color)}>
                <feature.icon className={cn(`${isMobile ? 'h-4 w-4' : 'h-6 w-6'}`, feature.iconColor)} />
              </div>
            </div>
            <h3 className={`${isMobile ? 'text-lg' : 'text-xl'} font-semibold mt-2 md:mt-4`}>{feature.title}</h3>
            <p className={`text-gray-500 ${isMobile ? 'text-xs mt-1' : 'mt-2'}`}>{feature.description}</p>
            <div className={`${isMobile ? 'mt-2 text-xs' : 'mt-4 text-sm'} flex items-center font-medium text-usc-cardinal group-hover:underline`}>
              {`View ${feature.title}`}
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className={`ml-1 ${isMobile ? 'h-3 w-3' : 'h-4 w-4'}`}
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
};

export default FeatureCards;
