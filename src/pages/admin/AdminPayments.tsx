import { useEffect, useState } from 'react';
import { Check, Download, Eye, X } from 'lucide-react';
import { Button, Modal, Segmented } from '@/components/ui';
import { InstallmentPill } from '@/components/PixPayment';
import { useStore } from '@/store';
import { brlExact } from '@/lib/format';
import { fmtLong } from '@/lib/dates';
import { fileSize } from '@/lib/receipt';
import type { Installment, Receipt, Reservation } from '@/types';

type Row = { r: Reservation; i: Installment };
type Filter = 'analise' | 'pix' | 'todos';

export default function AdminPayments() {
  const reservations = useStore((s) => s.reservations);
  const clients = useStore((s) => s.clients);
  const properties = useStore((s) => s.properties);
  const review = useStore((s) => s.reviewInstallment);
  const [f, setF] = useState<Filter>('analise');
  const [viewing, setViewing] = useState<Receipt | null>(null);
  const [rejecting, setRejecting] = useState<Row | null>(null);
  const [busy, setBusy] = useState('');

  const all: Row[] = reservations.flatMap((r) => r.installments.map((i) => ({ r, i })));
  const waiting = all.filter(({ i }) => i.status === 'em-analise');
  const list = (f === 'analise' ? waiting : f === 'pix' ? all.filter(({ r }) => r.method === 'pix') : all)
    .sort((a, b) => (b.i.receipt?.uploadedAt ?? '').localeCompare(a.i.receipt?.uploadedAt ?? '') || a.i.dueDate.localeCompare(b.i.dueDate));

  async function approve({ r, i }: Row) {
    setBusy(`${r.id}-${i.n}`);
    await review(r.id, i.n, true);
    setBusy('');
  }

  return (
    <div className="admin-page">
      <header className="admin-head row">
        <div><h1>Pagamentos</h1><p className="muted">Confira o comprovante enviado pelo cliente e aprove ou recuse cada parcela.</p></div>
        <Segmented<Filter> label="Filtrar pagamentos" value={f} onChange={setF} options={[
          { value: 'analise', label: <>Aguardando aprovação{waiting.length > 0 && <b className="seg-count">{waiting.length}</b>}</> },
          { value: 'pix', label: 'Todos via Pix' },
          { value: 'todos', label: 'Todos' },
        ]} />
      </header>
      <div className="table-wrap">
        <table className="table table-rows">
          <thead><tr><th>Reserva</th><th>Cliente</th><th>Pagamento</th><th className="num">Valor</th><th>Comprovante</th>{f !== 'analise' && <th>Situação</th>}<th /></tr></thead>
          <tbody>
            {list.map(({ r, i }) => {
              const key = `${r.id}-${i.n}`;
              return (
                <tr key={key}>
                  <td><span className="mono">{r.code}</span><br /><small className="muted">{properties.find((p) => p.id === r.propertyId)?.title}</small></td>
                  <td className="nowrap">{clients.find((c) => c.id === r.clientId)?.name}</td>
                  <td className="nowrap">{i.label}<br /><small className="muted">{r.method === 'pix' ? 'Pix' : 'Cartão'} · vence {fmtLong(i.dueDate)}</small></td>
                  <td className="num">{brlExact(i.amount)}</td>
                  <td>
                    {i.receipt
                      ? <span className="nowrap"><button className="link-btn with-icon" onClick={() => setViewing(i.receipt!)} aria-label={`Ver comprovante de ${i.label}`}><Eye size={14} />Ver</button><br /><small className="muted">enviado {fmtLong(i.receipt.uploadedAt)}</small></span>
                      : <span className="muted small">—</span>}
                  </td>
                  {/* na fila, todas estão em análise: a coluna dá lugar aos botões */}
                  {f !== 'analise' && <td><InstallmentPill i={i} /></td>}
                  <td className="right nowrap">
                    {i.status === 'em-analise' && (
                      <>
                        <Button size="sm" loading={busy === key} onClick={() => approve({ r, i })}><Check size={14} />Aprovar</Button>
                        <Button size="sm" variant="ghost" onClick={() => setRejecting({ r, i })}><X size={14} />Recusar</Button>
                      </>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {list.length === 0 && <p className="muted pad">{f === 'analise' ? 'Nenhum comprovante aguardando aprovação.' : 'Nenhum pagamento neste filtro.'}</p>}
      </div>

      <ReceiptViewer receipt={viewing} onClose={() => setViewing(null)} />
      <RejectDialog row={rejecting} onClose={() => setRejecting(null)} onReject={async (note) => {
        const r = await review(rejecting!.r.id, rejecting!.i.n, false, note);
        if (r.ok) setRejecting(null);
      }} />
    </div>
  );
}

function ReceiptViewer({ receipt, onClose }: { receipt: Receipt | null; onClose(): void }) {
  const receiptUrl = useStore((s) => s.receiptUrl);
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!receipt) return;
    let made = '';
    setUrl(''); setError('');
    receiptUrl(receipt.id).then((u) => { made = u; setUrl(u); }).catch((e: Error) => setError(e.message));
    return () => { if (made.startsWith('blob:')) URL.revokeObjectURL(made); };
  }, [receipt, receiptUrl]);

  const pdf = receipt?.type === 'application/pdf';
  return (
    <Modal open={!!receipt} onClose={onClose} title="Comprovante" wide footer={url && <a className="btn btn-secondary btn-md" href={url} download={receipt?.name}><Download size={16} />Baixar arquivo</a>}>
      {receipt && <p className="muted small">{receipt.name} · {fileSize(receipt.size)} · enviado em {fmtLong(receipt.uploadedAt)}</p>}
      {error && <p className="form-error" role="alert">{error}</p>}
      {url && (pdf
        ? <iframe className="receipt-view" src={url} title={`Comprovante ${receipt?.name}`} />
        : <img className="receipt-view" src={url} alt={`Comprovante ${receipt?.name}`} />)}
    </Modal>
  );
}

function RejectDialog({ row, onClose, onReject }: { row: Row | null; onClose(): void; onReject(note: string): Promise<void> }) {
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (row) setNote(''); }, [row]);
  return (
    <Modal open={!!row} onClose={onClose} title="Recusar comprovante" footer={
      <>
        <Button variant="ghost" onClick={onClose}>Voltar</Button>
        <Button variant="danger" loading={busy} disabled={!note.trim()} onClick={async () => { setBusy(true); await onReject(note.trim()); setBusy(false); }}><X size={16} />Recusar</Button>
      </>
    }>
      {row && <p className="muted small">{row.r.code} · {row.i.label} · {brlExact(row.i.amount)}</p>}
      <div className="field">
        <label htmlFor="reject-note">Motivo (o cliente vai ver esta mensagem)</label>
        <textarea id="reject-note" rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Ex.: o valor do comprovante não confere com a parcela." />
      </div>
      <p className="muted small">A parcela volta para "em aberto" e o cliente pode enviar outro comprovante.</p>
    </Modal>
  );
}
