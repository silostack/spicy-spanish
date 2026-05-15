import { LessonDisplayState } from '../types';

const labelMap: Record<LessonDisplayState, string> = {
  upcoming: 'Scheduled',
  'needs-attendance': 'Needs attendance',
  completed: 'Completed',
  cancelled: 'Cancelled',
  no_show: 'No-show',
};

const styleMap: Record<LessonDisplayState, string> = {
  upcoming: 'bg-white text-spicy-dark border-spicy-dark/15',
  'needs-attendance': 'bg-spicy-red text-white border-spicy-red',
  completed: 'bg-[#7a8f4a] text-white border-[#6b7f3f]',
  cancelled: 'bg-transparent text-spicy-dark/55 border-spicy-dark/25',
  no_show: 'bg-spicy-orange text-white border-spicy-orange',
};

export default function LessonStatusBadge({
  state,
}: {
  state: LessonDisplayState;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider ${styleMap[state]}`}
    >
      {labelMap[state]}
    </span>
  );
}
