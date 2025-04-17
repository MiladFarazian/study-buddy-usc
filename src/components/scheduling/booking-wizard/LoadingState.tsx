
import { Card, CardContent } from "@/components/ui/card";

export function LoadingState() {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-usc-cardinal"></div>
          <span className="ml-2">Loading availability...</span>
        </div>
      </CardContent>
    </Card>
  );
}
