const brlFmt = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
const brlCents = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

export const brl = (v: number) => brlFmt.format(Math.round(v));
export const brlExact = (v: number) => brlCents.format(v);

export const brlShort = (v: number) =>
  v >= 1000 ? `R$ ${(Math.round(v / 100) / 10).toLocaleString('pt-BR')} mil` : brl(v);

export const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

export const km = (v: number) =>
  v < 1 ? `${Math.round(v * 1000 / 50) * 50} m` : `${v.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} km`;

const UNI = ['', 'um', 'dois', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove', 'dez', 'onze', 'doze', 'treze', 'quatorze', 'quinze', 'dezesseis', 'dezessete', 'dezoito', 'dezenove'];
const DEZ = ['', '', 'vinte', 'trinta', 'quarenta', 'cinquenta', 'sessenta', 'setenta', 'oitenta', 'noventa'];
const CEM = ['', 'cento', 'duzentos', 'trezentos', 'quatrocentos', 'quinhentos', 'seiscentos', 'setecentos', 'oitocentos', 'novecentos'];

/** 0–999 por extenso. */
function ate999(n: number): string {
  if (n === 100) return 'cem';
  const c = Math.floor(n / 100), r = n % 100;
  const resto = r < 20 ? UNI[r] : [DEZ[Math.floor(r / 10)], UNI[r % 10]].filter(Boolean).join(' e ');
  return [CEM[c], resto].filter(Boolean).join(' e ');
}

function inteiro(n: number): string {
  if (n === 0) return 'zero';
  const mi = Math.floor(n / 1e6), mil = Math.floor((n % 1e6) / 1000), r = n % 1000;
  const partes = [
    mi && `${ate999(mi)} ${mi === 1 ? 'milhão' : 'milhões'}`,
    mil && (mil === 1 ? 'mil' : `${ate999(mil)} mil`),
    r && ate999(r),
  ].filter(Boolean) as string[];
  // "e" antes do último grupo quando ele é menor que 100 ou uma centena exata (ex.: "dois mil e quinhentos")
  if (partes.length > 1 && (r < 100 || r % 100 === 0)) return partes.slice(0, -1).join(' ') + ' e ' + partes[partes.length - 1];
  return partes.join(' ');
}

/** Valor em reais por extenso, como nos contratos: 22000 → "vinte e dois mil reais". */
export function brlExtenso(v: number): string {
  const total = Math.round(v * 100);
  const reais = Math.floor(total / 100), cent = total % 100;
  const r = reais ? `${inteiro(reais)}${reais % 1e6 === 0 ? ' de' : ''} ${reais === 1 ? 'real' : 'reais'}` : '';
  const c = cent ? `${inteiro(cent)} ${cent === 1 ? 'centavo' : 'centavos'}` : '';
  return [r, c].filter(Boolean).join(' e ') || 'zero reais';
}
