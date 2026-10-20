import { Link, useNavigate } from 'react-router-dom';
import { Trash2, AlertCircle, CalendarDays, Users } from 'lucide-react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button, EmptyState } from '@/components/ui';
import { useStore } from '@/store';
import { quote } from '@/lib/payment';
import { findConflict } from '@/lib/availability';
import { brl, plural } from '@/lib/format';
import { fmtRange, nightsBetween } from '@/lib/dates';

export default function Cart() {
  const cart = useStore((s) => s.cart);
  const properties = useStore((s) => s.properties);
  const blocks = useStore((s) => s.blocks);
  const terms = useStore((s) => s.terms);
  const remove = useStore((s) => s.removeFromCart);
  const nav = useNavigate();

  const rows = cart.map((c) => {
    const p = properties.find((x) => x.id === c.propertyId)!;
    return { c, p, q: quote(p, c.range, terms), conflict: findConflict(p.id, c.range, blocks) };
  });
  const total = rows.reduce((s, r) => s + r.q.total, 0);
  const blocked = rows.some((r) => r.conflict);

  return (
    <>
      <Header />
      <main className="page">
        <h1 className="page-title">Carrinho</h1>
        {rows.length === 0 ? (
          <EmptyState title="Seu carrinho está vazio" text="Escolha um imóvel, defina o período e adicione ao carrinho para simular a reserva." action={<Link to="/buscar" className="btn btn-primary btn-md">Ver imóveis</Link>} />
        ) : (
          <div className="two-col">
            <ul className="cart-list">
              {rows.map(({ c, p, q, conflict }) => (
                <li key={c.id} className={`cart-item ${conflict ? 'has-error' : ''}`}>
                  <Link to={`/imovel/${p.id}?inicio=${c.range.start}&fim=${c.range.end}`} className="cart-thumb"><img src={p.photos[0].src} alt={p.photos[0].alt} /></Link>
                  <div className="cart-info">
                    <h3><Link to={`/imovel/${p.id}`}>{p.title}</Link></h3>
                    <p className="muted">{p.type} · {p.neighborhood}</p>
                    <p className="cart-meta">
                      <span><CalendarDays size={15} />{fmtRange(c.range)} · {plural(nightsBetween(c.range), 'noite', 'noites')}</span>
                      <span><Users size={15} />{plural(c.guests, 'hóspede', 'hóspedes')}</span>
                    </p>
                    {conflict && <p className="form-error"><AlertCircle size={15} />{conflict.reason}. Altere as datas ou remova o item.</p>}
                  </div>
                  <div className="cart-side">
                    <strong>{brl(q.total)}</strong>
                    <button className="link-btn with-icon danger" onClick={() => remove(c.id)}><Trash2 size={15} />Remover</button>
                  </div>
                </li>
              ))}
            </ul>
            <aside className="summary">
              <h2>Resumo</h2>
              <dl className="breakdown">
                {rows.map(({ c, p, q }) => <div key={c.id}><dt>{p.title}</dt><dd>{brl(q.total)}</dd></div>)}
                <div className="total"><dt>Total</dt><dd>{brl(total)}</dd></div>
              </dl>
              <p className="muted small">Entrada de {terms.downPaymentPercent}% e parcelamento do saldo na próxima etapa.</p>
              <Button block size="lg" disabled={blocked} onClick={() => nav('/checkout')}>Continuar para pagamento</Button>
              <p className="book-note">Simulação: nenhuma cobrança será feita.</p>
            </aside>
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
