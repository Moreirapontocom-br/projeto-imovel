import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Bookmark } from 'lucide-react';
import type { DateRange, Property, PropertyStatus } from '@/types';
import { useStore } from '@/store';
import { brl, km, plural } from '@/lib/format';
import { fmtRange } from '@/lib/dates';
import { nearestCircuit } from '@/lib/geo';
import { lowestInstallment } from '@/lib/payment';
import { statusInfo } from '@/lib/availability';

interface Props {
  property: Property;
  total: number;
  range: DateRange;
  status: PropertyStatus;
  compact?: boolean;
  active?: boolean;
  onHover?(id: string | null): void;
}

export function PropertyCard({ property: p, total, range, status, compact, active, onHover }: Props) {
  const favorites = useStore((s) => s.favorites);
  const toggleFavorite = useStore((s) => s.toggleFavorite);
  const terms = useStore((s) => s.terms);
  const fav = favorites.includes(p.id);
  const near = nearestCircuit(p.location);
  const inst = lowestInstallment(total, terms);
  const [idx, setIdx] = useState(0);
  const track = useRef<HTMLDivElement>(null);
  const to = `/imovel/${p.id}?inicio=${range.start}&fim=${range.end}`;

  const go = (dir: 1 | -1) => {
    const el = track.current;
    if (!el) return;
    const n = Math.max(0, Math.min(p.photos.length - 1, idx + dir));
    el.scrollTo({ left: n * el.clientWidth, behavior: 'smooth' });
    setIdx(n);
  };

  return (
    <article
      className={`pcard ${compact ? 'pcard-compact' : ''} ${active ? 'is-active' : ''}`}
      id={`card-${p.id}`}
      onMouseEnter={() => onHover?.(p.id)}
      onMouseLeave={() => onHover?.(null)}
    >
      <div className="pcard-media">
        <div className="pcard-track" ref={track} onScroll={(e) => setIdx(Math.round(e.currentTarget.scrollLeft / e.currentTarget.clientWidth))}>
          {p.photos.map((ph, i) => (
            <Link key={ph.src} to={to} tabIndex={i === 0 ? 0 : -1} aria-label={i === 0 ? `${p.title}, ${p.neighborhood}, até ${p.guests} hóspedes, ${brl(total)} no total` : undefined}>
              <img src={ph.src} alt={ph.alt} loading="lazy" width={800} height={600} onError={(e) => e.currentTarget.classList.add('img-missing')} />
            </Link>
          ))}
        </div>
        {p.highlight && <span className="pcard-badge">{p.highlight}</span>}
        <button className={`pcard-fav ${fav ? 'is-on' : ''}`} aria-pressed={fav} aria-label={fav ? `Remover ${p.title} dos favoritos` : `Favoritar ${p.title}`} onClick={() => toggleFavorite(p.id)}>
          <Bookmark size={18} strokeWidth={2} />
        </button>
        {idx > 0 && <button className="pcard-nav prev" aria-label="Foto anterior" onClick={() => go(-1)}><ChevronLeft size={16} /></button>}
        {idx < p.photos.length - 1 && <button className="pcard-nav next" aria-label="Próxima foto" onClick={() => go(1)}><ChevronRight size={16} /></button>}
        <span className="pcard-dots" aria-hidden>{p.photos.map((_, i) => <i key={i} className={i === idx ? 'on' : ''} />)}</span>
        <span className="img-tag">Imagem ilustrativa</span>
      </div>

      <Link to={to} className="pcard-body" tabIndex={-1}>
        <div className="pcard-row">
          <p className="pcard-kind">{p.type} · {p.neighborhood}</p>
          {status !== 'disponivel' && <span className="pcard-status" style={{ color: statusInfo[status].color }}>{statusInfo[status].label}</span>}
        </div>
        <h3 className="clamp">{p.title}</h3>
        {!compact && <p className="pcard-line">{plural(p.bedrooms, 'quarto', 'quartos')} · {plural(p.guests, 'hóspede', 'hóspedes')}</p>}
        <p className="pcard-line">{km(near.km)} do {near.circuit.name.replace('Circuito ', '')}*</p>
      </Link>

      <div className="pcard-side">
        <p className="pcard-price"><strong>{brl(total)}</strong> <span>total de {fmtRange(range)}</span></p>
        {!compact && <p className="pcard-inst">ou entrada + {inst.n}x de {brl(inst.each)}</p>}
        <Link to={to} className="btn btn-primary btn-md pcard-go" tabIndex={-1} aria-hidden>Ver imóvel</Link>
      </div>
    </article>
  );
}
