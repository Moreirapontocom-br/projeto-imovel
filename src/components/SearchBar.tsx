import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Check } from 'lucide-react';
import type { DateRange } from '@/types';
import { neighborhoods } from '@/data/geo';
import { brand } from '@/config/brand';
import { fmtRange } from '@/lib/dates';
import { DateRangeCalendar } from './DateRangeCalendar';
import { Stepper } from './ui';

interface Props {
  initial?: { bairros: string[]; range: DateRange; guests: number };
  onSubmit?(v: { bairros: string[]; range: DateRange; guests: number }): void;
  size?: 'lg' | 'md';
}

type Panel = 'bairro' | 'periodo' | 'hospedes' | null;

export function SearchBar({ initial, onSubmit, size = 'md' }: Props) {
  const nav = useNavigate();
  const [bairros, setBairros] = useState(initial?.bairros ?? []);
  const [range, setRange] = useState<DateRange | null>(initial?.range ?? brand.defaultRange);
  const [guests, setGuests] = useState(initial?.guests ?? 2);
  const [panel, setPanel] = useState<Panel>(null);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initial) { setBairros(initial.bairros); setRange(initial.range); setGuests(initial.guests); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initial?.bairros.join(','), initial?.range.start, initial?.range.end, initial?.guests]);

  useEffect(() => {
    if (!panel) return;
    const close = (e: MouseEvent) => !root.current?.contains(e.target as Node) && setPanel(null);
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setPanel(null);
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('mousedown', close); document.removeEventListener('keydown', esc); };
  }, [panel]);

  function submit() {
    const v = { bairros, range: range ?? brand.defaultRange, guests };
    setPanel(null);
    if (onSubmit) return onSubmit(v);
    const sp = new URLSearchParams();
    if (v.bairros.length) sp.set('bairro', v.bairros.join(','));
    if (v.guests !== 2) sp.set('hospedes', String(v.guests));
    if (v.range.start !== brand.defaultRange.start || v.range.end !== brand.defaultRange.end) { sp.set('inicio', v.range.start); sp.set('fim', v.range.end); }
    nav(`/buscar${sp.toString() ? '?' + sp : ''}`);
  }

  const toggle = (b: string) => setBairros((s) => (s.includes(b) ? s.filter((x) => x !== b) : [...s, b]));

  return (
    <div className={`searchbar searchbar-${size} ${panel ? 'is-open' : ''}`} ref={root} role="search">
      <button type="button" className={`sb-seg ${panel === 'bairro' ? 'is-on' : ''}`} aria-expanded={panel === 'bairro'} onClick={() => setPanel(panel === 'bairro' ? null : 'bairro')}>
        <span className="sb-label">Bairro</span>
        <span className="sb-value">{bairros.length ? bairros.join(', ') : 'Todos os bairros'}</span>
      </button>
      <span className="sb-div" aria-hidden />
      <button type="button" className={`sb-seg ${panel === 'periodo' ? 'is-on' : ''}`} aria-expanded={panel === 'periodo'} onClick={() => setPanel(panel === 'periodo' ? null : 'periodo')}>
        <span className="sb-label">Período</span>
        <span className="sb-value">{range ? fmtRange(range) : 'Escolha as datas'}</span>
      </button>
      <span className="sb-div" aria-hidden />
      <button type="button" className={`sb-seg sb-seg-last ${panel === 'hospedes' ? 'is-on' : ''}`} aria-expanded={panel === 'hospedes'} onClick={() => setPanel(panel === 'hospedes' ? null : 'hospedes')}>
        <span className="sb-label">Hóspedes</span>
        <span className="sb-value">{guests} {guests === 1 ? 'pessoa' : 'pessoas'}</span>
      </button>
      <button type="button" className="sb-go" aria-label="Buscar imóveis" onClick={submit}>
        <Search size={size === 'lg' ? 20 : 18} strokeWidth={2.4} />
        {size === 'lg' && <span>Buscar</span>}
      </button>

      {panel === 'bairro' && (
        <div className="sb-pop sb-pop-left" role="dialog" aria-label="Escolher bairros">
          <p className="pop-title">Onde você quer ficar?</p>
          <div className="nb-grid">
            {neighborhoods.map((n) => {
              const on = bairros.includes(n.name);
              return (
                <button key={n.name} type="button" className={`nb-opt ${on ? 'is-on' : ''}`} aria-pressed={on} onClick={() => toggle(n.name)}>
                  <span><strong>{n.name}</strong><small>{n.blurb}</small></span>
                  {on && <Check size={16} aria-hidden />}
                </button>
              );
            })}
          </div>
        </div>
      )}
      {panel === 'periodo' && (
        <div className="sb-pop sb-pop-center" role="dialog" aria-label="Escolher datas">
          <DateRangeCalendar value={range} onChange={(r) => { setRange(r); }} months={2} />
          <div className="pop-actions">
            <button type="button" className="link-btn" onClick={() => setRange(brand.defaultRange)}>Usar período do Carnaval</button>
            <button type="button" className="btn btn-primary btn-sm" disabled={!range} onClick={() => setPanel('hospedes')}>Continuar</button>
          </div>
        </div>
      )}
      {panel === 'hospedes' && (
        <div className="sb-pop sb-pop-right" role="dialog" aria-label="Escolher hóspedes">
          <div className="guest-row">
            <span><strong>Hóspedes</strong><small>Adultos e crianças</small></span>
            <Stepper value={guests} min={1} max={12} onChange={setGuests} label="Hóspedes" />
          </div>
          <div className="pop-actions">
            <span />
            <button type="button" className="btn btn-primary btn-sm" onClick={submit}>Buscar</button>
          </div>
        </div>
      )}
    </div>
  );
}
