import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle2, Copy, FileText } from 'lucide-react';
import { useState } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { StatusBadge } from '@/components/ui';
import { useStore } from '@/store';
import { brl } from '@/lib/format';
import { fmtRange } from '@/lib/dates';

/** Padrão visual de QR (ilustrativo, não decodificável): três marcadores de canto + ruído determinístico. */
function qrCells(seed: string, n = 21) {
  let h = [...seed].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);
  const rnd = () => ((h = (h * 1103515245 + 12345) >>> 0) >>> 16) & 1;
  const finder = (x: number, y: number) => {
    for (const [ox, oy] of [[0, 0], [n - 7, 0], [0, n - 7]]) {
      const dx = x - ox, dy = y - oy;
      if (dx >= 0 && dx < 7 && dy >= 0 && dy < 7) return dx === 0 || dx === 6 || dy === 0 || dy === 6 || (dx > 1 && dx < 5 && dy > 1 && dy < 5) ? 1 : 0;
      if (dx >= -1 && dx <= 7 && dy >= -1 && dy <= 7) return 0;
    }
    return null;
  };
  return Array.from({ length: n * n }, (_, i) => finder(i % n, Math.floor(i / n)) ?? rnd()).map(Boolean);
}

export default function Confirmation() {
  const [sp] = useSearchParams();
  const ids = sp.get('r')?.split(',') ?? [];
  const all = useStore((s) => s.reservations);
  const reservations = all.filter((r) => ids.includes(r.id));
  const properties = useStore((s) => s.properties);
  const [copied, setCopied] = useState(false);
  const pix = reservations[0]?.method === 'pix';
  const code = `00020126DEMO-${reservations.map((r) => r.code).join('-')}-SEM-VALOR-REAL`;

  return (
    <>
      <Header />
      <main className="page-narrow confirm">
        <CheckCircle2 size={44} className="confirm-icon" aria-hidden />
        <h1>Solicitação de reserva enviada</h1>
        <p className="lead">Isto não equivale a pagamento confirmado. A reserva fica <b>pendente</b> até a confirmação pelo administrador. Nada foi cobrado.</p>

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

        {pix && (
          <div className="pix-box">
            <div className="pix-qr" aria-hidden>{qrCells(code).map((on, i) => <i key={i} className={on ? 'on' : ''} />)}</div>
            <div>
              <h2>Pix demonstrativo</h2>
              <p className="muted small">Código ilustrativo, sem valor real. Não tente pagar.</p>
              <code className="pix-code">{code}</code>
              <button className="btn btn-secondary btn-sm" onClick={() => { navigator.clipboard?.writeText(code); setCopied(true); }}><Copy size={15} />{copied ? 'Copiado' : 'Copiar código'}</button>
            </div>
          </div>
        )}

        <div className="confirm-actions">
          <Link to="/cliente" className="btn btn-primary btn-lg">Ir para minha área</Link>
          <Link to="/cliente/contratos" className="btn btn-secondary btn-lg"><FileText size={17} />Ver contrato demonstrativo</Link>
        </div>
      </main>
      <Footer />
    </>
  );
}
