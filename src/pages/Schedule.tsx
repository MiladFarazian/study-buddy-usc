
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, Clock, User, Star, MapPin, ArrowRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { AvailabilityCalendar } from "@/components/scheduling/AvailabilityCalendar";
import { format, parseISO } from "date-fns";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

const Schedule = () => {
  const { user, profile, isTutor } = useAuth();
  const navigate = useNavigate();
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [showDialog, setShowDialog] = useState(false);
  
  const formatSessionTime = (timeString: string) => {
    try {
      return format(parseISO(timeString), 'h:mm a');
    } catch (e) {
      return timeString;
    }
  };
  
  const formatSessionDate = (timeString: string) => {
    try {
      return format(parseISO(timeString), 'EEE, MMM d, yyyy');
    } catch (e) {
      return timeString;
    }
  };
  
  const handleBookNewSession = () => {
    navigate('/tutors');
  };
  
  const handleCancelSession = () => {
    setShowDialog(true);
  };
  
  return (
    <div className="py-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Schedule</h1>
          <p className="text-muted-foreground">Book and manage your tutoring sessions</p>
        </div>
        <Button 
          className="bg-usc-cardinal hover:bg-usc-cardinal-dark"
          onClick={handleBookNewSession}
        >
          Book New Session
        </Button>
      </div>

      {isTutor && (
        <div className="mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Tutor Availability</CardTitle>
              <CardDescription>
                Set your weekly availability to let students book sessions with you
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AvailabilityCalendar />
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Upcoming Sessions</CardTitle>
            <CardDescription>Your scheduled tutoring appointments</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="upcoming">
              <TabsList className="mb-4">
                <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
                <TabsTrigger value="past">Past</TabsTrigger>
                <TabsTrigger value="canceled">Canceled</TabsTrigger>
              </TabsList>
              <TabsContent value="upcoming">
                <div className="space-y-4">
                  <div className="border rounded-lg p-4 hover:shadow-sm transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex gap-4">
                        <div className="bg-usc-gold/20 text-usc-cardinal-dark rounded-md p-3 h-fit">
                          <CalendarDays className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium">CSCI 104 Tutoring</h3>
                            <Badge variant="outline" className="bg-green-50 text-green-700 hover:bg-green-50">
                              Confirmed
                            </Badge>
                          </div>
                          <div className="text-sm text-gray-500 mt-1 space-y-1">
                            <div className="flex items-center gap-2">
                              <CalendarDays className="h-3 w-3" />
                              <span>Wed, May 15, 2024</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="h-3 w-3" />
                              <span>3:00 PM - 4:00 PM</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <User className="h-3 w-3" />
                              <span>Alex Johnson</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <MapPin className="h-3 w-3" />
                              <span>Online (Zoom)</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">Reschedule</Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600"
                          onClick={handleCancelSession}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="border rounded-lg p-4 hover:shadow-sm transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex gap-4">
                        <div className="bg-usc-gold/20 text-usc-cardinal-dark rounded-md p-3 h-fit">
                          <CalendarDays className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium">ECON 203 Review</h3>
                            <Badge variant="outline" className="bg-green-50 text-green-700 hover:bg-green-50">
                              Confirmed
                            </Badge>
                          </div>
                          <div className="text-sm text-gray-500 mt-1 space-y-1">
                            <div className="flex items-center gap-2">
                              <CalendarDays className="h-3 w-3" />
                              <span>Fri, May 17, 2024</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="h-3 w-3" />
                              <span>2:00 PM - 3:30 PM</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <User className="h-3 w-3" />
                              <span>Marcus Williams</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <MapPin className="h-3 w-3" />
                              <span>Leavey Library, Room 204</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">Reschedule</Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600"
                          onClick={handleCancelSession}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="past">
                <div className="text-center py-8 text-gray-500">
                  <p>No past sessions to display</p>
                </div>
              </TabsContent>
              <TabsContent value="canceled">
                <div className="text-center py-8 text-gray-500">
                  <p>No canceled sessions to display</p>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Calendar</CardTitle>
            <CardDescription>View your schedule</CardDescription>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              className="rounded-md border"
            />
            <div className="mt-4">
              <p className="text-sm text-gray-500 mb-2">Upcoming Dates:</p>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <div className="h-2 w-2 bg-usc-cardinal rounded-full"></div>
                  <span>May 15 - CSCI 104 Tutoring</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="h-2 w-2 bg-usc-cardinal rounded-full"></div>
                  <span>May 17 - ECON 203 Review</span>
                </div>
              </div>
            </div>
            
            <div className="mt-6">
              <h3 className="text-sm font-medium mb-2">Recommended Tutors</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                      <User className="h-4 w-4 text-gray-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Sarah Chen</p>
                      <div className="flex items-center">
                        <Star className="h-3 w-3 fill-usc-gold text-usc-gold" />
                        <span className="text-xs ml-1">4.9</span>
                      </div>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                      <User className="h-4 w-4 text-gray-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Mike Johnson</p>
                      <div className="flex items-center">
                        <Star className="h-3 w-3 fill-usc-gold text-usc-gold" />
                        <span className="text-xs ml-1">4.7</span>
                      </div>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Cancel Confirmation Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Session</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel this tutoring session? Cancellations within 24 hours may be subject to a fee.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Keep Session
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => {
                // Handle session cancellation logic here
                setShowDialog(false);
              }}
            >
              Yes, Cancel Session
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Schedule;
