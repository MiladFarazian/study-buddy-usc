import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircleIcon, CalendarIcon, ClockIcon, MapPinIcon, UserIcon, XIcon } from 'lucide-react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { downloadICSFile, ICalEventData } from '@/lib/calendar/icsGenerator';
import { toast } from 'sonner';

interface SessionBookingConfirmationProps {
  isVisible: boolean;
  onClose: () => void;
  sessionDetails: {
    tutorName: string;
    tutorImage?: string;
    date: string;
    startTime: string;
    endTime: string;
    location: string;
    courseName?: string;
    sessionType: string;
  };
}

export function SessionBookingConfirmation({ 
  isVisible, 
  onClose, 
  sessionDetails 
}: SessionBookingConfirmationProps) {
  const navigate = useNavigate();
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isVisible) {
      // Start animation after a brief delay
      const timer = setTimeout(() => {
        setIsAnimating(true);
      }, 100);
      return () => clearTimeout(timer);
    } else {
      setIsAnimating(false);
    }
  }, [isVisible]);

  if (!isVisible) return null;

  const handleClose = () => {
    setIsAnimating(false);
    setTimeout(onClose, 300); // Wait for animation to complete
  };

  const handleAddToCalendar = () => {
    const eventData: ICalEventData = {
      title: `Tutoring Session with ${sessionDetails.tutorName}`,
      description: sessionDetails.courseName 
        ? `${sessionDetails.courseName} tutoring session`
        : 'Tutoring session',
      location: sessionDetails.location,
      startDate: new Date(`${sessionDetails.date} ${sessionDetails.startTime}`),
      endDate: new Date(`${sessionDetails.date} ${sessionDetails.endTime}`)
    };
    
    downloadICSFile(eventData, 'tutoring-session.ics');
    toast.success('Calendar event downloaded!');
  };

  return (
    <div className="fixed inset-0 z-[9999] pointer-events-none">
      {/* Backdrop */}
      <div 
        className={`
          absolute inset-0 bg-black/20 backdrop-blur-sm transition-opacity duration-300
          ${isAnimating ? 'opacity-100' : 'opacity-0'}
        `}
      />
      
      {/* Confirmation Card */}
      <div className="absolute bottom-0 left-0 right-0 pointer-events-auto">
        <div 
          className={`
            transform transition-all duration-500 ease-out
            ${isAnimating 
              ? 'translate-y-0 opacity-100' 
              : 'translate-y-full opacity-0'
            }
          `}
        >
          <Card className="mx-4 mb-4 bg-white shadow-2xl border-t-4 border-t-green-500 overflow-hidden">
            <CardContent className="p-0">
              {/* Success Header */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-6 py-4 border-b">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-green-500 rounded-full p-2 animate-pulse">
                      <CheckCircleIcon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-green-800">
                        Session Booked Successfully! 🎉
                      </h3>
                      <p className="text-sm text-green-600">
                        You&apos;ll receive a confirmation email shortly
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClose}
                    className="text-green-600 hover:text-green-800 hover:bg-green-100"
                  >
                    <XIcon className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Session Details */}
              <div className="p-6">
                <div className="grid gap-4">
                  {/* Tutor Info */}
                  <div className="flex items-center gap-3">
                    <div className="bg-primary/10 p-2 rounded-full">
                      <UserIcon className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        Tutor: {sessionDetails.tutorName}
                      </p>
                      {sessionDetails.courseName && (
                        <p className="text-sm text-gray-600">
                          Subject: {sessionDetails.courseName}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Date & Time */}
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-100 p-2 rounded-full">
                      <CalendarIcon className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {format(new Date(sessionDetails.date), 'EEEE, MMMM d, yyyy')}
                      </p>
                      <div className="flex items-center gap-2">
                        <ClockIcon className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-600">
                          {sessionDetails.startTime} - {sessionDetails.endTime}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Location */}
                  <div className="flex items-center gap-3">
                    <div className="bg-purple-100 p-2 rounded-full">
                      <MapPinIcon className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {sessionDetails.location}
                      </p>
                      <Badge variant="outline" className="mt-1 text-xs">
                        {sessionDetails.sessionType}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 mt-6 pt-4 border-t">
                  <Button 
                    onClick={handleAddToCalendar}
                    variant="outline"
                    className="flex-1"
                  >
                    📅 Add to Calendar
                  </Button>
                  <Button 
                    onClick={handleClose}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                  >
                    Perfect! 
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      handleClose();
                      navigate('/schedule', { state: { fromBooking: true } });
                    }}
                    className="flex-1"
                  >
                    View Schedule
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Floating celebration elements */}
      {isAnimating && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className={`
                absolute text-2xl animate-bounce
                ${i % 2 === 0 ? 'animate-pulse' : ''}
              `}
              style={{
                left: `${20 + (i * 15)}%`,
                top: `${30 + (i % 3) * 20}%`,
                animationDelay: `${i * 0.5}s`,
                animationDuration: '2s'
              }}
            >
              {i % 3 === 0 ? '🎉' : i % 3 === 1 ? '✨' : '🎊'}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}