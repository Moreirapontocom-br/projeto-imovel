import type { Client, Property, Reservation } from '@/types';
import { brand } from '@/config/brand';
import { brlExact, brl } from './format';
import { fmtLong, nightsBetween, todayIso } from './dates';

export const placeholders: { key: string; label: string }[] = [
  { key: 'empresa.nome', label: 'Nome da empresa' },
  { key: 'cliente.nome', label: 'Nome do cliente' },
  { key: 'cliente.documento', label: 'Documento' },
  { key: 'cliente.cidade', label: 'Cidade do cliente' },
  { key: 'imovel.titulo', label: 'Imóvel' },
  { key: 'imovel.bairro', label: 'Bairro' },
  { key: 'reserva.codigo', label: 'Código da reserva' },
  { key: 'reserva.checkin', label: 'Check-in' },
  { key: 'reserva.checkout', label: 'Check-out' },
  { key: 'reserva.noites', label: 'Noites' },
  { key: 'reserva.hospedes', label: 'Hóspedes' },
  { key: 'valor.total', label: 'Valor total' },
  { key: 'pagamento.metodo', label: 'Forma de pagamento' },
  { key: 'pagamento.cronograma', label: 'Cronograma' },
  { key: 'data.hoje', label: 'Data de hoje' },
];

export function contractContext(r: Reservation, c: Client, p: Property): Record<string, string> {
  return {
    'empresa.nome': brand.name,
    'cliente.nome': c.name,
    'cliente.documento': c.document,
    'cliente.cidade': c.city,
    'imovel.titulo': p.title,
    'imovel.bairro': p.neighborhood,
    'reserva.codigo': r.code,
    'reserva.checkin': fmtLong(r.range.start),
    'reserva.checkout': fmtLong(r.range.end),
    'reserva.noites': String(nightsBetween(r.range)),
    'reserva.hospedes': String(r.guests),
    'valor.total': brl(r.total),
    'pagamento.metodo': r.method === 'pix' ? 'Pix' : 'cartão de crédito',
    'pagamento.cronograma': r.installments.map((i) => `   • ${i.label}: ${brlExact(i.amount)} — vencimento ${fmtLong(i.dueDate)}`).join('\n'),
    'data.hoje': fmtLong(todayIso()),
  };
}

export const fillTemplate = (body: string, ctx: Record<string, string>) =>
  body.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (m, k) => ctx[k] ?? m);
