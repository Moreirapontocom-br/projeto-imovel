import { useEffect, useMemo, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Popup, Tooltip, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { Link } from 'react-router-dom';
import { Plus, Minus, Maximize2, Minimize2, Route, MapPin } from 'lucide-react';
import type { Property, PropertyStatus } from '@/types';
import { circuits, pois } from '@/data/geo';
import { brlShort, brl } from '@/lib/format';
import { statusInfo } from '@/lib/availability';
import { mapTiles } from '@/config/env';

export interface MapItem { property: Property; total: number; status: PropertyStatus }

interface Props {
  items: MapItem[];
  mode?: 'public' | 'admin' | 'client';
  selectedId?: string | null;
  hoverId?: string | null;
  onSelect?(id: string | null): void;
  showPois?: boolean;
  initialCircuits?: boolean;
  expanded?: boolean;
  onToggleExpand?(): void;
  className?: string;
  label?: string;
}

function pinIcon(text: string, variant: 'default' | 'active' | 'muted') {
  return L.divIcon({ className: 'pin-wrap', html: `<span class="pin pin-${variant}">${text}</span>`, iconSize: [0, 0] });
}

/** Pin recolhido quando o preço sobreporia outro (padrão das plataformas de hospedagem). */
const miniIcon = L.divIcon({ className: 'pin-wrap', html: '<span class="pin-mini"></span>', iconSize: [0, 0] });

/** Admin: ponto na cor do status (o rótulo textual fica na lista, na legenda e no tooltip). */
function dotIcon(color: string, active: boolean) {
  return L.divIcon({ className: 'pin-wrap', html: `<span class="pin-dot ${active ? 'is-active' : ''}" style="--pin:${color}"></span>`, iconSize: [0, 0] });
}

const poiIcon = L.divIcon({ className: 'pin-wrap', html: '<span class="poi-dot" aria-hidden="true"></span>', iconSize: [0, 0] });

function Fit({ items }: { items: MapItem[] }) {
  const map = useMap();
  const key = items.map((i) => i.property.id).join(',');
  useEffect(() => {
    if (!items.length) return;
    const b = L.latLngBounds(items.map((i) => [i.property.location.lat, i.property.location.lng] as [number, number]));
    const el = map.getContainer();
    let fitted = false;
    const fit = () => {
      // mapa oculto (lista no celular, layout ainda montando) tem tamanho 0: espera aparecer
      if (!el.clientWidth || !el.clientHeight) return;
      map.invalidateSize();
      map.fitBounds(b, { padding: [56, 56], maxZoom: 15, animate: false });
      fitted = true;
    };
    const t = setTimeout(fit, 60);
    const ro = new ResizeObserver(() => { if (!fitted) fit(); });
    ro.observe(el);
    return () => { clearTimeout(t); ro.disconnect(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return null;
}

function Resize() {
  const map = useMap();
  useEffect(() => {
    const ro = new ResizeObserver(() => map.invalidateSize());
    ro.observe(map.getContainer());
    return () => ro.disconnect();
  }, [map]);
  return null;
}

function PanTo({ item }: { item?: MapItem }) {
  const map = useMap();
  useEffect(() => {
    if (item) map.panTo([item.property.location.lat, item.property.location.lng], { animate: true });
  }, [item, map]);
  return null;
}

/**
 * Recolhe etiquetas de preço que colidiriam na tela. Prioridade: selecionado/hover,
 * depois disponíveis, depois menor preço. Recalcula a cada zoom/movimento.
 */
function useCollapsed(items: MapItem[], labels: Record<string, string>, priority: string[]) {
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const map = useMapEvents({ zoomend: () => compute(), moveend: () => compute(), resize: () => compute() });
  function compute() {
    const placed: { x: number; y: number; w: number }[] = [];
    const next = new Set<string>();
    const order = [...items].sort((a, b) => priority.indexOf(a.property.id) - priority.indexOf(b.property.id));
    for (const it of order) {
      const pt = map.latLngToContainerPoint([it.property.location.lat, it.property.location.lng]);
      const w = (labels[it.property.id]?.length ?? 6) * 7.4 + 24;
      const hit = placed.some((p) => Math.abs(p.x - pt.x) < (p.w + w) / 2 + 2 && Math.abs(p.y - pt.y) < 30);
      if (hit) next.add(it.property.id);
      else placed.push({ x: pt.x, y: pt.y, w });
    }
    setCollapsed((prev) => (prev.size === next.size && [...next].every((id) => prev.has(id)) ? prev : next));
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { const t = setTimeout(compute, 120); return () => clearTimeout(t); }, [items, priority.join(',')]);
  return collapsed;
}

function Pins({ items, mode, selectedId, hoverId, onSelect }: Pick<Props, 'items' | 'mode' | 'selectedId' | 'hoverId' | 'onSelect'>) {
  const labels = useMemo(() => Object.fromEntries(items.map((i) => [i.property.id, mode === 'client' ? 'Sua reserva' : brlShort(i.total)])), [items, mode]);
  const priority = useMemo(() => {
    const score = (i: MapItem) => (i.property.id === selectedId || i.property.id === hoverId ? -1e9 : 0) + (i.status === 'disponivel' ? 0 : 1e8) + i.total;
    return [...items].sort((a, b) => score(a) - score(b)).map((i) => i.property.id);
  }, [items, selectedId, hoverId]);
  const collapsed = useCollapsed(items, labels, mode === 'admin' ? [] : priority);

  return (
    <>
      {items.map(({ property: p, total, status }) => {
        const active = p.id === selectedId || p.id === hoverId;
        const variant = active ? 'active' : mode === 'public' && status !== 'disponivel' ? 'muted' : 'default';
        const icon = mode === 'admin'
          ? dotIcon(statusInfo[status].color, active)
          : collapsed.has(p.id) && !active ? miniIcon : pinIcon(labels[p.id], variant);
        return (
          <Marker
            key={p.id}
            position={[p.location.lat, p.location.lng]}
            icon={icon}
            zIndexOffset={active ? 1000 : collapsed.has(p.id) ? -100 : 0}
            title={`${p.title}, ${p.neighborhood}, ${brl(total)}`}
            eventHandlers={{ click: () => onSelect?.(p.id), popupclose: () => onSelect?.(null) }}
          >
            {mode === 'admin' && <Tooltip direction="top" offset={[0, -10]}>{p.title} · {statusInfo[status].label}</Tooltip>}
            <Popup closeButton={false} offset={[0, -16]} className="map-popup" autoPanPadding={[40, 40]}>
              <Link to={`/imovel/${p.id}`} className="popup-card">
                <img src={p.photos[0].src} alt={p.photos[0].alt} />
                <span className="popup-body">
                  <span className="popup-row"><strong>{p.type} · {p.neighborhood}</strong></span>
                  <span>{p.title}</span>
                  <span>{p.bedrooms} {p.bedrooms === 1 ? 'quarto' : 'quartos'} · {p.guests} hóspedes</span>
                  <b>{brl(total)} <small>total</small></b>
                </span>
                <span className="img-tag">Imagem ilustrativa</span>
              </Link>
            </Popup>
          </Marker>
        );
      })}
    </>
  );
}

function Controls({ expanded, onToggleExpand }: Pick<Props, 'expanded' | 'onToggleExpand'>) {
  const map = useMap();
  const ref = useRef<HTMLDivElement>(null);
  // impede que cliques nos controles arrastem/zoomem o mapa
  useEffect(() => { if (ref.current) { L.DomEvent.disableClickPropagation(ref.current); L.DomEvent.disableScrollPropagation(ref.current); } }, []);
  return (
    <div className="map-ctrl" ref={ref}>
      {onToggleExpand && (
        <button type="button" className="map-btn" aria-label={expanded ? 'Mostrar lista' : 'Ampliar mapa'} title={expanded ? 'Mostrar lista' : 'Ampliar mapa'} onClick={onToggleExpand}>
          {expanded ? <Minimize2 size={17} /> : <Maximize2 size={17} />}
        </button>
      )}
      <div className="map-zoom">
        <button type="button" aria-label="Aproximar" onClick={() => map.zoomIn()}><Plus size={20} /></button>
        <button type="button" aria-label="Afastar" onClick={() => map.zoomOut()}><Minus size={20} /></button>
      </div>
    </div>
  );
}

export function PropertyMap({ items, mode = 'public', selectedId, hoverId, onSelect, showPois = mode === 'client', initialCircuits = mode === 'client', expanded, onToggleExpand, className = '', label = 'Mapa de imóveis' }: Props) {
  const [layers, setLayers] = useState({ circuits: initialCircuits, pois: showPois });
  const selected = useMemo(() => items.find((i) => i.property.id === selectedId), [items, selectedId]);

  return (
    <div className={`map ${className}`} role="region" aria-label={label}>
      <MapContainer center={[-13.0, -38.51]} zoom={13} zoomSnap={0.25} zoomDelta={1} zoomControl={false} scrollWheelZoom className="map-canvas"
        minZoom={mapTiles.minZoom} maxZoom={mapTiles.maxZoom} maxBounds={mapTiles.bounds} maxBoundsViscosity={0.8}>
        {/* Base Esri World Street Map (sem chave) para o protótipo; em produção, usar provedor com contrato (Google, Mapbox, MapTiler…). */}
        <TileLayer
          attribution='Tiles &copy; Esri — Esri, HERE, Garmin, &copy; OpenStreetMap'
          url={mapTiles.url}
          minZoom={mapTiles.minZoom}
          maxZoom={mapTiles.maxZoom}
          maxNativeZoom={mapTiles.maxZoom}
          className="tiles"
        />
        <Fit items={items} />
        <Resize />
        <PanTo item={selected} />
        <Controls expanded={expanded} onToggleExpand={onToggleExpand} />

        {layers.circuits && circuits.map((c) => (
          <Polyline key={c.id} positions={c.path.map((p) => [p.lat, p.lng])} pathOptions={{ color: c.color, weight: 5, opacity: 0.8, lineCap: 'round', dashArray: c.id === 'osmar' ? '1 9' : undefined }}>
            <Tooltip sticky>{c.name} · {c.route} (traçado ilustrativo)</Tooltip>
          </Polyline>
        ))}

        {layers.pois && pois.map((p) => (
          <Marker key={p.id} position={[p.location.lat, p.location.lng]} icon={poiIcon} keyboard={false}>
            <Tooltip direction="top" offset={[0, -6]}>{p.name}</Tooltip>
          </Marker>
        ))}

        <Pins items={items} mode={mode} selectedId={selectedId} hoverId={hoverId} onSelect={onSelect} />
      </MapContainer>

      <div className="map-toggles">
        <button type="button" className="map-chip" aria-pressed={layers.circuits} onClick={() => setLayers({ ...layers, circuits: !layers.circuits })}>
          <Route size={15} /> Circuitos
          {layers.circuits && <span className="map-chip-legend">{circuits.map((c) => <i key={c.id} style={{ background: c.color }} title={c.name} />)}</span>}
        </button>
        <button type="button" className="map-chip" aria-pressed={layers.pois} onClick={() => setLayers({ ...layers, pois: !layers.pois })}>
          <MapPin size={15} /> Pontos de interesse
        </button>
      </div>

      {mode === 'admin' && (
        <ul className="map-legend map-legend-status" aria-label="Legenda de status">
          {(Object.keys(statusInfo) as PropertyStatus[]).map((s) => (
            <li key={s}><i style={{ background: statusInfo[s].color }} />{statusInfo[s].label}</li>
          ))}
        </ul>
      )}
      <p className="map-note">Localizações aproximadas · demonstração</p>
    </div>
  );
}
