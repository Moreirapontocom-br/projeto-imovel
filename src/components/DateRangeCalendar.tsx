import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { AvailabilityBlock, DateRange } from '@/types';
import { addDays, addMonths, eachNight, fmtMonth, toDate, toIso } from '@/lib/dates';
import { brand } from '@/config/brand';

interface Props {
  value: DateRange | null;
  onChange(r: DateRange | null): void;
  busy?: Map<string, AvailabilityBlock['kind']>;
  minNights?: number;
  months?: 1 | 2;
  readOnly?: boolean;
}

const WEEK = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
const CARNIVAL = new Set(eachNight({ start: brand.defaultRange.start, end: addDays(brand.defaultRange.end, 1) }));

export function DateRangeCalendar({ value, onChange, busy = new Map(), minNights = 1, months = 2, readOnly }: Props) {
  const win = brand.calendarWindow;
  const firstMonth = win.start.slice(0, 8) + '01';
  const [offset, setOffset] = useState(value ? Math.max(0, monthDiff(firstMonth, value.start.slice(0, 8) + '01') - (months - 1)) : 0);
  const [anchor, setAnchor] = useState<string | null>(null);
  const [hover, setHover] = useState<string | null>(null);
  const [msg, setMsg] = useState('');
  const lastMonth = win.end.slice(0, 8) + '01';
  const maxOffset = monthDiff(firstMonth, lastMonth) - (months - 1);

  const shown = useMemo(() => Array.from({ length: months }, (_, i) => addMonths(firstMonth, offset + i)), [firstMonth, offset, months]);

  const rangeFree = (a: string, b: string) => eachNight({ start: a, end: b }).every((d) => !busy.has(d));

  function pick(d: string) {
    if (readOnly) return;
    setMsg('');
    if (!anchor) {
      if (busy.has(d)) return;
      setAnchor(d);
      onChange(null);
      return;
    }
    if (d <= anchor) { if (!busy.has(d)) setAnchor(d); return; }
    if (!rangeFree(anchor, d)) { setMsg('Esse período passa por datas indisponíveis.'); return; }
    const nights = eachNight({ start: anchor, end: d }).length;
    if (nights < minNights) { setMsg(`Estadia mínima de ${minNights} noites.`); return; }
    onChange({ start: anchor, end: d });
    setAnchor(null);
  }

  const inPreview = (d: string) => {
    if (anchor && hover && hover > anchor) return d >= anchor && d <= hover;
    if (!anchor && value) return d >= value.start && d <= value.end;
    return false;
  };

  return (
    <div className="cal">
      <div className="cal-nav">
        <button type="button" className="icon-btn" aria-label="Mês anterior" disabled={offset <= 0} onClick={() => setOffset(offset - 1)}><ChevronLeft size={18} /></button>
        <button type="button" className="icon-btn" aria-label="Próximo mês" disabled={offset >= maxOffset} onClick={() => setOffset(offset + 1)}><ChevronRight size={18} /></button>
      </div>
      <div className="cal-months" style={{ gridTemplateColumns: `repeat(${months}, minmax(0, 1fr))` }}>
        {shown.map((m) => (
          <div key={m} className="cal-month">
            <h4>{fmtMonth(m)}</h4>
            <div className="cal-grid" role="grid" onMouseLeave={() => setHover(null)}>
              {WEEK.map((w, i) => <span key={i} className="cal-wd" aria-hidden>{w}</span>)}
              {daysOf(m).map((d, i) => {
                if (!d) return <span key={i} />;
                const out = d < win.start || d > win.end;
                const kind = busy.get(d);
                const isStart = (anchor ?? value?.start) === d;
                const isEnd = !anchor && value?.end === d;
                const cls = [
                  'cal-day',
                  kind && `is-${kind}`,
                  inPreview(d) && 'in-range',
                  isStart && 'is-start',
                  isEnd && 'is-end',
                  CARNIVAL.has(d) && 'is-carnival',
                ].filter(Boolean).join(' ');
                return (
                  <button
                    key={d}
                    type="button"
                    className={cls}
                    disabled={out || (!!kind && !anchor) || readOnly}
                    aria-pressed={isStart || isEnd}
                    aria-label={`${toDate(d).getUTCDate()} de ${fmtMonth(m)}${kind ? kind === 'bloqueio' ? ', bloqueado' : ', reservado' : ''}`}
                    onClick={() => pick(d)}
                    onMouseEnter={() => setHover(d)}
                  >
                    {toDate(d).getUTCDate()}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      <div className="cal-foot">
        <span className="cal-key"><i className="k-carnival" />Carnaval</span>
        <span className="cal-key"><i className="k-busy" />Indisponível</span>
        {!readOnly && (value || anchor) && (
          <button type="button" className="link-btn" onClick={() => { setAnchor(null); onChange(null); setMsg(''); }}>Limpar datas</button>
        )}
      </div>
      <p className="cal-msg" role="status">{msg || (anchor ? 'Agora escolha a data de saída.' : '')}</p>
    </div>
  );
}

function daysOf(monthIso: string) {
  const d = toDate(monthIso);
  const lead = d.getUTCDay();
  const out: (string | null)[] = Array(lead).fill(null);
  const m = d.getUTCMonth();
  while (d.getUTCMonth() === m) { out.push(toIso(d)); d.setUTCDate(d.getUTCDate() + 1); }
  return out;
}

const monthDiff = (a: string, b: string) => {
  const x = toDate(a), y = toDate(b);
  return (y.getUTCFullYear() - x.getUTCFullYear()) * 12 + y.getUTCMonth() - x.getUTCMonth();
};
