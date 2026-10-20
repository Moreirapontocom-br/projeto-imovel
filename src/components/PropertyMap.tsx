import { useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Popup, Tooltip, useMap, ZoomControl } from 'react-leaflet';
import L from 'leaflet';
import { Link } from 'react-router-dom';
import { Layers } from 'lucide-react';
import type { Property, PropertyStatus } from '@/types';
import { circuits, pois } from '@/data/geo';
import { brlShort, brl } from '@/lib/format';
import { statusInfo } from '@/lib/availability';

export interface MapItem { property: Property; total: number; status: PropertyStatus }

interface Props {
  items: MapItem[];
  mode?: 'public' | 'admin' | 'client';
  selectedId?: string | null;
  hoverId?: string | null;
  onSelect?(id: string | null): void;
  showPois?: boolean;
  initialCircuits?: boolean;
  className?: string;
  label?: string;
}

function pinIcon(text: string, variant: 'default' | 'active' | 'muted') {
  return L.divIcon({ className: 'pin-wrap', html: `<span class="pin pin-${variant}">${text}</span>`, iconSize: [0, 0] });
}

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
    // aguarda o container ter tamanho real (layouts sticky/ocultos) antes de enquadrar
    const t = setTimeout(() => { map.invalidateSize(); map.fitBounds(b.pad(0.15), { maxZoom: 15, animate: false }); }, 60);
    return () => clearTimeout(t);
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

export function PropertyMap({ items, mode = 'public', selectedId, hoverId, onSelect, showPois = mode === 'client', initialCircuits = true, className = '', label = 'Mapa de imóveis' }: Props) {
  const [layers, setLayers] = useState({ circuits: initialCircuits, pois: showPois });
  const selected = useMemo(() => items.find((i) => i.property.id === selectedId), [items, selectedId]);

  return (
    <div className={`map ${className}`} role="region" aria-label={label}>
      <MapContainer center={[-13.0, -38.51]} zoom={13} zoomControl={false} scrollWheelZoom className="map-canvas">
        {/* Tiles do OpenStreetMap para o protótipo; em produção, usar um provedor com chave/contrato (MapTiler, Mapbox, Stadia…). */}
        <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" maxZoom={19} className="tiles" />
        <ZoomControl position="topright" />
        <Fit items={items} />
        <Resize />
        <PanTo item={selected} />

        {layers.circuits && circuits.map((c) => (
          <Polyline key={c.id} positions={c.path.map((p) => [p.lat, p.lng])} pathOptions={{ color: c.color, weight: 6, opacity: 0.75, lineCap: 'round', dashArray: c.id === 'osmar' ? '1 10' : undefined }}>
            <Tooltip sticky>{c.name} · {c.route} (traçado ilustrativo)</Tooltip>
          </Polyline>
        ))}

        {layers.pois && pois.map((p) => (
          <Marker key={p.id} position={[p.location.lat, p.location.lng]} icon={poiIcon} keyboard={false}>
            <Tooltip direction="top" offset={[0, -6]}>{p.name}</Tooltip>
          </Marker>
        ))}

        {items.map(({ property: p, total, status }) => {
          const active = p.id === selectedId || p.id === hoverId;
          const unavailable = status !== 'disponivel';
          const text = mode === 'admin' ? '' : mode === 'client' ? 'Sua reserva' : brlShort(total);
          const variant = active ? 'active' : mode === 'public' && unavailable ? 'muted' : 'default';
          return (
            <Marker
              key={p.id}
              position={[p.location.lat, p.location.lng]}
              icon={mode === 'admin' ? dotIcon(statusInfo[status].color, active) : pinIcon(text, variant)}
              zIndexOffset={active ? 1000 : 0}
              title={`${p.title}, ${p.neighborhood}, ${brl(total)}`}
              eventHandlers={{ click: () => onSelect?.(p.id), popupclose: () => onSelect?.(null) }}
            >
              {mode === 'admin' && <Tooltip direction="top" offset={[0, -10]}>{p.title} · {statusInfo[status].label}</Tooltip>}
              <Popup closeButton={false} offset={[0, -14]} className="map-popup" autoPanPadding={[40, 40]}>
                <Link to={`/imovel/${p.id}`} className="popup-card">
                  <img src={p.photos[0].src} alt={p.photos[0].alt} />
                  <span className="popup-body">
                    <strong>{p.title}</strong>
                    <span>{p.neighborhood} · {p.guests} hóspedes</span>
                    <b>{brl(total)} <small>total</small></b>
                  </span>
                </Link>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      <div className="map-layers">
        <span className="map-layers-title"><Layers size={14} aria-hidden /> Camadas</span>
        <label><input type="checkbox" checked={layers.circuits} onChange={(e) => setLayers({ ...layers, circuits: e.target.checked })} /> Circuitos</label>
        <label><input type="checkbox" checked={layers.pois} onChange={(e) => setLayers({ ...layers, pois: e.target.checked })} /> Pontos de interesse</label>
      </div>

      {layers.circuits && (
        <ul className="map-legend" aria-label="Legenda dos circuitos">
          {circuits.map((c) => (
            <li key={c.id}><i style={{ background: c.color }} />{c.name.replace('Circuito ', '')}</li>
          ))}
        </ul>
      )}
      {mode === 'admin' && (
        <ul className="map-legend map-legend-status" aria-label="Legenda de status">
          {(Object.keys(statusInfo) as PropertyStatus[]).map((s) => (
            <li key={s}><i style={{ background: statusInfo[s].color }} />{statusInfo[s].label}</li>
          ))}
        </ul>
      )}
      <p className="map-note">Localizações e traçados aproximados · demonstração</p>
    </div>
  );
}
