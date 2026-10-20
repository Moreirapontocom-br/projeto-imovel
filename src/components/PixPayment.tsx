import { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { AlertCircle, CheckCircle2, Clock, Copy, FileCheck2, Paperclip, Upload } from 'lucide-react';
import { useStore } from '@/store';
import { Button } from '@/components/ui';
import { pixPayload, pixTxid } from '@/lib/pix';
import { fileSize, prepareReceipt, type ReceiptUpload } from '@/lib/receipt';
import { brlExact } from '@/lib/format';
import { fmtLong } from '@/lib/dates';
import type { Installment, Reservation } from '@/types';

/** Pagamento de UMA parcela via Pix: QR Code, copia e cola e envio do comprovante para aprovação. */
export function PixPayment({ reservation, installment }: { reservation: Reservation; installment: Installment }) {
  const code = pixPayload({ amount: installment.amount, txid: pixTxid(reservation.code, installment.n) });
  const [qr, setQr] = useState('');
  const [copied, setCopied] = useState(false);
  const codeRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    let alive = true;
    QRCode.toDataURL(code, { margin: 1, width: 360, color: { dark: '#061B37', light: '#FFFFFF' } }).then((url) => alive && setQr(url));
    return () => { alive = false; };
  }, [code]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
    } catch {
      // sem permissão de área de transferência: seleciona para o cliente copiar manualmente
      codeRef.current?.select();
      document.execCommand?.('copy');
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  if (installment.status === 'pago') {
    return <p className="pix-state is-ok"><CheckCircle2 size={18} />Pagamento de {brlExact(installment.amount)} aprovado{installment.paidAt ? ` em ${fmtLong(installment.paidAt)}` : ''}.</p>;
  }

  return (
    <div className="pix-pay">
      <div className="pix-pay-code">
        <div className="pix-qr-img">{qr ? <img src={qr} alt={`QR Code Pix de ${brlExact(installment.amount)}`} /> : <span aria-busy="true" />}</div>
        <div className="pix-pay-info">
          <p className="pix-amount"><small>{installment.label} · vence {fmtLong(installment.dueDate)}</small><b>{brlExact(installment.amount)}</b></p>
          <ol className="pix-steps">
            <li>Abra o app do seu banco e escolha <b>Pix › Ler QR Code</b> ou <b>Pix copia e cola</b>.</li>
            <li>Confira o valor e conclua o pagamento.</li>
            <li>Anexe o comprovante abaixo. O pagamento é confirmado depois da aprovação.</li>
          </ol>
          <label className="pix-cc-label" htmlFor={`pix-${reservation.id}-${installment.n}`}>Pix copia e cola</label>
          <div className="pix-cc">
            <textarea id={`pix-${reservation.id}-${installment.n}`} ref={codeRef} readOnly rows={3} value={code} onFocus={(e) => e.currentTarget.select()} />
            <Button size="sm" variant="secondary" onClick={copy}><Copy size={15} />{copied ? 'Copiado' : 'Copiar'}</Button>
          </div>
          <p className="fineprint">Código fictício de demonstração: a chave não existe e nenhum banco aceita este pagamento.</p>
        </div>
      </div>
      <ReceiptForm reservation={reservation} installment={installment} />
    </div>
  );
}

function ReceiptForm({ reservation, installment }: { reservation: Reservation; installment: Installment }) {
  const submit = useStore((s) => s.submitReceipt);
  const [file, setFile] = useState<ReceiptUpload | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const inReview = installment.status === 'em-analise';
  const [replacing, setReplacing] = useState(false);

  async function pick(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    setError('');
    try { setFile(await prepareReceipt(f)); } catch (err) { setFile(null); setError((err as Error).message); }
  }

  async function send() {
    if (!file) return;
    setBusy(true);
    const r = await submit(reservation.id, installment.n, file);
    setBusy(false);
    if (!r.ok) return setError(r.error);
    setFile(null);
    setReplacing(false);
  }

  if (inReview && !replacing) {
    return (
      <div className="pix-state is-pending">
        <Clock size={18} />
        <span>Comprovante <b>{installment.receipt?.name}</b> enviado. Aguardando aprovação do administrador.</span>
        <button className="link-btn" onClick={() => setReplacing(true)}>Trocar arquivo</button>
      </div>
    );
  }

  return (
    <div className="receipt-form">
      {installment.reviewNote && (
        <p className="form-error" role="alert"><AlertCircle size={16} />Comprovante recusado: {installment.reviewNote} Envie um novo comprovante.</p>
      )}
      <input ref={input} type="file" accept="image/jpeg,image/png,image/webp,application/pdf" hidden onChange={pick} />
      {file ? (
        <div className="receipt-file">
          <FileCheck2 size={18} />
          <span><b>{file.name}</b><small>{fileSize(file.size)}</small></span>
          <button className="link-btn" onClick={() => input.current?.click()}>Trocar</button>
        </div>
      ) : (
        <Button variant="secondary" block onClick={() => input.current?.click()}><Paperclip size={16} />Anexar comprovante (foto ou PDF)</Button>
      )}
      {error && <p className="form-error" role="alert"><AlertCircle size={16} />{error}</p>}
      {file && <Button block loading={busy} onClick={send}><Upload size={16} />Enviar comprovante</Button>}
      {replacing && <button className="link-btn" onClick={() => { setReplacing(false); setFile(null); setError(''); }}>Cancelar troca</button>}
    </div>
  );
}

/** Situação da parcela, sempre com texto além da cor. */
export function InstallmentPill({ i }: { i: Installment }) {
  if (i.status === 'pago') return <span className="pill is-ok"><CheckCircle2 size={13} />Pago</span>;
  if (i.status === 'em-analise') return <span className="pill is-review"><Clock size={13} />Em análise</span>;
  if (i.reviewNote) return <span className="pill is-error"><AlertCircle size={13} />Recusado</span>;
  return <span className="pill is-pending"><Clock size={13} />Em aberto</span>;
}
