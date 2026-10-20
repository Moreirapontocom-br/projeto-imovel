import type { AvailabilityBlock, Client, Contract, ContractTemplate, Reservation } from '@/types';
import { buildInstallments } from '@/lib/payment';
import { defaultPaymentTerms } from '@/config/payment';

// Pessoas, reservas e bloqueios FICTÍCIOS para a demonstração.

export const DEMO_CLIENT_ID = 'c-01';

export const seedClients: Client[] = [
  { id: 'c-01', name: 'Mariana Costa', email: 'mariana@exemplo.demo', phone: '(11) 90000-0101', city: 'São Paulo, SP', document: '***.482.917-**', createdAt: '2026-08-12' },
  { id: 'c-02', name: 'Rafael Lima', email: 'rafael@exemplo.demo', phone: '(21) 90000-0202', city: 'Rio de Janeiro, RJ', document: '***.301.552-**', createdAt: '2026-08-30' },
  { id: 'c-03', name: 'Juliana Alves', email: 'juliana@exemplo.demo', phone: '(31) 90000-0303', city: 'Belo Horizonte, MG', document: '***.774.120-**', createdAt: '2026-09-14' },
  { id: 'c-04', name: 'Pedro Santos', email: 'pedro@exemplo.demo', phone: '(81) 90000-0404', city: 'Recife, PE', document: '***.915.338-**', createdAt: '2026-09-21' },
  { id: 'c-05', name: 'Camila Rocha', email: 'camila@exemplo.demo', phone: '(61) 90000-0505', city: 'Brasília, DF', document: '***.226.081-**', createdAt: '2026-10-02' },
];

const mk = (
  id: string, code: string, propertyId: string, clientId: string,
  start: string, end: string, guests: number, total: number,
  status: Reservation['status'], paid: number, method: Reservation['method'] = 'cartao',
): Reservation => {
  const installments = buildInstallments(total, method, defaultPaymentTerms, defaultPaymentTerms.maxInstallments, '2026-10-01')
    .map((p, i) => ({ ...p, status: i < paid ? ('pago' as const) : ('aberto' as const) }));
  return { id, code, propertyId, clientId, range: { start, end }, guests, total, method, installments, status, createdAt: '2026-10-01', contractId: `ct-${id}` };
};

export const seedReservations: Reservation[] = [
  mk('r-001', 'CAR-27-0412', 'brr-03', 'c-01', '2027-02-04', '2027-02-10', 7, 21500, 'confirmada', 3),
  mk('r-002', 'CAR-27-0418', 'ond-05', 'c-02', '2027-02-04', '2027-02-10', 8, 34500, 'confirmada', 4),
  mk('r-003', 'CAR-27-0425', 'ond-04', 'c-03', '2027-02-04', '2027-02-07', 4, 7600, 'pendente', 0, 'pix'),
  mk('r-004', 'CAR-27-0431', 'pel-12', 'c-05', '2027-02-05', '2027-02-10', 3, 9600, 'pendente', 1),
  mk('r-005', 'CAR-27-0437', 'vit-09', 'c-04', '2027-02-10', '2027-02-14', 5, 9000, 'confirmada', 2),
];

export const seedBlocks: AvailabilityBlock[] = [
  ...seedReservations.map((r) => ({ id: `b-${r.id}`, propertyId: r.propertyId, start: r.range.start, end: r.range.end, kind: 'reserva' as const, reservationId: r.id })),
  { id: 'b-own-01', propertyId: 'rvm-07', start: '2027-01-30', end: '2027-02-14', kind: 'bloqueio', note: 'Uso do proprietário' },
  { id: 'b-own-02', propertyId: 'grc-08', start: '2027-01-26', end: '2027-01-30', kind: 'bloqueio', note: 'Manutenção' },
];

export const seedTemplates: ContractTemplate[] = [
  {
    id: 'tpl-temporada',
    name: 'Locação por temporada — padrão',
    updatedAt: '2026-10-01',
    body: `CONTRATO DE LOCAÇÃO POR TEMPORADA (MODELO DEMONSTRATIVO)

LOCADOR: {{empresa.nome}}
LOCATÁRIO: {{cliente.nome}}, documento {{cliente.documento}}, residente em {{cliente.cidade}}.

1. OBJETO
Locação do imóvel "{{imovel.titulo}}", localizado no bairro {{imovel.bairro}}, Salvador/BA, para uso residencial por temporada.

2. PERÍODO
Entrada em {{reserva.checkin}} e saída em {{reserva.checkout}}, totalizando {{reserva.noites}} noites, para até {{reserva.hospedes}} hóspedes.

3. VALOR E PAGAMENTO
Valor total de {{valor.total}}, pago via {{pagamento.metodo}}, conforme o cronograma:
{{pagamento.cronograma}}

4. DISPOSIÇÕES GERAIS
[Cláusulas a serem definidas e aprovadas pelo responsável jurídico.]

Salvador, {{data.hoje}}.

Código da reserva: {{reserva.codigo}}`,
  },
  {
    id: 'tpl-curto',
    name: 'Termo resumido de reserva',
    updatedAt: '2026-10-05',
    body: `TERMO DE RESERVA (MODELO DEMONSTRATIVO)

Reserva {{reserva.codigo}} em nome de {{cliente.nome}}.
Imóvel: {{imovel.titulo}} — {{imovel.bairro}}.
Período: {{reserva.checkin}} a {{reserva.checkout}} ({{reserva.noites}} noites).
Total: {{valor.total}} via {{pagamento.metodo}}.

[Texto a ser substituído pelo modelo aprovado.]`,
  },
];

export const seedContracts: Contract[] = seedReservations.map((r) => ({
  id: `ct-${r.id}`,
  reservationId: r.id,
  templateId: 'tpl-temporada',
  status: r.status === 'confirmada' ? 'assinado-demo' : 'enviado',
  createdAt: r.createdAt,
}));
