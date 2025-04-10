'use client';

import { useState } from 'react';
import { format, startOfWeek, addDays, isSameDay } from 'date-fns';

// Mock data - in a real app, this would come from an API
const mockTutors = [
  { id: 1, name: 'Maria Garcia' },
  { id: 2, name: 'Carlos Rodriguez' },
  { id: 3, name: 'Lucia Martinez' },
];

const mockAvailability = [
  { tutorId: 1, date: '2025-04-15', startTime: '09:00', endTime: '11:00' },
  { tutorId: 1, date: '2025-04-15', startTime: '14:00', endTime: '16:00' },
  { tutorId: 1, date: '2025-04-16', startTime: '10:00', endTime: '12:00' },
  { tutorId: 2, date: '2025-04-15', startTime: '13:00', endTime: '17:00' },
  { tutorId: 2, date: '2025-04-17', startTime: '09:00', endTime: '12:00' },
  { tutorId: 3, date: '2025-04-16', startTime: '15:00', endTime: '18:00' },
  { tutorId: 3, date: '2025-04-18', startTime: '10:00', endTime: '14:00' },
];

const mockAppointments = [
  { id: 1, tutorId: 1, date: '2025-04-15', startTime: '14:00', endTime: '15:00' },
  { id: 2, tutorId: 2, date: '2025-04-17', startTime: '10:00', endTime: '11:30' },
];

