import { brand } from './brand';

// Dados usados no preenchimento automático dos contratos — FICTÍCIOS na demonstração.
// Troque pelos dados reais do proprietário e do corretor antes de usar com clientes.
export const contractConfig = {
  locador: {
    nome: 'Nome do proprietário (demonstração)',
    documento: '000.000.000-00',
    endereco: 'Salvador, BA',
  },
  corretor: {
    nome: brand.name,
    creci: 'CRECI 00000 (fictício)',
  },
  caucao: 1500, // garantia entregue na chegada, devolvida após a vistoria
  diariaExcedente: 800, // por dia de permanência além do período
  horaEntrada: '12h',
  horaSaida: '14h',
} as const;
