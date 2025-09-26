import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useSessionReviews, SessionReviewData } from "@/hooks/useSessionReviews";
import { SessionReviewCard } from "./SessionReviewCard";
import { format } from "date-fns";
import { useState, useMemo } from "react";
import { Search, Filter, RefreshCw } from "lucide-react";

interface ReviewsTableProps {
  onRefresh?: () => void;
}

export const ReviewsTable = ({ onRefresh }: ReviewsTableProps) => {
  const { sessionReviews, loading, error, refetch } = useSessionReviews();
  const [searchTerm, setSearchTerm] = useState("");
  const [ratingFilter, setRatingFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateRange, setDateRange] = useState("all");

  const formatName = (firstName: string | null, lastName: string | null) => {
    if (!firstName && !lastName) return "Unknown";
    return `${firstName || ""} ${lastName || ""}`.trim();
  };

  const getCompletionStatus = (sessionData: SessionReviewData) => {
    const hasStudentReview = sessionData.student_review?.teaching_quality !== null;
    const hasTutorReview = sessionData.tutor_review?.engagement_level !== null;
    
    if (hasStudentReview && hasTutorReview) {
      return "complete";
    } else if (hasStudentReview || hasTutorReview) {
      return "partial";
    } else {
      return "incomplete";
    }
  };

  // Filter session reviews based on search and filters
  const filteredSessionReviews = useMemo(() => {
    let filtered = sessionReviews;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(sessionData => {
        const studentName = formatName(sessionData.student_first_name, sessionData.student_last_name).toLowerCase();
        const tutorName = formatName(sessionData.tutor_first_name, sessionData.tutor_last_name).toLowerCase();
        const studentFeedback = (sessionData.student_review?.written_feedback || '').toLowerCase();
        const tutorFeedback = (sessionData.tutor_review?.tutor_feedback || '').toLowerCase();
        const courseId = (sessionData.course_id || '').toLowerCase();
        const search = searchTerm.toLowerCase();
        
        return studentName.includes(search) || 
               tutorName.includes(search) || 
               studentFeedback.includes(search) ||
               tutorFeedback.includes(search) ||
               courseId.includes(search);
      });
    }

    // Rating filter - based on teaching quality from student reviews
    if (ratingFilter !== "all") {
      const minRating = parseInt(ratingFilter);
      filtered = filtered.filter(sessionData => 
        sessionData.student_review?.teaching_quality !== null && 
        sessionData.student_review.teaching_quality >= minRating
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(sessionData => {
        const completionStatus = getCompletionStatus(sessionData);
        return completionStatus === statusFilter;
      });
    }

    // Date range filter
    if (dateRange !== "all") {
      const now = new Date();
      const daysAgo = dateRange === "7days" ? 7 : dateRange === "30days" ? 30 : 0;
      if (daysAgo > 0) {
        const cutoffDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
        filtered = filtered.filter(sessionData => new Date(sessionData.session_date) >= cutoffDate);
      }
    }

    return filtered;
  }, [sessionReviews, searchTerm, ratingFilter, statusFilter, dateRange]);

  const handleRefresh = () => {
    refetch();
    onRefresh?.();
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
        <p className="text-muted-foreground">Loading reviews...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-destructive">Error loading reviews: {error}</p>
        <Button variant="outline" onClick={handleRefresh} className="mt-4">
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search">Search Sessions</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Student, tutor, course, or feedback..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Minimum Rating</Label>
              <Select value={ratingFilter} onValueChange={setRatingFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All ratings" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Ratings</SelectItem>
                  <SelectItem value="5">5 Stars Only</SelectItem>
                  <SelectItem value="4">4+ Stars</SelectItem>
                  <SelectItem value="3">3+ Stars</SelectItem>
                  <SelectItem value="2">2+ Stars</SelectItem>
                  <SelectItem value="1">1+ Stars</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Completion Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sessions</SelectItem>
                  <SelectItem value="complete">Complete Reviews</SelectItem>
                  <SelectItem value="partial">Partial Reviews</SelectItem>
                  <SelectItem value="incomplete">No Reviews</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Date Range</Label>
              <div className="flex gap-2">
                <Select value={dateRange} onValueChange={setDateRange}>
                  <SelectTrigger>
                    <SelectValue placeholder="All time" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="7days">Last 7 Days</SelectItem>
                    <SelectItem value="30days">Last 30 Days</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" size="sm" onClick={handleRefresh}>
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Summary */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Showing {filteredSessionReviews.length} of {sessionReviews.length} sessions with reviews
        </div>
      </div>

      {/* Session Review Cards */}
      {filteredSessionReviews.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-muted-foreground text-lg">No sessions match your current filters.</p>
            <p className="text-sm text-muted-foreground mt-2">Try adjusting your search criteria.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredSessionReviews.map((sessionData) => (
            <SessionReviewCard 
              key={sessionData.session_id} 
              sessionData={sessionData}
            />
          ))}
        </div>
      )}
    </div>
  );
};