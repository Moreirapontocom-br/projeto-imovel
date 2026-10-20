import type { AvailabilityBlock, DateRange, PropertyStatus, Reservation } from '@/types';
import { overlaps } from './dates';

export interface Conflict { block: AvailabilityBlock; reason: string }

/** Retorna o primeiro conflito do período solicitado, ou null se estiver livre. */
export function findConflict(propertyId: string, range: DateRange, blocks: AvailabilityBlock[], ignoreBlockId?: string): Conflict | null {
  const block = blocks.find((b) => b.propertyId === propertyId && b.id !== ignoreBlockId && overlaps(b, range));
  if (!block) return null;
  return { block, reason: block.kind === 'bloqueio' ? 'Datas bloqueadas pelo administrador' : 'Datas já reservadas' };
}

/** Noites indisponíveis de um imóvel (Set de ISO). */
export function busyNights(propertyId: string, blocks: AvailabilityBlock[]) {
  const set = new Map<string, AvailabilityBlock['kind']>();
  for (const b of blocks) {
    if (b.propertyId !== propertyId) continue;
    for (let d = b.start; d < b.end; d = next(d)) set.set(d, b.kind);
  }
  return set;
}

const next = (iso: string) => {
  const d = new Date(iso + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
};

/**
 * Status do imóvel para um período de referência — fonte única para mapa, catálogo, admin e checkout.
 * Prioridade: bloqueado > pendente > reservado > disponível.
 */
export function statusFor(propertyId: string, range: DateRange, blocks: AvailabilityBlock[], reservations: Reservation[]): PropertyStatus {
  const hits = blocks.filter((b) => b.propertyId === propertyId && overlaps(b, range));
  if (hits.some((b) => b.kind === 'bloqueio')) return 'bloqueado';
  const res = hits.map((b) => reservations.find((r) => r.id === b.reservationId)).filter(Boolean) as Reservation[];
  if (res.some((r) => r.status === 'pendente')) return 'pendente';
  if (hits.length) return 'reservado';
  return 'disponivel';
}

export const statusInfo: Record<PropertyStatus, { label: string; color: string; soft: string }> = {
  disponivel: { label: 'Disponível', color: '#167347', soft: '#E8F3EC' },
  reservado: { label: 'Reservado', color: '#061B37', soft: '#E6EAF0' },
  pendente: { label: 'Pendente', color: '#9B650B', soft: '#FBF3E2' },
  bloqueado: { label: 'Bloqueado', color: '#68717C', soft: '#EEF0F2' },
};
