import type { PaymentTerms } from '@/types';

// Condições DEMONSTRATIVAS. Editáveis em Admin › Configurações; não representam oferta real.
export const defaultPaymentTerms: PaymentTerms = {
  downPaymentPercent: 30,
  maxInstallments: 6, // cartão: saldo em até N parcelas
  cardInterestPercentMonth: 0,
  pixDiscountPercent: 0, // aplicado apenas no pagamento à vista via Pix
  pixMaxInstallments: 3, // Pix: saldo em até N parcelas mensais antes do check-in
  serviceFeePercent: 0,
};
