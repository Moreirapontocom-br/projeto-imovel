const brlFmt = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
const brlCents = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

export const brl = (v: number) => brlFmt.format(Math.round(v));
export const brlExact = (v: number) => brlCents.format(v);

export const brlShort = (v: number) =>
  v >= 1000 ? `R$ ${(Math.round(v / 100) / 10).toLocaleString('pt-BR')} mil` : brl(v);

export const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

export const km = (v: number) =>
  v < 1 ? `${Math.round(v * 1000 / 50) * 50} m` : `${v.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} km`;
