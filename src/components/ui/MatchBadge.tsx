import { Badge } from "@/components/ui/badge";
import { Check, BookOpen } from "lucide-react";
import { MatchType } from "@/lib/instructor-matching-utils";

interface MatchBadgeProps {
  matchType: MatchType;
  size?: "default" | "sm" | "lg";
}

export function MatchBadge({ matchType, size = "default" }: MatchBadgeProps) {
  if (matchType === 'none') return null;

  const isExact = matchType === 'exact';

  return (
    <Badge 
      variant={isExact ? "default" : "secondary"}
      className={`
        ${size === "sm" ? "text-xs py-0.5 px-2" : ""}
        ${isExact 
          ? "bg-emerald-500 hover:bg-emerald-600 text-white" 
          : "bg-blue-100 text-blue-700 hover:bg-blue-200"
        }
      `}
    >
      {isExact ? (
        <>
          <Check className="w-3 h-3 mr-1" />
          Exact Match
        </>
      ) : (
        <>
          <BookOpen className="w-3 h-3 mr-1" />
          Course Match
        </>
      )}
    </Badge>
  );
}
