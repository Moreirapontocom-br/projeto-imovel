import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { Amenity, DateRange } from '@/types';
import { useStore } from '@/store';
import { brand } from '@/config/brand';
import { quote } from '@/lib/payment';
import { statusFor } from '@/lib/availability';
import { nearestCircuit } from '@/lib/geo';

export interface Filters {
  bairros: string[];
  guests: number;
  range: DateRange;
  priceMax: number | null;
  nearKm: number | null;
  amenities: Amenity[];
  onlyAvailable: boolean;
}

/** Filtros lidos e gravados na URL — busca compartilhável e botão voltar funcionando. */
export function useFilters() {
  const [sp, setSp] = useSearchParams();
  const filters: Filters = {
    bairros: sp.get('bairro')?.split(',').filter(Boolean) ?? [],
    guests: Number(sp.get('hospedes') ?? 2) || 2,
    range: { start: sp.get('inicio') ?? brand.defaultRange.start, end: sp.get('fim') ?? brand.defaultRange.end },
    priceMax: sp.get('ate') ? Number(sp.get('ate')) : null,
    nearKm: sp.get('circuito') ? Number(sp.get('circuito')) : null,
    amenities: (sp.get('comodidades')?.split(',').filter(Boolean) ?? []) as Amenity[],
    onlyAvailable: sp.get('livres') === '1',
  };

  const update = (patch: Partial<Filters>) => {
    const f = { ...filters, ...patch };
    const next = new URLSearchParams();
    if (f.bairros.length) next.set('bairro', f.bairros.join(','));
    if (f.guests !== 2) next.set('hospedes', String(f.guests));
    if (f.range.start !== brand.defaultRange.start || f.range.end !== brand.defaultRange.end) { next.set('inicio', f.range.start); next.set('fim', f.range.end); }
    if (f.priceMax) next.set('ate', String(f.priceMax));
    if (f.nearKm) next.set('circuito', String(f.nearKm));
    if (f.amenities.length) next.set('comodidades', f.amenities.join(','));
    if (f.onlyAvailable) next.set('livres', '1');
    setSp(next, { replace: true });
  };

  const activeCount = filters.bairros.length + (filters.priceMax ? 1 : 0) + (filters.nearKm ? 1 : 0) + filters.amenities.length + (filters.onlyAvailable ? 1 : 0);
  return { filters, update, activeCount, clear: () => update({ bairros: [], priceMax: null, nearKm: null, amenities: [], onlyAvailable: false }) };
}

/** Catálogo com total do período, status e circuito mais próximo, já calculados. */
export function useCatalog(range: DateRange) {
  const properties = useStore((s) => s.properties);
  const blocks = useStore((s) => s.blocks);
  const reservations = useStore((s) => s.reservations);
  const terms = useStore((s) => s.terms);
  return useMemo(
    () => properties.map((p) => ({
      property: p,
      total: quote(p, range, terms).total,
      status: statusFor(p.id, range, blocks, reservations),
      near: nearestCircuit(p.location),
    })),
    [properties, blocks, reservations, terms, range.start, range.end],
  );
}

export function applyFilters(items: ReturnType<typeof useCatalog>, f: Filters) {
  return items.filter(({ property: p, total, status, near }) =>
    (!f.bairros.length || f.bairros.includes(p.neighborhood)) &&
    p.guests >= f.guests &&
    (!f.priceMax || total <= f.priceMax) &&
    (!f.nearKm || near.km <= f.nearKm) &&
    f.amenities.every((a) => p.amenities.includes(a)) &&
    (!f.onlyAvailable || status === 'disponivel'));
}
