'use client';

import { useEffect, useRef, useState } from 'react';
import {
  endOfDay,
  endOfMonth,
  format,
  startOfDay,
  startOfMonth,
  subDays,
  subMonths,
} from 'date-fns';
import { DateRange } from 'react-day-picker';
import { Calendar } from '../../../../components/ui/calendar';

export type RangePreset =
  | 'last-2-weeks'
  | 'this-month'
  | 'last-month'
  | 'custom';

export interface ResolvedRange {
  start: Date;
  end: Date;
  preset: RangePreset;
}

interface Props {
  value: ResolvedRange;
  onChange: (next: ResolvedRange) => void;
}

const PRESETS: { key: Exclude<RangePreset, 'custom'>; label: string }[] = [
  { key: 'last-2-weeks', label: 'Last 2 weeks' },
  { key: 'this-month', label: 'This month' },
  { key: 'last-month', label: 'Last month' },
];

export function presetRange(preset: Exclude<RangePreset, 'custom'>): {
  start: Date;
  end: Date;
} {
  const today = endOfDay(new Date());
  if (preset === 'last-2-weeks') {
    return { start: startOfDay(subDays(today, 14)), end: today };
  }
  if (preset === 'this-month') {
    return { start: startOfMonth(today), end: today };
  }
  const lastMonth = subMonths(today, 1);
  return { start: startOfMonth(lastMonth), end: endOfMonth(lastMonth) };
}

export default function RangePicker({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [draftRange, setDraftRange] = useState<DateRange | undefined>(
    value.preset === 'custom'
      ? { from: value.start, to: value.end }
      : undefined,
  );
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!popoverRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  const selectPreset = (preset: Exclude<RangePreset, 'custom'>) => {
    const { start, end } = presetRange(preset);
    onChange({ start, end, preset });
    setOpen(false);
  };

  const applyCustom = () => {
    if (draftRange?.from && draftRange?.to) {
      onChange({
        start: startOfDay(draftRange.from),
        end: endOfDay(draftRange.to),
        preset: 'custom',
      });
      setOpen(false);
    }
  };

  const summary = (() => {
    if (value.preset === 'last-2-weeks') return 'Last 2 weeks';
    if (value.preset === 'this-month') return 'This month';
    if (value.preset === 'last-month') return 'Last month';
    return `${format(value.start, 'MMM d')} – ${format(value.end, 'MMM d, yyyy')}`;
  })();

  return (
    <div className="relative" ref={popoverRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-2 rounded-full border border-spicy-dark/15 bg-white px-4 py-1.5 text-sm font-medium text-spicy-dark transition-colors hover:border-spicy-dark/30"
      >
        <span className="text-[11px] uppercase tracking-[0.1em] text-spicy-dark/50">
          Range
        </span>
        <span>{summary}</span>
        <svg
          className={`h-3.5 w-3.5 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full z-30 mt-2 w-[640px] max-w-[calc(100vw-2rem)] rounded-2xl border border-spicy-dark/10 bg-white p-4 shadow-[0_20px_60px_-20px_rgba(72,44,45,0.25)]">
          <div className="mb-3 flex flex-wrap gap-2">
            {PRESETS.map((p) => (
              <button
                key={p.key}
                type="button"
                onClick={() => selectPreset(p.key)}
                className={`rounded-full border px-3 py-1 text-sm transition-colors ${
                  value.preset === p.key
                    ? 'border-spicy-red bg-spicy-red text-white'
                    : 'border-spicy-dark/15 bg-white text-spicy-dark hover:border-spicy-dark/30'
                }`}
              >
                {p.label}
              </button>
            ))}
            <span className="ml-auto self-center text-[11px] uppercase tracking-[0.12em] text-spicy-dark/40">
              or pick a custom range below
            </span>
          </div>

          <div className="rounded-xl border border-spicy-dark/10 p-1">
            <Calendar
              mode="range"
              selected={draftRange}
              onSelect={setDraftRange}
              numberOfMonths={2}
            />
          </div>

          <div className="mt-3 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="px-3 py-1.5 text-sm text-spicy-dark/60 hover:text-spicy-dark"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={applyCustom}
              disabled={!draftRange?.from || !draftRange?.to}
              className="rounded-full bg-spicy-red px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-spicy-red/90 disabled:opacity-40"
            >
              Apply
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
