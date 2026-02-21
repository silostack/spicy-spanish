'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../utils/api';

interface Appointment {
  id: string;
  student: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  tutor: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  course?: {
    id: string;
    title: string;
    learningLevel: string;
  };
  startTime: string;
  endTime: string;
  status: string;
  notes?: string;
}

interface ClassReport {
  id: string;
  appointment: Appointment;
  tutor: {
    id: string;
    firstName: string;
    lastName: string;
  };
  subject: string;
  content: string;
  homeworkAssigned?: string;
  studentProgress?: string;
  nextLessonNotes?: string;
  createdAt: string;
  updatedAt: string;
}

const ClassReportsPage = () => {
  const { user } = useAuth();
  const [completedAppointments, setCompletedAppointments] = useState<Appointment[]>([]);
  const [classReports, setClassReports] = useState<Map<string, ClassReport>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [showReportForm, setShowReportForm] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    subject: '',
    content: '',
    homeworkAssigned: '',
    studentProgress: '',
    nextLessonNotes: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user?.role === 'tutor') {
      fetchCompletedAppointments();
    }
  }, [user]);

  const fetchCompletedAppointments = async () => {
    try {
      setIsLoading(true);
      setError('');

      // Fetch completed appointments for this tutor
      const response = await api.get(`/scheduling/tutors/${user?.id}/appointments`);
      const appointments = response.data || [];
      
      // Filter for completed appointments
      const completed = appointments.filter((apt: Appointment) => apt.status === 'completed');
      setCompletedAppointments(completed);

      // Fetch existing class reports for these appointments
      const reportsMap = new Map<string, ClassReport>();
      await Promise.all(
        completed.map(async (appointment: Appointment) => {
          try {
            const reportResponse = await api.get(`/scheduling/class-reports/appointment/${appointment.id}`);
            if (reportResponse.data) {
              reportsMap.set(appointment.id, reportResponse.data);
            }
          } catch (error) {
            // Report doesn't exist yet
          }
        })
      );

      setClassReports(reportsMap);
    } catch (error: any) {
      setError('Failed to load completed lessons');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateReport = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setFormData({
      subject: '',
      content: '',
      homeworkAssigned: '',
      studentProgress: '',
      nextLessonNotes: '',
    });
    setShowReportForm(true);
  };

  const handleEditReport = (appointment: Appointment, report: ClassReport) => {
    setSelectedAppointment(appointment);
    setFormData({
      subject: report.subject,
      content: report.content,
      homeworkAssigned: report.homeworkAssigned || '',
      studentProgress: report.studentProgress || '',
      nextLessonNotes: report.nextLessonNotes || '',
    });
    setShowReportForm(true);
  };

  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAppointment) return;

    try {
      setIsSubmitting(true);
      setError('');

      const existingReport = classReports.get(selectedAppointment.id);

      if (existingReport) {
        // Update existing report
        const response = await api.patch(`/scheduling/class-reports/${existingReport.id}`, formData);
        setClassReports(prev => new Map(prev.set(selectedAppointment.id, response.data)));
      } else {
        // Create new report
        const response = await api.post('/scheduling/class-reports', {
          appointmentId: selectedAppointment.id,
          tutorId: user?.id,
          ...formData,
        });
        setClassReports(prev => new Map(prev.set(selectedAppointment.id, response.data)));
      }

      setShowReportForm(false);
      setSelectedAppointment(null);
    } catch (error: any) {
      setError('Failed to save class report');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (user?.role !== 'tutor') {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <h3 className="text-red-800 font-medium">Access Denied</h3>
          <p className="text-red-700">Only tutors can access class reports.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Class Reports</h1>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        {/* Completed Lessons Table */}
        <div className="bg-white rounded-lg border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date & Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Student
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Course
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Report Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                      Loading completed lessons...
                    </td>
                  </tr>
                ) : completedAppointments.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                      No completed lessons found
                    </td>
                  </tr>
                ) : (
                  completedAppointments.map((appointment) => {
                    const report = classReports.get(appointment.id);
                    
                    return (
                      <tr key={appointment.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {formatDateTime(appointment.startTime)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {appointment.student.firstName} {appointment.student.lastName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {appointment.course ? 
                            `${appointment.course.title} (${appointment.course.learningLevel.charAt(0).toUpperCase() + appointment.course.learningLevel.slice(1)})` 
                            : 'No course assigned'
                          }
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {report ? (
                            <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                              Report Completed
                            </span>
                          ) : (
                            <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                              Report Pending
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          {report ? (
                            <button
                              onClick={() => handleEditReport(appointment, report)}
                              className="text-indigo-600 hover:text-indigo-900 mr-4"
                            >
                              Edit Report
                            </button>
                          ) : (
                            <button
                              onClick={() => handleCreateReport(appointment)}
                              className="text-green-600 hover:text-green-900 mr-4"
                            >
                              Create Report
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Class Report Form Modal */}
        {showReportForm && selectedAppointment && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-2xl shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Class Report - {selectedAppointment.student.firstName} {selectedAppointment.student.lastName}
                </h3>
                <p className="text-sm text-gray-600 mb-6">
                  {formatDateTime(selectedAppointment.startTime)} | {selectedAppointment.course?.title || 'No course assigned'}
                </p>

                <form onSubmit={handleSubmitReport} className="space-y-4">
                  <div>
                    <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
                      Lesson Subject *
                    </label>
                    <input
                      type="text"
                      id="subject"
                      value={formData.subject}
                      onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., Past Tense Verbs, Conversation Practice"
                    />
                  </div>

                  <div>
                    <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">
                      Lesson Content *
                    </label>
                    <textarea
                      id="content"
                      value={formData.content}
                      onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                      required
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Describe what was covered in this lesson..."
                    />
                  </div>

                  <div>
                    <label htmlFor="homeworkAssigned" className="block text-sm font-medium text-gray-700 mb-1">
                      Homework Assigned
                    </label>
                    <textarea
                      id="homeworkAssigned"
                      value={formData.homeworkAssigned}
                      onChange={(e) => setFormData(prev => ({ ...prev, homeworkAssigned: e.target.value }))}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Any homework or practice exercises assigned..."
                    />
                  </div>

                  <div>
                    <label htmlFor="studentProgress" className="block text-sm font-medium text-gray-700 mb-1">
                      Student Progress & Performance
                    </label>
                    <textarea
                      id="studentProgress"
                      value={formData.studentProgress}
                      onChange={(e) => setFormData(prev => ({ ...prev, studentProgress: e.target.value }))}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="How did the student perform? Areas of improvement, strengths, etc."
                    />
                  </div>

                  <div>
                    <label htmlFor="nextLessonNotes" className="block text-sm font-medium text-gray-700 mb-1">
                      Notes for Next Lesson
                    </label>
                    <textarea
                      id="nextLessonNotes"
                      value={formData.nextLessonNotes}
                      onChange={(e) => setFormData(prev => ({ ...prev, nextLessonNotes: e.target.value }))}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="What to focus on in the next lesson..."
                    />
                  </div>

                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowReportForm(false)}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                    >
                      {isSubmitting ? 'Saving...' : 'Save Report'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClassReportsPage;