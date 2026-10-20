import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, Users, MapPin, Download, Eye, PenLine, QrCode } from 'lucide-react';
import { useStore } from '@/store';
import { useMyReservations } from './ClientLayout';
import { PropertyMap } from '@/components/PropertyMap';
import { Button, EmptyState, Modal } from '@/components/ui';
import { brl, brlExact, km, plural } from '@/lib/format';
import { fmtLong, fmtRange, nightsBetween } from '@/lib/dates';
import { distanceToCircuit, haversine } from '@/lib/geo';
import { circuits, pois } from '@/data/geo';
import { contractContext, fillTemplate } from '@/lib/contract';
import { downloadContractPdf } from '@/lib/pdf';
import { signatureProvider } from '@/services';
import { InstallmentPill, PixPayment } from '@/components/PixPayment';
import type { Installment, Reservation } from '@/types';

const resStatus = { pendente: { label: 'Pendente', cls: 'is-pending' }, confirmada: { label: 'Confirmada', cls: 'is-ok' }, cancelada: { label: 'Cancelada', cls: 'is-off' } };

export function ClientReservations() {
  const mine = useMyReservations();
  const properties = useStore((s) => s.properties);
  if (!mine.length) return <EmptyState title="Você ainda não tem reservas" text="Escolha um imóvel e simule uma reserva para vê-la aqui." action={<Link to="/buscar" className="btn btn-primary btn-md">Ver imóveis</Link>} />;
  return (
    <div className="res-list">
      {mine.map((r) => {
        const p = properties.find((x) => x.id === r.propertyId)!;
        const paid = r.installments.filter((i) => i.status === 'pago').reduce((s, i) => s + i.amount, 0);
        const pct = Math.round((paid / r.total) * 100);
        return (
          <article key={r.id} className="res-card">
            <img src={p.photos[0].src} alt={p.photos[0].alt} />
            <div className="res-body">
              <div className="res-top">
                <span className={`pill ${resStatus[r.status].cls}`}>{resStatus[r.status].label}</span>
                <span className="muted small">Código {r.code}</span>
              </div>
              <h2><Link to={`/imovel/${p.id}`}>{p.title}</Link></h2>
              <p className="cart-meta">
                <span><MapPin size={15} />{p.neighborhood}</span>
                <span><CalendarDays size={15} />{fmtRange(r.range)} · {plural(nightsBetween(r.range), 'noite', 'noites')}</span>
                <span><Users size={15} />{plural(r.guests, 'hóspede', 'hóspedes')}</span>
              </p>
              <div className="progress" aria-label={`${pct}% pago`}>
                <div className="progress-bar"><i style={{ width: `${pct}%` }} /></div>
                <span><b>{brl(paid)}</b> pagos de {brl(r.total)}</span>
              </div>
              <div className="res-actions">
                <Link to="/cliente/pagamentos" className="btn btn-secondary btn-sm">Pagamentos</Link>
                <Link to="/cliente/contratos" className="btn btn-secondary btn-sm">Contrato</Link>
                <Link to="/cliente/mapa" className="btn btn-ghost btn-sm">Ver arredores</Link>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}

export function ClientPayments() {
  const mine = useMyReservations();
  const properties = useStore((s) => s.properties);
  const pay = useStore((s) => s.payInstallment);
  const [busy, setBusy] = useState('');
  const [open, setOpen] = useState<{ r: Reservation; n: number } | null>(null);
  // lê a parcela sempre do store, para o modal refletir o envio do comprovante na hora
  const openRes = open && mine.find((r) => r.id === open.r.id);
  const openInst = openRes?.installments.find((i) => i.n === open!.n);
  if (!mine.length) return <EmptyState title="Nenhum pagamento" text="Os pagamentos aparecem depois de uma reserva." />;
  return (
    <div className="stack">
      {mine.map((r) => {
        const p = properties.find((x) => x.id === r.propertyId)!;
        const pix = r.method === 'pix';
        const nextCard = r.installments.find((x) => x.status !== 'pago')?.n;
        return (
          <section key={r.id} className="panel">
            <header className="panel-head">
              <div><h2>{p.title}</h2><p className="muted small">{r.code} · {pix ? 'Pix' : 'Cartão de crédito'} · total {brl(r.total)}</p></div>
            </header>
            <table className="table">
              <thead><tr><th>Pagamento</th><th>Vencimento</th><th className="num">Valor</th><th>Situação</th><th /></tr></thead>
              <tbody>
                {r.installments.map((i) => (
                  <tr key={i.n}>
                    <td>{i.label}</td>
                    <td>{fmtLong(i.dueDate)}</td>
                    <td className="num">{brlExact(i.amount)}</td>
                    <td><InstallmentPill i={i} /></td>
                    <td className="right">
                      {pix && r.status !== 'cancelada' && i.status !== 'pago' && (
                        <Button size="sm" variant={i.status === 'em-analise' ? 'ghost' : 'secondary'} onClick={() => setOpen({ r, n: i.n })}>
                          {i.status === 'em-analise' ? 'Ver envio' : <><QrCode size={15} />Pagar com Pix</>}
                        </Button>
                      )}
                      {!pix && i.status !== 'pago' && i.n === nextCard && (
                        <Button size="sm" variant="secondary" loading={busy === `${r.id}-${i.n}`} onClick={async () => { setBusy(`${r.id}-${i.n}`); await new Promise((x) => setTimeout(x, 700)); await pay(r.id, i.n); setBusy(''); }}>
                          Simular pagamento
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        );
      })}
      <Modal open={!!openInst} onClose={() => setOpen(null)} title={openInst ? `Pagar ${pixTitle(openInst)} com Pix` : 'Pix'} wide>
        {openRes && openInst && <PixPayment reservation={openRes} installment={openInst} />}
      </Modal>
      <p className="fineprint">Pix: pague pelo QR Code ou copia e cola e anexe o comprovante; cada parcela é confirmada pelo administrador. Cartão: pagamento simulado. Nenhuma transação real é processada.</p>
    </div>
  );
}

const pixTitle = (i: Installment) => (i.n === 0 ? i.label.toLowerCase() : i.label.replace('Parcela', 'parcela'));

export function useContractText(r?: Reservation) {
  const clients = useStore((s) => s.clients);
  const properties = useStore((s) => s.properties);
  const templates = useStore((s) => s.templates);
  const contracts = useStore((s) => s.contracts);
  return useMemo(() => {
    if (!r) return null;
    const ct = contracts.find((c) => c.reservationId === r.id);
    const tpl = templates.find((t) => t.id === ct?.templateId) ?? templates[0];
    const c = clients.find((x) => x.id === r.clientId);
    const p = properties.find((x) => x.id === r.propertyId);
    if (!tpl || !c || !p || !ct) return null;
    return { contract: ct, template: tpl, text: fillTemplate(tpl.body, contractContext(r, c, p)), property: p };
  }, [r, clients, properties, templates, contracts]);
}

const ctStatus = { rascunho: 'Rascunho', enviado: 'Aguardando assinatura', 'assinado-demo': 'Assinado (simulação)' };

export function ClientContracts() {
  const mine = useMyReservations();
  const [open, setOpen] = useState<Reservation | null>(null);
  if (!mine.length) return <EmptyState title="Nenhum contrato" text="O contrato é gerado automaticamente depois da reserva." />;
  return (
    <div className="stack">
      {mine.map((r) => <ContractRow key={r.id} r={r} onView={() => setOpen(r)} />)}
      <ContractPreview r={open} onClose={() => setOpen(null)} />
      <p className="fineprint">Modelos demonstrativos, sem validade jurídica. A assinatura eletrônica real será integrada a um provedor homologado.</p>
    </div>
  );
}

function ContractRow({ r, onView }: { r: Reservation; onView(): void }) {
  const data = useContractText(r);
  const setStatus = useStore((s) => s.setContractStatus);
  const [signing, setSigning] = useState(false);
  if (!data) return null;
  return (
    <section className="panel contract-row">
      <div>
        <h2>{data.template.name}</h2>
        <p className="muted small">{data.property.title} · {r.code}</p>
      </div>
      <span className={`pill ${data.contract.status === 'assinado-demo' ? 'is-ok' : 'is-pending'}`}>{ctStatus[data.contract.status]}</span>
      <div className="res-actions">
        <Button size="sm" variant="secondary" onClick={onView}><Eye size={15} />Visualizar</Button>
        <Button size="sm" variant="secondary" onClick={() => downloadContractPdf(data.template.name, data.text, `contrato-${r.code}-DEMO.pdf`)}><Download size={15} />PDF</Button>
        {data.contract.status !== 'assinado-demo' && (
          <Button size="sm" loading={signing} onClick={async () => { setSigning(true); await signatureProvider.requestSignature({ contractId: data.contract.id, signerEmail: '' }); await setStatus(data.contract.id, 'assinado-demo'); setSigning(false); }}>
            <PenLine size={15} />Simular assinatura
          </Button>
        )}
      </div>
    </section>
  );
}

export function ContractPreview({ r, onClose }: { r: Reservation | null; onClose(): void }) {
  const data = useContractText(r ?? undefined);
  return (
    <Modal open={!!r && !!data} onClose={onClose} title={data?.template.name ?? 'Contrato'} wide footer={data && <Button onClick={() => downloadContractPdf(data.template.name, data.text, `contrato-${r!.code}-DEMO.pdf`)}><Download size={16} />Baixar PDF demonstrativo</Button>}>
      <div className="doc-watermark">Documento demonstrativo — sem validade jurídica</div>
      <pre className="doc">{data?.text}</pre>
    </Modal>
  );
}

export function ClientMap() {
  const mine = useMyReservations();
  const properties = useStore((s) => s.properties);
  const [sel, setSel] = useState(0);
  if (!mine.length) return <EmptyState title="Nada para mostrar" text="O mapa mostra o seu imóvel reservado e o que existe por perto." />;
  const r = mine[Math.min(sel, mine.length - 1)];
  const p = properties.find((x) => x.id === r.propertyId)!;
  const near = [
    ...circuits.map((c) => ({ id: c.id, name: c.name, color: c.color, d: distanceToCircuit(p.location, c) })),
  ].sort((a, b) => a.d - b.d);
  const nearPois = pois.map((x) => ({ x, d: haversine(p.location, x.location) })).sort((a, b) => a.d - b.d).slice(0, 6);
  return (
    <div className="client-map">
      <div className="client-map-side">
        {mine.length > 1 && (
          <div className="chip-wrap">
            {mine.map((m, i) => <button key={m.id} className="chip" aria-pressed={i === sel} onClick={() => setSel(i)}>{properties.find((x) => x.id === m.propertyId)?.neighborhood}</button>)}
          </div>
        )}
        <h2>{p.title}</h2>
        <p className="muted small">{p.neighborhood} · localização aproximada</p>
        <h3>Circuitos do Carnaval</h3>
        <ul className="near-list">{near.map((c) => <li key={c.id}><i style={{ background: c.color }} />{c.name}<span>{km(c.d)}</span></li>)}</ul>
        <h3>Pontos de interesse</h3>
        <ul className="near-list">{nearPois.map(({ x, d }) => <li key={x.id}><i className="dot" />{x.name}<span>{km(d)}</span></li>)}</ul>
        <p className="fineprint">Distâncias em linha reta, estimadas a partir de coordenadas ilustrativas.</p>
      </div>
      <PropertyMap items={[{ property: p, total: r.total, status: 'reservado' }]} mode="client" showPois className="client-map-canvas" label="Mapa do seu imóvel e arredores" />
    </div>
  );
}
