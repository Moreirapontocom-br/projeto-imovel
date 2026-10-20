import type { Installment, PaymentMethod, PaymentTerms, Property, DateRange } from '@/types';
import { addMonths, nightsBetween } from './dates';

export interface Quote {
  nights: number;
  lodging: number;
  cleaning: number;
  service: number;
  total: number;
}

export function quote(p: Property, range: DateRange, terms: PaymentTerms): Quote {
  const nights = Math.max(0, nightsBetween(range));
  const lodging = nights * p.nightly;
  const cleaning = nights > 0 ? p.cleaningFee : 0;
  const service = Math.round((lodging + cleaning) * terms.serviceFeePercent / 100);
  return { nights, lodging, cleaning, service, total: lodging + cleaning + service };
}

/** Maior número de parcelas do saldo permitido para o método. */
export const maxInstallmentsFor = (method: PaymentMethod, terms: PaymentTerms) =>
  method === 'pix' ? terms.pixMaxInstallments : terms.maxInstallments;

/**
 * Monta o cronograma demonstrativo.
 * n = 0 → pagamento único à vista. n ≥ 1 → entrada + n parcelas mensais do saldo.
 */
export function buildInstallments(
  total: number, method: PaymentMethod, terms: PaymentTerms, n: number, startIso: string,
): Installment[] {
  if (n <= 0) {
    const discount = method === 'pix' ? total * terms.pixDiscountPercent / 100 : 0;
    return [{ n: 0, label: 'À vista', dueDate: startIso, amount: round2(total - discount), status: 'aberto' }];
  }
  const down = round2(total * terms.downPaymentPercent / 100);
  const balance = total - down;
  const rate = method === 'cartao' ? terms.cardInterestPercentMonth / 100 : 0;
  const each = rate > 0 ? balance * rate / (1 - Math.pow(1 + rate, -n)) : balance / n;
  const list: Installment[] = [{ n: 0, label: 'Entrada', dueDate: startIso, amount: down, status: 'aberto' }];
  for (let i = 1; i <= n; i++) {
    list.push({ n: i, label: `Parcela ${i}/${n}`, dueDate: addMonths(startIso, i), amount: round2(each), status: 'aberto' });
  }
  return list;
}

export const sumInstallments = (list: Installment[]) => round2(list.reduce((s, i) => s + i.amount, 0));

const round2 = (v: number) => Math.round(v * 100) / 100;

/** Valor de parcela mais baixa possível — usado na vitrine ("ou 6x de ..."). */
export function lowestInstallment(total: number, terms: PaymentTerms) {
  const n = terms.maxInstallments;
  const list = buildInstallments(total, 'cartao', terms, n, '2026-01-01');
  return { n, down: list[0].amount, each: list[1]?.amount ?? total };
}
