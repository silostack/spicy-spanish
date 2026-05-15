'use client';

import { format } from 'date-fns';
import { Lesson, LessonDisplayState, getLessonDisplayState } from '../types';

interface Props {
  lesson: Lesson;
  selected?: boolean;
  onClick: (lessonId: string) => void;
}

const chipClasses: Record<LessonDisplayState, string> = {
  upcoming:
    'bg-white text-spicy-dark border border-spicy-dark/15 hover:border-spicy-dark/40',
  'needs-attendance':
    'bg-spicy-red text-white border border-spicy-red animate-[pulse_2.4s_ease-in-out_infinite] hover:bg-spicy-red/90',
  completed:
    'bg-[#7a8f4a] text-white border border-[#6b7f3f] hover:bg-[#6b7f3f]',
  cancelled:
    'bg-transparent text-spicy-dark/55 border border-spicy-dark/20 line-through hover:bg-spicy-dark/5',
  no_show:
    'bg-spicy-orange text-white border border-spicy-orange hover:bg-spicy-orange/90',
};

const selectedRing =
  'ring-2 ring-spicy-dark/80 ring-offset-1 ring-offset-spicy-light';

export default function LessonChip({ lesson, selected, onClick }: Props) {
  const state = getLessonDisplayState(lesson);
  const time = format(new Date(lesson.startTime), 'h:mma').toLowerCase();

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick(lesson.id);
      }}
      className={`w-full truncate rounded-full px-2 py-[3px] text-left text-[11px] font-medium leading-tight shadow-[0_1px_0_rgba(72,44,45,0.04)] transition-all ${chipClasses[state]} ${selected ? selectedRing : ''}`}
      title={`${time} · ${lesson.students.map((s) => s.firstName).join(', ')}`}
    >
      {time}
    </button>
  );
}
