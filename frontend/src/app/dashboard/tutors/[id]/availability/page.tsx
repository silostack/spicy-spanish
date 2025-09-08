'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '../../../../utils/api';

interface AvailabilitySlot {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isRecurring: boolean;
  specificDate?: string;
  tutor: {
    id: string;
    firstName: string;
    lastName: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface CreateAvailabilityForm {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isRecurring: boolean;
  specificDate: string;
}

const DAYS_OF_WEEK = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
];

const TIME_SLOTS = [
  '06:00', '06:30', '07:00', '07:30', '08:00', '08:30', '09:00', '09:30',
  '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
  '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
  '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30',
  '22:00', '22:30', '23:00', '23:30'
];

export default function TutorAvailabilityPage() {
  const params = useParams();
  const router = useRouter();
  const tutorId = params.id as string;
  
  const [tutor, setTutor] = useState<any>(null);
  const [availability, setAvailability] = useState<AvailabilitySlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingSlot, setEditingSlot] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<CreateAvailabilityForm>({
    dayOfWeek: 1,
    startTime: '09:00',
    endTime: '17:00',
    isRecurring: true,
    specificDate: '',
  });

  useEffect(() => {
    if (tutorId) {
      fetchTutorAndAvailability();
    }
  }, [tutorId]);

  const fetchTutorAndAvailability = async () => {
    try {
      setLoading(true);
      const [tutorResponse, availabilityResponse] = await Promise.all([
        api.get(`/users/${tutorId}`),
        api.get(`/scheduling/tutors/${tutorId}/availability`)
      ]);
      
      setTutor(tutorResponse.data);
      setAvailability(availabilityResponse.data);
    } catch (error: any) {
      console.error('Error fetching data:', error);
      setError(error.response?.data?.message || 'Failed to load availability');
    } finally {
      setLoading(false);
    }
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value === 'true' ? true : value === 'false' ? false : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      setError(null);
      
      const submitData = {
        tutorId,
        ...formData,
        dayOfWeek: parseInt(formData.dayOfWeek.toString()),
        specificDate: formData.specificDate ? new Date(formData.specificDate).toISOString() : undefined
      };
      
      if (editingSlot) {
        await api.patch(`/scheduling/availability/${editingSlot}`, submitData);
      } else {
        await api.post('/scheduling/availability', submitData);
      }
      
      // Reset form and fetch updated data
      setFormData({
        dayOfWeek: 1,
        startTime: '09:00',
        endTime: '17:00',
        isRecurring: true,
        specificDate: '',
      });
      setShowAddForm(false);
      setEditingSlot(null);
      
      await fetchTutorAndAvailability();
    } catch (error: any) {
      console.error('Error saving availability:', error);
      setError(error.response?.data?.message || 'Failed to save availability');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (slot: AvailabilitySlot) => {
    setFormData({
      dayOfWeek: slot.dayOfWeek,
      startTime: slot.startTime,
      endTime: slot.endTime,
      isRecurring: slot.isRecurring,
      specificDate: slot.specificDate ? slot.specificDate.split('T')[0] : '',
    });
    setEditingSlot(slot.id);
    setShowAddForm(true);
  };

  const handleDelete = async (slotId: string) => {
    if (!confirm('Are you sure you want to delete this availability slot?')) {
      return;
    }
    
    try {
      await api.delete(`/scheduling/availability/${slotId}`);
      await fetchTutorAndAvailability();
    } catch (error: any) {
      console.error('Error deleting availability:', error);
      setError(error.response?.data?.message || 'Failed to delete availability');
    }
  };

  const getDayName = (dayOfWeek: number) => {
    return DAYS_OF_WEEK.find(d => d.value === dayOfWeek)?.label || 'Unknown';
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const cancelEdit = () => {
    setFormData({
      dayOfWeek: 1,
      startTime: '09:00',
      endTime: '17:00',
      isRecurring: true,
      specificDate: '',
    });
    setEditingSlot(null);
    setShowAddForm(false);
  };

  // Group availability by recurring and specific dates
  const recurringSlots = availability.filter(slot => slot.isRecurring);
  const specificDateSlots = availability.filter(slot => !slot.isRecurring);

  // Sort recurring slots by day of week, then by start time
  const sortedRecurringSlots = [...recurringSlots].sort((a, b) => {
    if (a.dayOfWeek !== b.dayOfWeek) {
      return a.dayOfWeek - b.dayOfWeek;
    }
    return a.startTime.localeCompare(b.startTime);
  });

  // Sort specific date slots by date
  const sortedSpecificSlots = [...specificDateSlots].sort((a, b) => {
    if (!a.specificDate || !b.specificDate) return 0;
    return new Date(a.specificDate).getTime() - new Date(b.specificDate).getTime();
  });

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-spicy-red"></div>
        </div>
      </div>
    );
  }

