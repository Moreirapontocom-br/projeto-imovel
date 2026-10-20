import { pixReceiver } from '@/config/payment';

// "Pix copia e cola" (BR Code, padrão EMV do Banco Central) com CRC16 válido.

const field = (id: string, value: string) => `${id}${String(value.length).padStart(2, '0')}${value}`;

/** Remove acentos e caracteres fora do permitido; o BR Code aceita só ASCII. */
const ascii = (v: string, max: number) => v.normalize('NFD').replace(/[^\x20-\x7E]/g, '').toUpperCase().slice(0, max);

function crc16(payload: string) {
  let crc = 0xffff;
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let b = 0; b < 8; b++) crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

/** Código Pix estático com valor e identificador (txid) da parcela. */
export function pixPayload({ amount, txid }: { amount: number; txid: string }) {
  const body =
    field('00', '01') +
    field('26', field('00', 'br.gov.bcb.pix') + field('01', pixReceiver.key)) +
    field('52', '0000') +
    field('53', '986') +
    field('54', amount.toFixed(2)) +
    field('58', 'BR') +
    field('59', ascii(pixReceiver.name, 25)) +
    field('60', ascii(pixReceiver.city, 15)) +
    field('62', field('05', txid.replace(/[^A-Za-z0-9]/g, '').slice(0, 25) || '***')) +
    '6304';
  return body + crc16(body);
}

/** txid da parcela: código da reserva + número, só letras e números. */
export const pixTxid = (reservationCode: string, n: number) => `${reservationCode}P${n}`.replace(/[^A-Za-z0-9]/g, '');
