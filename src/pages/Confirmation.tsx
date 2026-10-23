import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle2, FileText } from 'lucide-react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { StatusBadge } from '@/components/ui';
import { PixPayment } from '@/components/PixPayment';
import { useStore } from '@/store';
import { brl } from '@/lib/format';
import { fmtRange } from '@/lib/dates';

const hasMoreInstallments = (list: { installments: unknown[] }[]) => list.some((r) => r.installments.length > 1);

export default function Confirmation() {
  const [sp] = useSearchParams();
  const ids = sp.get('r')?.split(',') ?? [];
  const all = useStore((s) => s.reservations);
  const reservations = all.filter((r) => ids.includes(r.id));
  const properties = useStore((s) => s.properties);
  const pix = reservations[0]?.method === 'pix';

  return (
    <>
      <Header />
      <main className="page-narrow confirm">
        <CheckCircle2 size={44} className="confirm-icon" aria-hidden />
        <h1>Solicitação de reserva enviada</h1>
        <p className="lead">
          {pix
            ? <>Pague a {reservations[0]?.installments[0]?.label.toLowerCase() ?? 'entrada'} com Pix e anexe o comprovante. A reserva fica <b>pendente</b> até o administrador aprovar o pagamento.</>
            : <>Isto não equivale a pagamento confirmado. A reserva fica <b>pendente</b> até a confirmação pelo administrador. Nada foi cobrado.</>}
        </p>

        <ul className="confirm-list">
          {reservations.map((r) => {
            const p = properties.find((x) => x.id === r.propertyId)!;
            return (
              <li key={r.id}>
                <img src={p.photos[0].src} alt="" />
                <span>
                  <strong>{p.title}</strong>
                  <small>Código {r.code} · {fmtRange(r.range)} · {brl(r.total)}</small>
                </span>
                <StatusBadge status="pendente" size="sm" />
              </li>
            );
          })}
        </ul>

        {/* no cartão o Pix fica como alternativa */}
        {reservations.map((r) => (
          <section key={r.id} className="pix-box">
            <h2>{reservations.length > 1 ? `${properties.find((x) => x.id === r.propertyId)?.title} · ` : ''}{pix ? `${r.installments[0].label} via Pix` : `Prefere pagar ${r.installments[0].label.toLowerCase()} com Pix?`}</h2>
            <PixPayment reservation={r} installment={r.installments[0]} />
          </section>
        ))}
        {hasMoreInstallments(reservations) && <p className="muted small">As próximas parcelas ficam em <b>Minha área › Pagamentos</b>, cada uma com seu QR Code Pix.</p>}

        <div className="confirm-actions">
          <Link to="/cliente" className="btn btn-primary btn-lg">Ir para minha área</Link>
          <Link to="/cliente/contratos" className="btn btn-secondary btn-lg"><FileText size={17} />Ver contrato demonstrativo</Link>
        </div>
      </main>
      <Footer />
    </>
  );
}
