'use client';

import { useMemo } from 'react';
import { Lesson, lessonHours } from '../types';

interface Props {
  lessons: Lesson[];
  rangeStart: Date;
  rangeEnd: Date;
}

interface Metric {
  value: string;
  label: string;
  emphasis?: boolean;
}

export default function TotalsStrip({ lessons, rangeStart, rangeEnd }: Props) {
  const metrics = useMemo<Metric[]>(() => {
    const inRange = lessons.filter((l) => {
      const t = new Date(l.startTime).getTime();
      return t >= rangeStart.getTime() && t <= rangeEnd.getTime();
    });

    const completed = inRange.filter((l) => l.status === 'completed');
    const scheduled = inRange.filter((l) => l.status === 'scheduled');
    const cancelled = inRange.filter((l) => l.status === 'cancelled').length;
    const noShow = inRange.filter((l) => l.status === 'no_show').length;

    const now = Date.now();
    const futureHeavy =
      inRange.length > 0 &&
      inRange.filter((l) => new Date(l.startTime).getTime() > now).length >
        inRange.length / 2;

    const hoursTaught = completed.reduce((sum, l) => sum + lessonHours(l), 0);
    const hoursScheduled = scheduled.reduce(
      (sum, l) => sum + lessonHours(l),
      0,
    );

    return [
      futureHeavy
        ? {
            value: hoursScheduled.toFixed(1),
            label: 'Hours scheduled',
            emphasis: true,
          }
        : {
            value: hoursTaught.toFixed(1),
            label: 'Hours taught',
            emphasis: true,
          },
      {
        value: String(futureHeavy ? scheduled.length : completed.length),
        label: futureHeavy ? 'Lessons upcoming' : 'Lessons completed',
      },
      { value: String(cancelled), label: 'Cancelled' },
      { value: String(noShow), label: 'No-show' },
    ];
  }, [lessons, rangeStart, rangeEnd]);

  return (
    <div className="flex flex-wrap items-end gap-x-10 gap-y-4 border-y border-spicy-dark/10 py-5">
      {metrics.map((m, i) => (
        <div key={m.label} className="flex items-baseline gap-3">
          <span
            className={`font-display leading-none ${
              m.emphasis
                ? 'text-[34px] font-bold text-spicy-dark'
                : 'text-[28px] font-semibold text-spicy-dark/85'
            }`}
          >
            {m.value}
          </span>
          <span className="text-[11px] uppercase tracking-[0.14em] text-spicy-dark/50">
            {m.label}
          </span>
          {i < metrics.length - 1 && (
            <span
              aria-hidden
              className="ml-6 hidden h-6 w-px self-center bg-spicy-dark/10 sm:block"
            />
          )}
        </div>
      ))}
    </div>
  );
}
