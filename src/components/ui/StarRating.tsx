
import { Star } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

interface StarRatingProps {
  rating: number;
  showValue?: boolean;
  className?: string;
}

const StarRating = ({ rating, showValue = true, className = "" }: StarRatingProps) => {
  const isMobile = useIsMobile();
  const starSize = isMobile ? "h-3 w-3" : "h-4 w-4";
  
  // Generate star rating display
  const renderStars = () => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    
    // Add full stars
    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <Star key={`full-${i}`} className={`${starSize} fill-yellow-400 text-yellow-400`} />
      );
    }
    
    // Add half star if needed
    if (hasHalfStar) {
      stars.push(
        <span key="half" className="relative">
          <Star className={`${starSize} text-yellow-400`} />
          <Star 
            className={`absolute top-0 left-0 ${starSize} fill-yellow-400 text-yellow-400 overflow-hidden`} 
            style={{ clipPath: 'inset(0 50% 0 0)' }} 
          />
        </span>
      );
    }
    
    // Add empty stars
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(
        <Star key={`empty-${i}`} className={`${starSize} text-gray-300`} />
      );
    }
    
    return stars;
  };

  return (
    <div className={`flex items-center ${className}`}>
      {renderStars()}
      {showValue && (
        <span className={`${isMobile ? "ml-1 text-xs" : "ml-2 text-sm"} font-medium`}>
          {rating.toFixed(1)}
        </span>
      )}
    </div>
  );
};

export default StarRating;
