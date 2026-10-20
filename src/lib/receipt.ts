import { receiptRules } from '@/config/payment';

export interface ReceiptUpload { name: string; type: string; size: number; dataUrl: string }

const readAsDataUrl = (blob: Blob) =>
  new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = () => reject(new Error('Não foi possível ler o arquivo.'));
    r.readAsDataURL(blob);
  });

/** Reduz fotos de comprovante para no máximo 1600 px (JPEG), o suficiente para leitura. */
async function shrinkImage(file: File): Promise<Blob> {
  const bmp = await createImageBitmap(file).catch(() => null);
  if (!bmp) throw new Error('Imagem inválida. Envie um JPG, PNG ou PDF.');
  const scale = Math.min(1, 1600 / Math.max(bmp.width, bmp.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bmp.width * scale);
  canvas.height = Math.round(bmp.height * scale);
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#fff'; // PNG transparente vira fundo branco no JPEG
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bmp, 0, 0, canvas.width, canvas.height);
  return new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Falha ao processar a imagem.'))), 'image/jpeg', 0.82));
}

/** Valida e prepara o arquivo escolhido pelo cliente. Lança Error com mensagem para a tela. */
export async function prepareReceipt(file: File): Promise<ReceiptUpload> {
  if (!receiptRules.types.includes(file.type)) throw new Error('Formato não aceito. Envie uma foto (JPG, PNG) ou um PDF do comprovante.');
  const isPdf = file.type === 'application/pdf';
  const blob = isPdf ? file : await shrinkImage(file);
  if (blob.size > receiptRules.maxBytes) throw new Error('Arquivo grande demais (máximo de 3 MB). Tente um print do comprovante.');
  const name = isPdf ? file.name : file.name.replace(/\.\w+$/, '') + '.jpg';
  return { name, type: isPdf ? 'application/pdf' : 'image/jpeg', size: blob.size, dataUrl: await readAsDataUrl(blob) };
}

export const fileSize = (bytes: number) => (bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / 1024 / 1024).toFixed(1).replace('.', ',')} MB`);