  if (error && !tutor) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 p-4 rounded-lg">
          <h2 className="text-xl text-red-700 font-semibold">Error</h2>
          <p className="text-red-600">{error}</p>
          <div className="mt-4">
            <Link
              href="/dashboard/tutors"
              className="text-spicy-red hover:text-spicy-orange underline"
            >
              ← Back to Tutors
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Link
            href={`/dashboard/tutors/${tutorId}`}
            className="text-spicy-red hover:text-spicy-orange mr-4"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-spicy-dark">
              {tutor?.firstName} {tutor?.lastName} - Availability
            </h1>
            <p className="text-gray-600">Manage tutor availability schedule</p>
          </div>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="bg-spicy-red hover:bg-spicy-orange text-white px-4 py-2 rounded-lg flex items-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Add Availability
        </button>
      </div>

      {error && (
        <div className="bg-red-50 p-4 rounded-lg mb-6">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {/* Add/Edit Form */}
      {showAddForm && (
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-spicy-dark mb-4">
            {editingSlot ? 'Edit Availability' : 'Add New Availability'}
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Schedule Type
                </label>
                <select
                  name="isRecurring"
                  value={formData.isRecurring.toString()}
                  onChange={handleFormChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-spicy-red"
                >
                  <option value="true">Recurring Weekly</option>
                  <option value="false">Specific Date</option>
                </select>
              </div>
              
              {formData.isRecurring ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Day of Week
                  </label>
                  <select
                    name="dayOfWeek"
                    value={formData.dayOfWeek}
                    onChange={handleFormChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-spicy-red"
                  >
                    {DAYS_OF_WEEK.map(day => (
                      <option key={day.value} value={day.value}>
                        {day.label}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Specific Date
                  </label>
                  <input
                    type="date"
                    name="specificDate"
                    value={formData.specificDate}
                    onChange={handleFormChange}
                    required={!formData.isRecurring}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-spicy-red"
                  />
                </div>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Time
                </label>
                <select
                  name="startTime"
                  value={formData.startTime}
                  onChange={handleFormChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-spicy-red"
                >
                  {TIME_SLOTS.map(time => (
                    <option key={time} value={time}>
                      {formatTime(time)}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Time
                </label>
                <select
                  name="endTime"
                  value={formData.endTime}
                  onChange={handleFormChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-spicy-red"
                >
                  {TIME_SLOTS.map(time => (
                    <option key={time} value={time}>
                      {formatTime(time)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={cancelEdit}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 bg-spicy-red text-white rounded-lg hover:bg-spicy-orange disabled:bg-gray-400 flex items-center"
              >
                {saving && (
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                )}
                {editingSlot ? 'Update' : 'Add'} Availability
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Recurring Availability */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold text-spicy-dark mb-4">Weekly Recurring Availability</h2>
        
        {sortedRecurringSlots.length > 0 ? (
          <div className="space-y-2">
            {sortedRecurringSlots.map((slot) => (
              <div key={slot.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="font-medium text-spicy-dark">
                    {getDayName(slot.dayOfWeek)}
                  </div>
                  <div className="text-gray-600">
                    {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEdit(slot)}
                    className="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(slot.id)}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">
            No recurring availability slots set up yet.
          </p>
        )}
      </div>

      {/* Specific Date Availability */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-semibold text-spicy-dark mb-4">Specific Date Availability</h2>
        
        {sortedSpecificSlots.length > 0 ? (
          <div className="space-y-2">
            {sortedSpecificSlots.map((slot) => (
              <div key={slot.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="font-medium text-spicy-dark">
                    {slot.specificDate && formatDate(slot.specificDate)}
                  </div>
                  <div className="text-gray-600">
                    {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEdit(slot)}
                    className="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(slot.id)}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">
            No specific date availability set up yet.
          </p>
        )}
      </div>
    </div>
  );
} 