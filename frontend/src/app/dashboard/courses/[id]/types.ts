export interface CourseUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

export interface CourseSchedule {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

export interface Course {
  id: string;
  title: string;
  tutor: CourseUser;
  students: CourseUser[];
  schedules: CourseSchedule[];
  startDate: string;
  isActive: boolean;
  hoursBalance: number;
  needsRenewal: boolean;
  createdAt: string;
}

export interface Lesson {
  id: string;
  students: CourseUser[];
  tutor: CourseUser;
  startTime: string;
  endTime: string;
  status: 'scheduled' | 'completed' | 'cancelled' | 'no_show';
  notes?: string;
}

export interface AttendanceRecord {
  id: string;
  student: CourseUser;
  status: 'present' | 'absent';
}

export interface ClassReport {
  id: string;
  subject: string;
  content: string;
  homeworkAssigned?: string;
  studentProgress?: string;
  nextLessonNotes?: string;
}

export const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const formatDateTime = (value: string) =>
  new Date(value).toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
