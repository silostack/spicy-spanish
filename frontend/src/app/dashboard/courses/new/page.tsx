'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCourses } from '../../../contexts/CoursesContext';
import api from '../../../utils/api';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

interface UserOption {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface ScheduleSlot {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

const CreateCoursePage = () => {
  const router = useRouter();
  const { createCourse } = useCourses();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Form fields
  const [title, setTitle] = useState('');
  const [tutorId, setTutorId] = useState('');
  const [studentIds, setStudentIds] = useState<string[]>([]);
  const [startDate, setStartDate] = useState('');
  const [schedules, setSchedules] = useState<ScheduleSlot[]>([
    { dayOfWeek: 1, startTime: '10:00', endTime: '11:00' },
  ]);

  // Options lists
  const [tutors, setTutors] = useState<UserOption[]>([]);
  const [students, setStudents] = useState<UserOption[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(true);

  useEffect(() => {
    const loadOptions = async () => {
      try {
        setLoadingOptions(true);
        const [tutorsRes, studentsRes] = await Promise.all([
          api.get('/users/tutors'),
          api.get('/users/students'),
        ]);
        const tutorsData = Array.isArray(tutorsRes.data)
          ? tutorsRes.data
          : tutorsRes.data?.items || [];
        const studentsData = Array.isArray(studentsRes.data)
          ? studentsRes.data
          : studentsRes.data?.items || [];
        setTutors(tutorsData);
        setStudents(studentsData);
      } catch {
        setError('Failed to load tutors and students. Please refresh and try again.');
      } finally {
        setLoadingOptions(false);
      }
    };
    loadOptions();
  }, []);

  const handleStudentToggle = (id: string) => {
    setStudentIds((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id],
    );
  };

  const addScheduleSlot = () => {
    setSchedules((prev) => [...prev, { dayOfWeek: 1, startTime: '10:00', endTime: '11:00' }]);
  };

  const removeScheduleSlot = (index: number) => {
    setSchedules((prev) => prev.filter((_, i) => i !== index));
  };

  const updateScheduleSlot = (index: number, field: keyof ScheduleSlot, value: string | number) => {
    setSchedules((prev) =>
      prev.map((slot, i) =>
        i === index ? { ...slot, [field]: field === 'dayOfWeek' ? Number(value) : value } : slot,
      ),
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    if (!tutorId) {
      setError('Please select a tutor.');
      setIsLoading(false);
      return;
    }

    if (schedules.length === 0) {
      setError('Please add at least one schedule slot.');
      setIsLoading(false);
      return;
    }

    try {
      await createCourse({
        title,
        tutorId,
        studentIds,
        startDate,
        schedules,
      });
      router.push('/dashboard/courses');
    } catch {
      setError('Failed to create course. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    router.push('/dashboard/courses');
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Create New Course</h1>
          <button onClick={handleCancel} className="text-gray-500 hover:text-gray-700">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        {loadingOptions ? (
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-spicy-red"></div>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="space-y-6">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Course Title *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-spicy-red"
                  placeholder="Enter course title"
                />
              </div>

              {/* Tutor Selector */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tutor *
                </label>
                <select
                  value={tutorId}
                  onChange={(e) => setTutorId(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-spicy-red"
                >
                  <option value="">Select a tutor...</option>
                  {tutors.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.firstName} {t.lastName} ({t.email})
                    </option>
                  ))}
                </select>
              </div>

              {/* Student Multi-Selector */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Students
                </label>
                {students.length === 0 ? (
                  <p className="text-sm text-gray-500">No students available.</p>
                ) : (
                  <div className="border border-gray-300 rounded-md max-h-48 overflow-y-auto divide-y divide-gray-100">
                    {students.map((s) => (
                      <label
                        key={s.id}
                        className="flex items-center px-3 py-2 hover:bg-gray-50 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={studentIds.includes(s.id)}
                          onChange={() => handleStudentToggle(s.id)}
                          className="h-4 w-4 text-spicy-red focus:ring-spicy-red border-gray-300 rounded mr-3"
                        />
                        <span className="text-sm text-gray-700">
                          {s.firstName} {s.lastName}{' '}
                          <span className="text-gray-400">({s.email})</span>
                        </span>
                      </label>
                    ))}
                  </div>
                )}
                {studentIds.length > 0 && (
                  <p className="text-xs text-gray-500 mt-1">
                    {studentIds.length} student(s) selected
                  </p>
                )}
              </div>

              {/* Start Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date *
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-spicy-red"
                />
              </div>

              {/* Schedule Slots */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Weekly Schedule *
                  </label>
                  <button
                    type="button"
                    onClick={addScheduleSlot}
                    className="text-sm text-spicy-red hover:text-spicy-orange font-medium flex items-center"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 mr-1"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                    Add Slot
                  </button>
                </div>

                <div className="space-y-3">
                  {schedules.map((slot, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 p-3 border border-gray-200 rounded-md bg-gray-50"
                    >
                      {/* Day of week */}
                      <select
                        value={slot.dayOfWeek}
                        onChange={(e) => updateScheduleSlot(index, 'dayOfWeek', e.target.value)}
                        className="flex-1 px-2 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-spicy-red"
                      >
                        {DAY_NAMES.map((day, dayIndex) => (
                          <option key={dayIndex} value={dayIndex}>
                            {day}
                          </option>
                        ))}
                      </select>

                      {/* Start time */}
                      <input
                        type="time"
                        value={slot.startTime}
                        onChange={(e) => updateScheduleSlot(index, 'startTime', e.target.value)}
                        className="px-2 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-spicy-red"
                      />

                      <span className="text-gray-400 text-sm">to</span>

                      {/* End time */}
                      <input
                        type="time"
                        value={slot.endTime}
                        onChange={(e) => updateScheduleSlot(index, 'endTime', e.target.value)}
                        className="px-2 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-spicy-red"
                      />

                      {/* Remove button */}
                      {schedules.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeScheduleSlot(index)}
                          className="text-red-400 hover:text-red-600 flex-shrink-0"
                          aria-label="Remove slot"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-4 mt-8">
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-4 py-2 bg-spicy-red text-white rounded-md hover:bg-spicy-orange disabled:opacity-50"
              >
                {isLoading ? 'Creating...' : 'Create Course'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default CreateCoursePage;
