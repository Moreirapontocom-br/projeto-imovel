/**
 * Pontos de integração futura. Hoje cada serviço tem uma implementação DEMO local;
 * para produção, implemente a mesma interface chamando o backend real e troque a exportação.
 *
 *  - PaymentGateway   → PSP / adquirente (Pix e cartão)
 *  - SignatureProvider → assinatura eletrônica (ex.: provedores com API de envelope)
 *  - AuthProvider      → autenticação; permissões devem ser validadas NO BACKEND
 *  - Persistência      → hoje o store (Zustand + localStorage) faz o papel de banco de dados
 */
import type { Installment, PaymentMethod, Role } from '@/types';

export interface ChargeResult { id: string; status: 'simulado'; pixCode?: string; message: string }

export interface PaymentGateway {
  createCharge(input: { reservationCode: string; method: PaymentMethod; installment: Installment }): Promise<ChargeResult>;
}

export interface SignatureProvider {
  requestSignature(input: { contractId: string; signerEmail: string }): Promise<{ envelopeId: string; status: 'simulado' }>;
}

export interface AuthProvider {
  signIn(role: Role): Promise<{ role: Role; userId: string | null }>;
}

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
const rid = () => Math.random().toString(36).slice(2, 10).toUpperCase();

export const paymentGateway: PaymentGateway = {
  async createCharge({ reservationCode, method }) {
    await wait(900);
    return {
      id: `DEMO-${rid()}`,
      status: 'simulado',
      pixCode: method === 'pix' ? `00020126DEMO0014BR.GOV.BCB.PIX-${reservationCode}-SEM-VALOR-REAL` : undefined,
      message: 'Cobrança simulada. Nenhum valor foi processado.',
    };
  },
};

export const signatureProvider: SignatureProvider = {
  async requestSignature() {
    await wait(700);
    return { envelopeId: `ENV-DEMO-${rid()}`, status: 'simulado' };
  },
};

export const authProvider: AuthProvider = {
  async signIn(role) {
    await wait(300);
    return { role, userId: role === 'cliente' ? 'c-01' : role === 'admin' ? 'admin' : null };
  },
};
