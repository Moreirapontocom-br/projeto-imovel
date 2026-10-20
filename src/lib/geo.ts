import type { LatLng } from '@/types';
import { circuits, type Circuit } from '@/data/geo';

const R = 6371; // km

export function haversine(a: LatLng, b: LatLng) {
  const dLat = rad(b.lat - a.lat), dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

const rad = (d: number) => (d * Math.PI) / 180;

/** Distância em linha reta (km) de um ponto até um segmento, em projeção local plana. */
function toSegment(p: LatLng, a: LatLng, b: LatLng) {
  const kx = Math.cos(rad(p.lat)) * 111.32, ky = 110.57;
  const ax = (a.lng - p.lng) * kx, ay = (a.lat - p.lat) * ky;
  const bx = (b.lng - p.lng) * kx, by = (b.lat - p.lat) * ky;
  const dx = bx - ax, dy = by - ay;
  const t = Math.max(0, Math.min(1, -(ax * dx + ay * dy) / (dx * dx + dy * dy || 1)));
  return Math.hypot(ax + t * dx, ay + t * dy);
}

export function distanceToCircuit(p: LatLng, c: Circuit) {
  let best = Infinity;
  for (let i = 0; i < c.path.length - 1; i++) best = Math.min(best, toSegment(p, c.path[i], c.path[i + 1]));
  return best;
}

/** Circuito mais próximo, com distância estimada em linha reta (a partir de coordenadas ilustrativas). */
export function nearestCircuit(p: LatLng) {
  return circuits
    .map((c) => ({ circuit: c, km: distanceToCircuit(p, c) }))
    .sort((a, b) => a.km - b.km)[0];
}
