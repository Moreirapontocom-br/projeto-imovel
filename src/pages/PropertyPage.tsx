import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Bookmark, MapPin, Users, BedDouble, Bath, Ruler, AlertCircle, Images } from 'lucide-react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { SearchBar } from '@/components/SearchBar';
import { DateRangeCalendar } from '@/components/DateRangeCalendar';
import { PropertyMap } from '@/components/PropertyMap';
import { Button, DemoTag, EmptyState, Modal, StatusBadge, Stepper } from '@/components/ui';
import { useStore, useProperty } from '@/store';
import { amenityInfo } from '@/data/amenities';
import { circuits, pois } from '@/data/geo';
import { busyNights, findConflict, statusFor } from '@/lib/availability';
import { buildInstallments, quote } from '@/lib/payment';
import { distanceToCircuit, haversine } from '@/lib/geo';
import { brl, km, plural } from '@/lib/format';
import { fmtRange, fmtShort, todayIso } from '@/lib/dates';
import { brand } from '@/config/brand';
import type { DateRange } from '@/types';

export default function PropertyPage() {
  const { id } = useParams();
  const [sp] = useSearchParams();
  const nav = useNavigate();
  const p = useProperty(id);
  const blocks = useStore((s) => s.blocks);
  const reservations = useStore((s) => s.reservations);
  const terms = useStore((s) => s.terms);
  const favorites = useStore((s) => s.favorites);
  const toggleFavorite = useStore((s) => s.toggleFavorite);
  const addToCart = useStore((s) => s.addToCart);

  const initial: DateRange = { start: sp.get('inicio') ?? brand.defaultRange.start, end: sp.get('fim') ?? brand.defaultRange.end };
  const busy = useMemo(() => (p ? busyNights(p.id, blocks) : new Map()), [p, blocks]);
  const initialFree = p && !findConflict(p.id, initial, blocks);
  const [range, setRange] = useState<DateRange | null>(initialFree ? initial : null);
  const [guests, setGuests] = useState(Math.min(Number(sp.get('hospedes') ?? 2), p?.guests ?? 2));
  const [error, setError] = useState(p && !initialFree ? `${fmtRange(initial)} não está disponível neste imóvel. Escolha outro período no calendário.` : '');
  const [gallery, setGallery] = useState(false);

  if (!p) {
    return (
      <>
        <Header />
        <main className="page-narrow"><EmptyState title="Imóvel não encontrado" text="Ele pode ter sido removido da demonstração." action={<Link className="btn btn-secondary btn-md" to="/buscar">Ver imóveis</Link>} /></main>
      </>
    );
  }

  const q = range ? quote(p, range, terms) : null;
  const conflict = range ? findConflict(p.id, range, blocks) : null;
  const plan = q ? buildInstallments(q.total, 'cartao', terms, terms.maxInstallments, todayIso()) : [];
  const status = statusFor(p.id, brand.defaultRange, blocks, reservations);
  const fav = favorites.includes(p.id);
  const nearCircuits = circuits.map((c) => ({ c, d: distanceToCircuit(p.location, c) })).sort((a, b) => a.d - b.d);
  const nearPois = pois.map((x) => ({ x, d: haversine(p.location, x.location) })).sort((a, b) => a.d - b.d).slice(0, 4);

  function add(goCheckout: boolean) {
    if (!p) return;
    setError('');
    if (!range) {
      document.getElementById('disponibilidade')?.scrollIntoView({ behavior: 'smooth' });
      return setError('Escolha as datas de entrada e saída no calendário.');
    }
    const r = addToCart(p.id, range, guests);
    if (!r.ok) return setError(`${r.error}. Escolha outro período.`);
    nav(goCheckout ? '/checkout' : '/carrinho');
  }

  return (
    <>
      <Header><SearchBar initial={{ bairros: [p.neighborhood], range: range ?? brand.defaultRange, guests }} /></Header>
      <main className="pdp">
        <div className="pdp-top">
          <Link to="/buscar" className="back-link"><ArrowLeft size={16} /> Voltar à busca</Link>
          <div className="pdp-actions">
            <DemoTag>Imóvel demonstrativo</DemoTag>
            <button className="link-btn with-icon" onClick={() => toggleFavorite(p.id)} aria-pressed={fav}>
              <Bookmark size={16} fill={fav ? 'currentColor' : 'none'} /> {fav ? 'Salvo' : 'Salvar'}
            </button>
          </div>
        </div>
        <h1 className="pdp-title">{p.title}</h1>

        <div className="gallery">
          {p.photos.map((ph, i) => (
            <button key={ph.src} className={`gallery-item g${i}`} onClick={() => setGallery(true)} aria-label={`Ampliar foto: ${ph.alt}`}>
              <img src={ph.src} alt={ph.alt} onError={(e) => e.currentTarget.classList.add('img-missing')} />
            </button>
          ))}
          <span className="img-tag">Imagens ilustrativas</span>
          <button className="btn btn-secondary btn-sm gallery-all" onClick={() => setGallery(true)}><Images size={16} /> Ver fotos</button>
        </div>

        <div className="pdp-grid">
          <div className="pdp-main">
            <section className="pdp-head">
              <div>
                <h2>{p.type} inteiro em {p.neighborhood}, Salvador</h2>
                <p className="specs">
                  <span><Users size={16} />{plural(p.guests, 'hóspede', 'hóspedes')}</span>
                  <span><BedDouble size={16} />{plural(p.bedrooms, 'quarto', 'quartos')} · {plural(p.beds, 'cama', 'camas')}</span>
                  <span><Bath size={16} />{plural(p.bathrooms, 'banheiro', 'banheiros')}</span>
                  <span><Ruler size={16} />{p.areaM2} m²</span>
                </p>
              </div>
              <StatusBadge status={status} />
            </section>

            <section className="pdp-sec">
              <p className="lead">{p.description}</p>
            </section>

            <section className="pdp-sec">
              <h2>O que o imóvel oferece</h2>
              <ul className="amen-list">
                {p.amenities.map((a) => {
                  const { label, icon: Icon } = amenityInfo[a];
                  return <li key={a}><Icon size={22} strokeWidth={1.6} aria-hidden />{label}</li>;
                })}
              </ul>
            </section>

            <section className="pdp-sec" id="disponibilidade">
              <h2>Disponibilidade</h2>
              <p className="muted">{range ? `${fmtRange(range)} · ${q?.nights} noites` : `Escolha entrada e saída. Mínimo de ${p.minNights} noites.`}</p>
              <DateRangeCalendar value={range} onChange={(r) => { setRange(r); setError(''); }} busy={busy} minNights={p.minNights} />
            </section>

            <section className="pdp-sec">
              <h2>Onde fica</h2>
              <p className="muted"><MapPin size={15} /> {p.neighborhood}, Salvador · localização aproximada</p>
              <PropertyMap items={[{ property: p, total: q?.total ?? 0, status }]} showPois className="pdp-map" label="Localização do imóvel" />
              <div className="near">
                <div>
                  <h3>Circuitos do Carnaval</h3>
                  <ul>{nearCircuits.map(({ c, d }) => <li key={c.id}><i style={{ background: c.color }} />{c.name}<span>{km(d)}</span></li>)}</ul>
                </div>
                <div>
                  <h3>Por perto</h3>
                  <ul>{nearPois.map(({ x, d }) => <li key={x.id}><i className="dot" />{x.name}<span>{km(d)}</span></li>)}</ul>
                </div>
              </div>
              <p className="fineprint">Distâncias estimadas em linha reta a partir de coordenadas ilustrativas. Não representam trajeto a pé.</p>
            </section>
          </div>

          <aside className="book">
            <div className="book-card">
              <p className="book-price">{q ? <><strong>{brl(q.total)}</strong> total</> : <><strong>{brl(p.nightly)}</strong> / noite</>}</p>
              <div className="book-fields">
                <a href="#disponibilidade" className="book-field">
                  <span>Entrada</span><b>{range ? fmtShort(range.start) : 'Adicionar'}</b>
                </a>
                <a href="#disponibilidade" className="book-field">
                  <span>Saída</span><b>{range ? fmtShort(range.end) : 'Adicionar'}</b>
                </a>
                <div className="book-field book-guests">
                  <span>Hóspedes</span>
                  <Stepper value={guests} min={1} max={p.guests} onChange={setGuests} label="Hóspedes" />
                </div>
              </div>
              {(error || conflict) && <p className="form-error" role="alert"><AlertCircle size={16} />{error || `${conflict!.reason}.`}</p>}
              <Button block size="lg" variant="gold" onClick={() => add(true)} disabled={!!conflict}>Reservar</Button>
              <Button block variant="secondary" onClick={() => add(false)} disabled={!!conflict}>Adicionar ao carrinho</Button>
              <p className="book-note">Simulação: nenhuma cobrança será feita.</p>
              {q && (
                <dl className="breakdown">
                  <div><dt>{brl(p.nightly)} × {q.nights} noites</dt><dd>{brl(q.lodging)}</dd></div>
                  <div><dt>Taxa de limpeza</dt><dd>{brl(q.cleaning)}</dd></div>
                  {q.service > 0 && <div><dt>Taxa de serviço</dt><dd>{brl(q.service)}</dd></div>}
                  <div className="total"><dt>Total</dt><dd>{brl(q.total)}</dd></div>
                </dl>
              )}
              {q && plan.length > 1 && (
                <div className="book-plan">
                  <span>Entrada de {brl(plan[0].amount)}</span>
                  <span>+ {plan.length - 1}x de {brl(plan[1].amount)} no cartão</span>
                </div>
              )}
            </div>
          </aside>
        </div>
      </main>
      <div className="book-bar">
        <span>
          <strong>{q ? brl(q.total) : `${brl(p.nightly)} / noite`}</strong>
          <a href="#disponibilidade">{range ? `${fmtRange(range)} · ${q?.nights} noites` : 'Escolha as datas'}</a>
        </span>
        <Button variant="gold" onClick={() => add(true)} disabled={!!conflict}>Reservar</Button>
      </div>
      <Footer />

      <Modal open={gallery} onClose={() => setGallery(false)} title={`Fotos · ${p.title}`} wide>
        <div className="gallery-full">
          {p.photos.map((ph) => (
            <figure key={ph.src}><img src={ph.src} alt={ph.alt} /><figcaption>{ph.alt} · imagem ilustrativa</figcaption></figure>
          ))}
        </div>
      </Modal>
    </>
  );
}
