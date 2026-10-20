import type { DateRange } from '@/types';

// Datas sempre em ISO (yyyy-mm-dd) e tratadas em UTC para evitar desvios de fuso.

export const toDate = (iso: string) => new Date(iso + 'T00:00:00Z');
export const toIso = (d: Date) => d.toISOString().slice(0, 10);

export const addDays = (iso: string, n: number) => {
  const d = toDate(iso);
  d.setUTCDate(d.getUTCDate() + n);
  return toIso(d);
};

export const addMonths = (iso: string, n: number) => {
  const d = toDate(iso);
  d.setUTCMonth(d.getUTCMonth() + n);
  return toIso(d);
};

export const nightsBetween = (r: DateRange) =>
  Math.round((toDate(r.end).getTime() - toDate(r.start).getTime()) / 86_400_000);

export const todayIso = () => toIso(new Date());

const short = new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'short', timeZone: 'UTC' });
const long = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC' });
const monthFmt = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric', timeZone: 'UTC' });
const weekday = new Intl.DateTimeFormat('pt-BR', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' });

export const fmtShort = (iso: string) => short.format(toDate(iso)).replace('.', '');
export const fmtLong = (iso: string) => long.format(toDate(iso));
export const fmtMonth = (iso: string) => monthFmt.format(toDate(iso));
export const fmtWeekday = (iso: string) => weekday.format(toDate(iso)).replace(/\./g, '');

export const fmtRange = (r: DateRange) => {
  const a = toDate(r.start), b = toDate(r.end);
  if (a.getUTCMonth() === b.getUTCMonth()) return `${a.getUTCDate()}–${fmtShort(r.end)}`;
  return `${fmtShort(r.start)} – ${fmtShort(r.end)}`;
};

/** Noites ocupadas [start, end) */
export const eachNight = (r: DateRange) => {
  const out: string[] = [];
  for (let d = r.start; d < r.end; d = addDays(d, 1)) out.push(d);
  return out;
};

export const overlaps = (a: DateRange, b: DateRange) => a.start < b.end && b.start < a.end;
