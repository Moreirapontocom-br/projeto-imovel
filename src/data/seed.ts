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
    name: 'Locação para fins de temporada — padrão',
    updatedAt: '2026-10-21',
    body: `CONTRATO DE LOCAÇÃO PARA FINS DE TEMPORADA
(MODELO DEMONSTRATIVO — sujeito a revisão jurídica)

Por este instrumento particular, as partes qualificadas na Cláusula 1ª têm entre si justa e acertada a presente relação contratual.

CLÁUSULA 1ª — QUALIFICAÇÃO DAS PARTES

LOCADOR(A): {{locador.nome}}, documento {{locador.documento}}, com endereço em {{locador.endereco}}.

LOCATÁRIO(A): {{cliente.nome}}, documento {{cliente.documento}}, residente em {{cliente.cidade}}.
Nacionalidade: ____________________   Profissão: ____________________
Estado civil: ____________________   RG: ____________________
Endereço completo e CEP: ________________________________________

CLÁUSULA 2ª — DO IMÓVEL
O LOCADOR coloca à disposição do LOCATÁRIO o imóvel abaixo descrito, com móveis e utensílios básicos, conforme relação anexa e Termo de Vistoria:
{{imovel.descricao}} — "{{imovel.titulo}}", bairro {{imovel.bairro}}, Salvador/BA.
a) Durante a locação não serão fornecidos itens de higiene pessoal, roupa de banho nem roupa de cama. O LOCADOR não se responsabiliza por objetos esquecidos no imóvel após a devolução.

CLÁUSULA 3ª — DO VALOR E DO PAGAMENTO
Pela locação ora acertada, o LOCATÁRIO pagará ao LOCADOR o valor total de {{valor.total}} ({{valor.extenso}}), a título de aluguel por temporada, via {{pagamento.metodo}}, da seguinte forma:
{{pagamento.cronograma}}
a) As chaves só serão liberadas mediante a confirmação de todos os pagamentos, inclusive da caução.
b) O valor total refere-se à locação durante o {{evento}}, de {{reserva.checkin}} a {{reserva.checkout}}, na cidade de Salvador/BA, e deverá estar integralmente pago até a entrega das chaves. O valor poderá ser ajustado caso o número de pessoas ultrapasse o combinado de {{reserva.hospedes}}.
c) A intermediação desta locação é realizada por {{corretor.nome}}, {{corretor.creci}}, cuja remuneração é paga pelo proprietário do imóvel, conforme acordado entre eles.

CLÁUSULA 4ª — DO PERÍODO
A locação terá como data de entrada {{reserva.checkin}}, às {{reserva.horaEntrada}} (horário da vistoria do imóvel e da entrega das chaves), e saída em {{reserva.checkout}}, até as {{reserva.horaSaida}} (horário da vistoria para devolução das chaves), totalizando {{reserva.noites}} noites. Nesse momento o LOCATÁRIO é obrigado a devolver o imóvel, independentemente de notificação ou aviso, no estado geral descrito no Termo de Vistoria.
a) A quantidade de pessoas hospedadas no imóvel não poderá exceder {{imovel.capacidade}} em hipótese ou momento algum.
b) O imóvel será entregue limpo. Na saída será cobrada a taxa de limpeza de {{valor.limpeza}}.
c) O LOCATÁRIO é responsável pelo consumo de energia elétrica, medido a partir da entrega das chaves e acertado ao final da temporada.

CLÁUSULA 5ª — DA CAUÇÃO
O LOCATÁRIO entregará ao corretor, na chegada, a quantia de {{caucao.valor}} ({{caucao.extenso}}) como caução e garantia para cobertura de eventuais danos ao imóvel, aos móveis, utensílios e eletrodomésticos. O valor será devolvido ao final da locação, após a vistoria que constate o bom uso e a preservação do imóvel, descontado o indispensável para reparos, se houver.

CLÁUSULA 6ª — DA PERMANÊNCIA APÓS O PRAZO E DO ATRASO
A permanência no imóvel após o encerramento do prazo da Cláusula 4ª implicará o pagamento de {{multa.diaria}} por dia excedente, até a definitiva desocupação.
a) O pagamento em atraso implicará multa diária de 2% sobre o valor da parcela, até o limite de 10%, acrescida de juros de mora de 2% ao mês.

CLÁUSULA 7ª — DA LEGISLAÇÃO
Este contrato é regido pelos artigos 48 a 50 da Lei nº 8.245/91 e demais disposições legais pertinentes.

CLÁUSULA 8ª — DAS OBRIGAÇÕES DO LOCATÁRIO
Além das previstas em lei, são obrigações do LOCATÁRIO:
a) Não ceder ou franquear o imóvel a terceiros sem o prévio e expresso consentimento, por escrito, do LOCADOR.
b) Restituir o imóvel nas mesmas condições em que o recebeu, limpo, sem estragos, avarias ou danos, inclusive móveis, utensílios e demais pertences.
c) Comunicar imediatamente ao LOCADOR quaisquer ocorrências imprevistas no imóvel e em seus utensílios.
d) Antes da entrega das chaves, enviar os nomes e documentos de todos os hóspedes (RG, CNH, passaporte, carteira de trabalho ou documento de classe), com telefone e endereço de residência.

CLÁUSULA 9ª — DA VISTORIA
A vistoria dos móveis e utensílios existentes no imóvel integra este contrato para todos os fins de direito, cabendo ao LOCADOR reter, do valor da caução, o indispensável para cobrir os prejuízos ocorridos no imóvel quando da sua entrega definitiva.

CLÁUSULA 10ª — DO ADIAMENTO DO EVENTO
Este contrato vale para o {{evento}}. Caso o evento seja cancelado ou adiado por determinação do poder público, o contrato valerá para a nova data definida pela Prefeitura de Salvador. Se utilizado no ano seguinte, o valor total sofrerá reajuste de 15%.

CLÁUSULA 11ª — DA RESCISÃO
Se qualquer das partes rescindir ou desistir deste contrato antes do prazo estabelecido, pagará à outra parte, a título de indenização, o equivalente a 2 (duas) locações sobre o valor total deste contrato.
a) O LOCADOR fica isento da multa rescisória caso, na impossibilidade de locar o imóvel, ofereça ao LOCATÁRIO outro imóvel, para troca, com as mesmas características.

CLÁUSULA 12ª — DO FORO
As partes elegem o Foro da Comarca de Salvador/BA para dirimir qualquer dúvida sobre este instrumento.

E, por estarem assim justas e contratadas, as partes assinam o presente contrato em 4 (quatro) vias de igual teor e forma, na presença de testemunhas.

Salvador, {{data.hoje}}.


___________________________________________
LOCADOR(A): {{locador.nome}}


___________________________________________
LOCATÁRIO(A): {{cliente.nome}}


TESTEMUNHAS

1ª) ________________________________________
Nome:
CPF:

2ª) ________________________________________
Nome:
CPF:

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
