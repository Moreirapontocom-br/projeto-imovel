import { useEffect, useRef, useState } from 'react';
import { ChevronDown, Map as MapIcon, List, SlidersHorizontal } from 'lucide-react';
import { Header } from '@/components/Header';
import { SearchBar } from '@/components/SearchBar';
import { PropertyCard } from '@/components/PropertyCard';
import { PropertyMap } from '@/components/PropertyMap';
import { Button, DemoTag, EmptyState, Modal, Stepper } from '@/components/ui';
import { applyFilters, useCatalog, useFilters } from '@/hooks/useCatalog';
import { neighborhoods } from '@/data/geo';
import { amenityInfo } from '@/data/amenities';
import type { Amenity } from '@/types';
import { brl } from '@/lib/format';

const PRICE_STEPS = [10000, 15000, 20000, 30000];
const NEAR_STEPS = [0.5, 1, 2];
const QUICK_AMENITIES: Amenity[] = ['ar', 'vista-mar', 'piscina', 'garagem'];

export default function Search() {
  const { filters: f, update, clear, activeCount } = useFilters();
  const all = useCatalog(f.range);
  const list = applyFilters(all, f).sort((a, b) => Number(a.status !== 'disponivel') - Number(b.status !== 'disponivel'));
  const [hoverId, setHoverId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [view, setView] = useState<'list' | 'map'>('list');
  const [more, setMore] = useState(false);

  useEffect(() => {
    if (!selectedId) return;
    document.getElementById(`card-${selectedId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [selectedId]);

  const toggleBairro = (b: string) => update({ bairros: f.bairros.includes(b) ? f.bairros.filter((x) => x !== b) : [...f.bairros, b] });
  const toggleAmenity = (a: Amenity) => update({ amenities: f.amenities.includes(a) ? f.amenities.filter((x) => x !== a) : [...f.amenities, a] });

  return (
    <>
      <Header
        wide
        below={
          <div className="filterbar" role="toolbar" aria-label="Filtros">
            <button className="chip" onClick={() => setMore(true)}>
              <SlidersHorizontal size={16} aria-hidden /> Filtros {activeCount > 0 && <span className="chip-count">{activeCount}</span>}
            </button>
            <span className="chip-sep" aria-hidden />
            <Dropdown label={f.priceMax ? `Até ${brl(f.priceMax)}` : 'Preço'} active={!!f.priceMax}>
              {(close) => (
                <div className="opt-list">
                  {PRICE_STEPS.map((v) => (
                    <button key={v} className={`opt ${f.priceMax === v ? 'is-on' : ''}`} onClick={() => { update({ priceMax: v }); close(); }}>Até {brl(v)} no total</button>
                  ))}
                  <button className="opt" onClick={() => { update({ priceMax: null }); close(); }}>Qualquer valor</button>
                </div>
              )}
            </Dropdown>
            <Dropdown label={f.nearKm ? `Até ${f.nearKm.toLocaleString('pt-BR')} km do circuito` : 'Distância do circuito'} active={!!f.nearKm}>
              {(close) => (
                <div className="opt-list">
                  {NEAR_STEPS.map((v) => (
                    <button key={v} className={`opt ${f.nearKm === v ? 'is-on' : ''}`} onClick={() => { update({ nearKm: v }); close(); }}>Até {v < 1 ? '500 m' : `${v} km`}</button>
                  ))}
                  <button className="opt" onClick={() => { update({ nearKm: null }); close(); }}>Qualquer distância</button>
                  <p className="opt-note">Estimativa em linha reta até o traçado ilustrativo mais próximo.</p>
                </div>
              )}
            </Dropdown>
            {neighborhoods.map((n) => (
              <button key={n.name} className="chip" aria-pressed={f.bairros.includes(n.name)} onClick={() => toggleBairro(n.name)}>{n.name}</button>
            ))}
            {QUICK_AMENITIES.map((a) => (
              <button key={a} className="chip" aria-pressed={f.amenities.includes(a)} onClick={() => toggleAmenity(a)}>{amenityInfo[a].label}</button>
            ))}
            <button className="chip" aria-pressed={f.onlyAvailable} onClick={() => update({ onlyAvailable: !f.onlyAvailable })}>Somente disponíveis</button>
            {activeCount > 0 && <button className="link-btn chip-clear" onClick={clear}>Limpar filtros</button>}
          </div>
        }
      >
        <SearchBar initial={{ bairros: f.bairros, range: f.range, guests: f.guests }} onSubmit={(v) => update({ bairros: v.bairros, range: v.range, guests: v.guests })} />
      </Header>

      <main className={`results view-${view}`}>
        <section className="results-list" aria-label="Lista de imóveis">
          <div className="results-head">
            <h1 aria-live="polite">{list.length === 1 ? '1 imóvel' : `${list.length} imóveis`} para o Carnaval</h1>
            <DemoTag>Demonstração · dados ilustrativos</DemoTag>
          </div>
          {list.length === 0 ? (
            <EmptyState title="Nenhum imóvel com esses filtros" text="Tente outro bairro, aumente o número de hóspedes ou remova algum filtro." action={<Button variant="secondary" onClick={clear}>Limpar filtros</Button>} />
          ) : (
            <div className="results-grid">
              {list.map((i) => (
                <PropertyCard key={i.property.id} property={i.property} total={i.total} status={i.status} range={f.range} active={i.property.id === hoverId || i.property.id === selectedId} onHover={setHoverId} />
              ))}
            </div>
          )}
          <p className="fineprint">* Distâncias estimadas em linha reta até o traçado ilustrativo mais próximo. Imóveis, fotos e valores são demonstrativos. Parcelamento conforme condições cadastradas.</p>
        </section>
        <aside className="results-map">
          <PropertyMap items={list} hoverId={hoverId} selectedId={selectedId} onSelect={setSelectedId} />
        </aside>
      </main>

      <button className="view-toggle" onClick={() => setView(view === 'map' ? 'list' : 'map')}>
        {view === 'map' ? <><List size={16} /> Mostrar lista</> : <><MapIcon size={16} /> Mostrar mapa</>}
      </button>

      <Modal open={more} onClose={() => setMore(false)} title="Filtros" footer={<><button className="link-btn" onClick={clear}>Limpar tudo</button><Button onClick={() => setMore(false)}>Mostrar {list.length} imóveis</Button></>}>
        <div className="fgroup">
          <h3>Hóspedes</h3>
          <div className="guest-row"><span>Mínimo de pessoas</span><Stepper value={f.guests} min={1} max={12} onChange={(v) => update({ guests: v })} label="Hóspedes" /></div>
        </div>
        <div className="fgroup">
          <h3>Bairros</h3>
          <div className="chip-wrap">{neighborhoods.map((n) => <button key={n.name} className="chip" aria-pressed={f.bairros.includes(n.name)} onClick={() => toggleBairro(n.name)}>{n.name}</button>)}</div>
        </div>
        <div className="fgroup">
          <h3>Valor total máximo</h3>
          <div className="chip-wrap">
            {PRICE_STEPS.map((v) => <button key={v} className="chip" aria-pressed={f.priceMax === v} onClick={() => update({ priceMax: f.priceMax === v ? null : v })}>Até {brl(v)}</button>)}
          </div>
        </div>
        <div className="fgroup">
          <h3>Proximidade dos circuitos</h3>
          <div className="chip-wrap">
            {NEAR_STEPS.map((v) => <button key={v} className="chip" aria-pressed={f.nearKm === v} onClick={() => update({ nearKm: f.nearKm === v ? null : v })}>Até {v < 1 ? '500 m' : `${v} km`}</button>)}
          </div>
        </div>
        <div className="fgroup">
          <h3>Comodidades</h3>
          <div className="amen-grid">
            {(Object.keys(amenityInfo) as Amenity[]).map((a) => {
              const { label, icon: Icon } = amenityInfo[a];
              return (
                <label key={a} className="check">
                  <input type="checkbox" checked={f.amenities.includes(a)} onChange={() => toggleAmenity(a)} />
                  <Icon size={18} aria-hidden /> {label}
                </label>
              );
            })}
          </div>
        </div>
      </Modal>
    </>
  );
}

function Dropdown({ label, active, children }: { label: string; active: boolean; children: (close: () => void) => React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const btn = useRef<HTMLButtonElement>(null);
  const [pos, setPos] = useState({ left: 0, top: 0 });
  useEffect(() => {
    if (!open) return;
    const r = btn.current!.getBoundingClientRect();
    setPos({ left: Math.min(r.left, window.innerWidth - 300), top: r.bottom + 8 });
    const close = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    const scroll = () => setOpen(false);
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', esc);
    window.addEventListener('scroll', scroll, { passive: true });
    return () => { document.removeEventListener('mousedown', close); document.removeEventListener('keydown', esc); window.removeEventListener('scroll', scroll); };
  }, [open]);
  return (
    <div className="dd" ref={ref}>
      <button ref={btn} className="chip" aria-pressed={active} aria-expanded={open} onClick={() => setOpen(!open)}>{label} <ChevronDown size={15} aria-hidden /></button>
      {open && <div className="dd-pop" style={{ left: pos.left, top: pos.top }}>{children(() => setOpen(false))}</div>}
    </div>
  );
}
