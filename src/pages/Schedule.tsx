
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, Clock, User } from "lucide-react";

const Schedule = () => {
  return (
    <div className="py-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Schedule</h1>
          <p className="text-muted-foreground">Book and manage your tutoring sessions</p>
        </div>
        <Button className="bg-usc-cardinal hover:bg-usc-cardinal-dark">
          Book New Session
        </Button>
      </div>

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
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">Reschedule</Button>
                        <Button variant="outline" size="sm" className="text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600">
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
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">Reschedule</Button>
                        <Button variant="outline" size="sm" className="text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600">
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Schedule;
