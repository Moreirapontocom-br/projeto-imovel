import type { PaymentTerms } from '@/types';

// Recebedor do Pix FICTÍCIO. A chave usa o domínio reservado .invalid, que não existe:
// o QR Code segue o padrão do Banco Central, mas nenhum banco consegue pagá-lo.
// Para produção, troque pelos dados reais ou pelo código gerado pelo provedor de pagamento.
export const pixReceiver = {
  key: 'pix@sua-marca.invalid',
  name: 'SUA MARCA DEMO',
  city: 'SALVADOR',
};

/** Comprovantes aceitos: imagens e PDF, até 3 MB (imagens são reduzidas antes do envio). */
export const receiptRules = {
  types: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
  maxBytes: 3 * 1024 * 1024,
};

// Condições DEMONSTRATIVAS. Editáveis em Admin › Configurações; não representam oferta real.
export const defaultPaymentTerms: PaymentTerms = {
  downPaymentPercent: 30,
  maxInstallments: 6, // cartão: saldo em até N parcelas
  cardInterestPercentMonth: 0,
  pixDiscountPercent: 0, // aplicado apenas no pagamento à vista via Pix
  pixMaxInstallments: 3, // Pix: saldo em até N parcelas mensais antes do check-in
  serviceFeePercent: 0,
};