export default function Schedule() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTutor, setSelectedTutor] = useState<number | null>(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string | null>(null);
  const [bookingModalOpen, setBookingModalOpen] = useState(false);

  // Generate the week days for the calendar header
  const startOfCurrentWeek = startOfWeek(selectedDate, { weekStartsOn: 0 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(startOfCurrentWeek, i));

  // Get time slots for the selected date and tutor
  const getTimeSlots = () => {
    if (!selectedTutor) return [];
    
    const formattedDate = format(selectedDate, 'yyyy-MM-dd');
    const tutorAvailability = mockAvailability.filter(
      slot => slot.tutorId === selectedTutor && slot.date === formattedDate
    );
    
    const tutorAppointments = mockAppointments.filter(
      app => app.tutorId === selectedTutor && app.date === formattedDate
    );
    
    // This is a simplified approach - a real implementation would need to handle
    // splitting available times into bookable slots and removing booked slots
    const availableSlots: string[] = [];
    
    tutorAvailability.forEach(avail => {
      let startHour = parseInt(avail.startTime.split(':')[0]);
      const endHour = parseInt(avail.endTime.split(':')[0]);
      
      while (startHour < endHour) {
        const slotStart = `${startHour.toString().padStart(2, '0')}:00`;
        const slotEnd = `${(startHour + 1).toString().padStart(2, '0')}:00`;
        const timeSlot = `${slotStart} - ${slotEnd}`;
        
        // Check if this slot overlaps with any appointments
        const isBooked = tutorAppointments.some(app => {
          const appStartHour = parseInt(app.startTime.split(':')[0]);
          const appEndHour = parseInt(app.endTime.split(':')[0]);
          return startHour >= appStartHour && startHour < appEndHour;
        });
        
        if (!isBooked) {
          availableSlots.push(timeSlot);
        }
        
        startHour += 1;
      }
    });
    
    return availableSlots;
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    setSelectedTimeSlot(null);
  };

  const handleTutorSelect = (tutorId: number) => {
    setSelectedTutor(tutorId);
    setSelectedTimeSlot(null);
  };

  const handleTimeSlotSelect = (timeSlot: string) => {
    setSelectedTimeSlot(timeSlot);
    setBookingModalOpen(true);
  };

  const handleBookClass = () => {
    // In a real app, this would make an API call to book the class
    alert(`Class booked with ${mockTutors.find(t => t.id === selectedTutor)?.name} on ${format(selectedDate, 'MMMM d, yyyy')} at ${selectedTimeSlot}`);
    setBookingModalOpen(false);
    setSelectedTimeSlot(null);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-spicy-dark">Class Schedule</h1>
        <p className="text-gray-600">Book classes with your preferred tutors.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar - Tutor Selection */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4 text-spicy-dark">Tutors</h2>
            <div className="space-y-2">
              {mockTutors.map(tutor => (
                <button
                  key={tutor.id}
                  className={`w-full text-left px-4 py-2 rounded-md ${
                    selectedTutor === tutor.id
                      ? 'bg-spicy-red text-white'
                      : 'bg-white hover:bg-gray-100 text-gray-800'
                  }`}
                  onClick={() => handleTutorSelect(tutor.id)}
                >
                  {tutor.name}
                </button>
              ))}
            </div>

            <div className="mt-8">
              <h3 className="font-semibold mb-2">Your Classes</h3>
              {mockAppointments.length > 0 ? (
                <div className="space-y-3">
                  {mockAppointments.map(appointment => {
                    const tutor = mockTutors.find(t => t.id === appointment.tutorId);
                    return (
                      <div key={appointment.id} className="p-3 bg-spicy-light rounded-md">
                        <p className="font-medium">{new Date(appointment.date).toLocaleDateString()}</p>
                        <p className="text-sm">{appointment.startTime} - {appointment.endTime}</p>
                        <p className="text-sm text-gray-600">with {tutor?.name}</p>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-gray-600">No scheduled classes</p>
              )}
            </div>
          </div>
        </div>

        {/* Main Calendar Area */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-xl shadow-md p-6">
            {/* Calendar Header */}
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-spicy-dark">
                {format(selectedDate, 'MMMM yyyy')}
              </h2>
              <div className="flex space-x-2">
                <button
                  className="px-3 py-1 rounded-md border border-gray-300 hover:bg-gray-100"
                  onClick={() => setSelectedDate(new Date())}
                >
                  Today
                </button>
                {/* Previous/Next week buttons could be added here */}
              </div>
            </div>

            {/* Week View Calendar */}
            <div className="grid grid-cols-7 gap-2 mb-6">
              {weekDays.map((day, index) => (
                <div key={index} className="text-center">
                  <div className="text-sm text-gray-500 mb-1">
                    {format(day, 'EEE')}
                  </div>
                  <button
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      isSameDay(day, selectedDate)
                        ? 'bg-spicy-red text-white'
                        : 'hover:bg-gray-100'
                    }`}
                    onClick={() => handleDateClick(day)}
                  >
                    {format(day, 'd')}
                  </button>
                </div>
              ))}
            </div>

            {selectedTutor ? (
              <>
                <h3 className="font-semibold mb-4">
                  Available Time Slots - {format(selectedDate, 'MMMM d, yyyy')}
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  {getTimeSlots().length > 0 ? (
                    getTimeSlots().map((slot, index) => (
                      <button
                        key={index}
                        className={`p-2 text-center border rounded-md ${
                          selectedTimeSlot === slot
                            ? 'bg-spicy-red text-white border-spicy-red'
                            : 'border-gray-300 hover:border-spicy-red'
                        }`}
                        onClick={() => handleTimeSlotSelect(slot)}
                      >
                        {slot}
                      </button>
                    ))
                  ) : (
                    <p className="col-span-full text-gray-600">
                      No available slots for this day. Please select another date or tutor.
                    </p>
                  )}
                </div>
              </>
            ) : (
              <div className="text-center py-16">
                <p className="text-gray-600 mb-4">Please select a tutor to view available time slots.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Booking Modal */}
      {bookingModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <h2 className="text-xl font-semibold mb-4">Confirm Booking</h2>
            <p className="mb-4">
              You are about to book a class with{' '}
              <strong>{mockTutors.find(t => t.id === selectedTutor)?.name}</strong>
            </p>
            <p className="mb-6">
              <strong>Date:</strong> {format(selectedDate, 'MMMM d, yyyy')}
              <br />
              <strong>Time:</strong> {selectedTimeSlot}
            </p>
            <div className="flex justify-end space-x-4">
              <button
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-100"
                onClick={() => setBookingModalOpen(false)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-spicy-red text-white rounded-md hover:bg-opacity-90"
                onClick={handleBookClass}
              >
                Confirm Booking
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}