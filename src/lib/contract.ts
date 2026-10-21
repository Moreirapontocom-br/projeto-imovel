import type { Client, Property, Reservation } from '@/types';
import { brand } from '@/config/brand';
import { contractConfig as cfg } from '@/config/contract';
import { brlExact, brlExtenso, plural } from './format';
import { fmtLong, nightsBetween, todayIso } from './dates';

export const placeholders: { key: string; label: string }[] = [
  { key: 'empresa.nome', label: 'Nome da empresa' },
  { key: 'locador.nome', label: 'Locador' },
  { key: 'locador.documento', label: 'Documento do locador' },
  { key: 'locador.endereco', label: 'Endereço do locador' },
  { key: 'corretor.nome', label: 'Corretor' },
  { key: 'corretor.creci', label: 'CRECI' },
  { key: 'cliente.nome', label: 'Nome do cliente' },
  { key: 'cliente.documento', label: 'Documento' },
  { key: 'cliente.cidade', label: 'Cidade do cliente' },
  { key: 'imovel.titulo', label: 'Imóvel' },
  { key: 'imovel.descricao', label: 'Descrição do imóvel' },
  { key: 'imovel.bairro', label: 'Bairro' },
  { key: 'imovel.capacidade', label: 'Capacidade' },
  { key: 'evento', label: 'Evento' },
  { key: 'reserva.codigo', label: 'Código da reserva' },
  { key: 'reserva.checkin', label: 'Check-in' },
  { key: 'reserva.checkout', label: 'Check-out' },
  { key: 'reserva.horaEntrada', label: 'Hora de entrada' },
  { key: 'reserva.horaSaida', label: 'Hora de saída' },
  { key: 'reserva.noites', label: 'Noites' },
  { key: 'reserva.hospedes', label: 'Hóspedes' },
  { key: 'valor.total', label: 'Valor total' },
  { key: 'valor.extenso', label: 'Valor total por extenso' },
  { key: 'valor.limpeza', label: 'Taxa de limpeza' },
  { key: 'caucao.valor', label: 'Caução' },
  { key: 'caucao.extenso', label: 'Caução por extenso' },
  { key: 'multa.diaria', label: 'Diária excedente' },
  { key: 'pagamento.metodo', label: 'Forma de pagamento' },
  { key: 'pagamento.cronograma', label: 'Cronograma' },
  { key: 'data.hoje', label: 'Data de hoje' },
];

const valor = (v: number) => `${brlExact(v)} (${brlExtenso(v)})`;

export function contractContext(r: Reservation, c: Client, p: Property): Record<string, string> {
  return {
    'empresa.nome': brand.name,
    'locador.nome': cfg.locador.nome,
    'locador.documento': cfg.locador.documento,
    'locador.endereco': cfg.locador.endereco,
    'corretor.nome': cfg.corretor.nome,
    'corretor.creci': cfg.corretor.creci,
    'cliente.nome': c.name,
    'cliente.documento': c.document,
    'cliente.cidade': c.city,
    'imovel.titulo': p.title,
    'imovel.descricao': `${p.type} com ${plural(p.bedrooms, 'quarto', 'quartos')} e ${plural(p.bathrooms, 'banheiro', 'banheiros')}, ${p.areaM2} m²`,
    'imovel.bairro': p.neighborhood,
    'imovel.capacidade': plural(p.guests, 'pessoa', 'pessoas'),
    evento: brand.event,
    'reserva.codigo': r.code,
    'reserva.checkin': fmtLong(r.range.start),
    'reserva.checkout': fmtLong(r.range.end),
    'reserva.horaEntrada': cfg.horaEntrada,
    'reserva.horaSaida': cfg.horaSaida,
    'reserva.noites': String(nightsBetween(r.range)),
    'reserva.hospedes': String(r.guests),
    'valor.total': brlExact(r.total),
    'valor.extenso': brlExtenso(r.total),
    'valor.limpeza': valor(p.cleaningFee),
    'caucao.valor': brlExact(cfg.caucao),
    'caucao.extenso': brlExtenso(cfg.caucao),
    'multa.diaria': valor(cfg.diariaExcedente),
    'pagamento.metodo': r.method === 'pix' ? 'Pix' : 'cartão de crédito',
    'pagamento.cronograma': r.installments.map((i) => `   • ${i.label}: ${valor(i.amount)} — vencimento ${fmtLong(i.dueDate)}`).join('\n'),
    'data.hoje': fmtLong(todayIso()),
  };
}

export const fillTemplate = (body: string, ctx: Record<string, string>) =>
  body.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (m, k) => ctx[k] ?? m);
