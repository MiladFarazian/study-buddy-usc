
import { BookOpen, Calendar, FileText, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

const features = [
  {
    title: "Courses",
    description: "Browse all USC courses",
    icon: BookOpen,
    path: "/courses",
    color: "bg-pink-50",
    iconColor: "text-pink-500"
  },
  {
    title: "Tutors",
    description: "Find qualified tutors",
    icon: Users,
    path: "/tutors",
    color: "bg-purple-50",
    iconColor: "text-purple-500"
  },
  {
    title: "Schedule",
    description: "Book tutoring sessions",
    icon: Calendar,
    path: "/schedule",
    color: "bg-blue-50",
    iconColor: "text-blue-500"
  },
  {
    title: "Resources",
    description: "Access study materials",
    icon: FileText,
    path: "/resources",
    color: "bg-orange-50",
    iconColor: "text-orange-500"
  }
];

const FeatureCards = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {features.map((feature) => (
        <Link
          key={feature.title}
          to={feature.path}
          className="group block"
        >
          <div className="border rounded-lg p-6 h-full transition-all hover:shadow-md">
            <div className="flex">
              <div className={cn("p-3 rounded-full", feature.color)}>
                <feature.icon className={cn("h-6 w-6", feature.iconColor)} />
              </div>
            </div>
            <h3 className="text-xl font-semibold mt-4">{feature.title}</h3>
            <p className="text-gray-500 mt-2">{feature.description}</p>
            <div className="mt-4 flex items-center text-sm font-medium text-usc-cardinal group-hover:underline">
              {`View ${feature.title}`}
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="ml-1 h-4 w-4" 
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
