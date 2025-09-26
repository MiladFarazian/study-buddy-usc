import ReviewCard from "./ReviewCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import StarRating from "@/components/ui/StarRating";
import { useStudentReviews, StudentReviewWithNames } from "@/hooks/useStudentReviews";
import { format } from "date-fns";
import { useState, useMemo } from "react";
import { Search, Filter, RefreshCw, Eye } from "lucide-react";

interface ReviewsTableProps {
  onRefresh?: () => void;
}

export const ReviewsTable = ({ onRefresh }: ReviewsTableProps) => {
  const { reviews, loading, error, refetch } = useStudentReviews();
  console.log('[Admin ReviewsTable] loading:', loading, 'count:', reviews.length, 'error:', error);
  const [searchTerm, setSearchTerm] = useState("");
  const [ratingFilter, setRatingFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateRange, setDateRange] = useState("all");

  const formatName = (firstName: string | null, lastName: string | null) => {
    if (!firstName && !lastName) return "Unknown";
    return `${firstName || ""} ${lastName || ""}`.trim();
  };

  const getAttendanceStatus = (showedUp: boolean | null) => {
    if (showedUp === null) return <Badge variant="secondary">Unknown</Badge>;
    return showedUp ? (
      <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-100">
        Present
      </Badge>
    ) : (
      <Badge variant="destructive">Absent</Badge>
    );
  };

  const getCompletionStatus = (review: StudentReviewWithNames) => {
    const hasTeachingQuality = review.teaching_quality !== null;
    const hasWrittenFeedback = review.written_feedback && review.written_feedback.trim().length > 0;
    const hasStressData = review.stress_before !== null && review.stress_after !== null;
    
    if (hasTeachingQuality && hasWrittenFeedback && hasStressData) {
      return <Badge variant="default" className="bg-green-100 text-green-800">Complete</Badge>;
    } else if (hasTeachingQuality || hasWrittenFeedback) {
      return <Badge variant="secondary">Partial</Badge>;
    } else {
      return <Badge variant="destructive">Incomplete</Badge>;
    }
  };

  const getStressReduction = (before: number | null, after: number | null) => {
    if (before === null || after === null) return "No data";
    const reduction = before - after;
    const color = reduction > 0 ? 'text-green-600' : reduction < 0 ? 'text-red-600' : 'text-gray-600';
    return (
      <span className={color}>
        {reduction > 0 ? '+' : ''}{reduction}
      </span>
    );
  };

  // Filter reviews based on search and filters
  const filteredReviews = useMemo(() => {
    let filtered = reviews;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(review => {
        const studentName = formatName(review.student_first_name, review.student_last_name).toLowerCase();
        const tutorName = formatName(review.tutor_first_name, review.tutor_last_name).toLowerCase();
        const feedback = (review.written_feedback || '').toLowerCase();
        const search = searchTerm.toLowerCase();
        
        return studentName.includes(search) || 
               tutorName.includes(search) || 
               feedback.includes(search);
      });
    }

    // Rating filter
    if (ratingFilter !== "all") {
      const minRating = parseInt(ratingFilter);
      filtered = filtered.filter(review => 
        review.teaching_quality !== null && review.teaching_quality >= minRating
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(review => {
        const hasTeachingQuality = review.teaching_quality !== null;
        const hasWrittenFeedback = review.written_feedback && review.written_feedback.trim().length > 0;
        const hasStressData = review.stress_before !== null && review.stress_after !== null;
        
        if (statusFilter === "complete") {
          return hasTeachingQuality && hasWrittenFeedback && hasStressData;
        } else if (statusFilter === "partial") {
          return (hasTeachingQuality || hasWrittenFeedback) && !(hasTeachingQuality && hasWrittenFeedback && hasStressData);
        } else if (statusFilter === "incomplete") {
          return !hasTeachingQuality && !hasWrittenFeedback;
        }
        return true;
      });
    }

    // Date range filter
    if (dateRange !== "all") {
      const now = new Date();
      const daysAgo = dateRange === "7days" ? 7 : dateRange === "30days" ? 30 : 0;
      if (daysAgo > 0) {
        const cutoffDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
        filtered = filtered.filter(review => new Date(review.created_at) >= cutoffDate);
      }
    }

    return filtered;
  }, [reviews, searchTerm, ratingFilter, statusFilter, dateRange]);

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
              <Label htmlFor="search">Search Reviews</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Student, tutor, or feedback..."
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
                  <SelectItem value="all">All Reviews</SelectItem>
                  <SelectItem value="complete">Complete Reviews</SelectItem>
                  <SelectItem value="partial">Partial Reviews</SelectItem>
                  <SelectItem value="incomplete">Incomplete Reviews</SelectItem>
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
          Showing {filteredReviews.length} of {reviews.length} reviews
        </div>
      </div>

      {/* Reviews Cards */}
      {filteredReviews.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-muted-foreground text-lg">No reviews match your current filters.</p>
            <p className="text-sm text-muted-foreground mt-2">Try adjusting your search criteria.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredReviews.map((review) => (
            <ReviewCard key={review.review_id} review={review} />
          ))}
        </div>
      )}
    </div>
  );
};