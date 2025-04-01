
import React from 'react';
import { useScheduling } from '@/contexts/SchedulingContext';
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { formatTimeDisplay } from "@/lib/scheduling/time-utils";
import { format } from 'date-fns';
import { useForm } from 'react-hook-form';

interface BookingFormData {
  name: string;
  email: string;
  notes: string;
}

export function BookingForm() {
  const { state, dispatch, calculatePrice } = useScheduling();
  const { selectedDate, selectedTimeSlot, selectedDuration, notes, studentName, studentEmail } = state;
  
  const { register, handleSubmit, formState: { errors } } = useForm<BookingFormData>({
    defaultValues: {
      name: studentName,
      email: studentEmail,
      notes: notes
    }
  });
  
  const onSubmit = (data: BookingFormData) => {
    dispatch({ 
      type: 'SET_STUDENT_INFO', 
      payload: { name: data.name, email: data.email } 
    });
    dispatch({ type: 'SET_NOTES', payload: data.notes });
  };
  
  if (!selectedDate || !selectedTimeSlot) {
    return null;
  }
  
  const formattedDate = format(selectedDate, 'EEEE, MMMM d, yyyy');
  const formattedTimeStart = formatTimeDisplay(selectedTimeSlot.start);
  const price = calculatePrice(selectedDuration);
  
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Complete Your Booking</h2>
      
      <div className="bg-gray-50 p-4 rounded-md text-sm">
        <h3 className="font-medium mb-2">Booking Summary</h3>
        <ul className="space-y-1">
          <li className="flex justify-between">
            <span className="text-muted-foreground">Date:</span>
            <span>{formattedDate}</span>
          </li>
          <li className="flex justify-between">
            <span className="text-muted-foreground">Time:</span>
            <span>{formattedTimeStart}</span>
          </li>
          <li className="flex justify-between">
            <span className="text-muted-foreground">Duration:</span>
            <span>{selectedDuration} minutes</span>
          </li>
          <li className="flex justify-between font-medium">
            <span>Total:</span>
            <span>${price.toFixed(2)}</span>
          </li>
        </ul>
      </div>
      
      <div className="space-y-4">
        <div>
          <Label htmlFor="name">Name</Label>
          <Input 
            id="name"
            value={studentName}
            onChange={(e) => dispatch({ 
              type: 'SET_STUDENT_INFO', 
              payload: { name: e.target.value, email: studentEmail } 
            })}
            placeholder="Your name"
            required
          />
          {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>}
        </div>
        
        <div>
          <Label htmlFor="email">Email</Label>
          <Input 
            id="email"
            type="email"
            value={studentEmail}
            onChange={(e) => dispatch({ 
              type: 'SET_STUDENT_INFO', 
              payload: { name: studentName, email: e.target.value } 
            })}
            placeholder="Your email address"
            required
          />
          {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>}
        </div>
        
        <div>
          <Label htmlFor="notes">Additional Notes (Optional)</Label>
          <Textarea 
            id="notes"
            value={notes}
            onChange={(e) => dispatch({ type: 'SET_NOTES', payload: e.target.value })}
            placeholder="Any specific topics or questions you'd like to cover"
            rows={3}
          />
        </div>
      </div>
    </div>
  );
}
