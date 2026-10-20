import { useRef, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { QrCode, CreditCard, ShieldCheck, AlertCircle, Lock } from 'lucide-react';
import { Header } from '@/components/Header';
import { Button, Field, Segmented } from '@/components/ui';
import { useStore } from '@/store';
import { paymentGateway } from '@/services';
import { buildInstallments, maxInstallmentsFor, quote, sumInstallments } from '@/lib/payment';
import { brl, brlExact } from '@/lib/format';
import { fmtLong, fmtRange, todayIso } from '@/lib/dates';
import type { PaymentMethod } from '@/types';

export default function Checkout() {
  const cart = useStore((s) => s.cart);
  const properties = useStore((s) => s.properties);
  const terms = useStore((s) => s.terms);
  const role = useStore((s) => s.role);
  const userId = useStore((s) => s.userId);
  const clients = useStore((s) => s.clients);
  const checkout = useStore((s) => s.checkout);
  const nav = useNavigate();
  const me = role === 'cliente' ? clients.find((c) => c.id === userId) : undefined;

  const [form, setForm] = useState({ name: me?.name ?? '', email: me?.email ?? '', phone: me?.phone ?? '', city: me?.city ?? '', document: me?.document ?? '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [method, setMethod] = useState<PaymentMethod>('cartao');
  const [n, setN] = useState(Math.min(3, terms.maxInstallments));
  const [agree, setAgree] = useState(false);
  const [busy, setBusy] = useState(false);
  const [fail, setFail] = useState('');
  const done = useRef(false);

  if (!cart.length && !done.current) return <Navigate to="/carrinho" replace />;

  const rows = cart.map((c) => ({ c, p: properties.find((x) => x.id === c.propertyId)! }));
  const total = rows.reduce((s, r) => s + quote(r.p, r.c.range, terms).total, 0);
  const maxN = maxInstallmentsFor(method, terms);
  const count = Math.min(n, maxN);
  const plan = buildInstallments(total, method, terms, count, todayIso());
  const planTotal = sumInstallments(plan);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [k]: e.target.value });

  function validate() {
    const e: Record<string, string> = {};
    if (form.name.trim().split(' ').length < 2) e.name = 'Informe nome e sobrenome.';
    if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = 'Informe um e-mail válido, como nome@exemplo.com.';
    if (form.phone.replace(/\D/g, '').length < 10) e.phone = 'Informe DDD e número.';
    if (!form.city.trim()) e.city = 'Informe sua cidade.';
    setErrors(e);
    return !Object.keys(e).length;
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setFail('');
    if (!validate()) return;
    if (!agree) return setFail('Confirme que entende que esta é uma simulação.');
    setBusy(true);
    await paymentGateway.createCharge({ reservationCode: 'NOVA', method, installment: plan[0] });
    done.current = true;
    const r = checkout({ items: cart, method, installments: count, client: { ...form, document: form.document || 'não informado' } });
    setBusy(false);
    if (!r.ok) { done.current = false; return setFail(r.error); }
    nav(`/confirmacao?r=${r.reservations.map((x) => x.id).join(',')}`);
  }

  return (
    <>
      <Header />
      <main className="page">
        <Link to="/carrinho" className="back-link">← Voltar ao carrinho</Link>
        <h1 className="page-title">Confirmar e pagar <span className="demo-tag">Simulação</span></h1>
        <form className="two-col" onSubmit={submit} noValidate>
          <div className="checkout-steps">
            <section className="step">
              <h2>Seus dados</h2>
              <div className="form-grid">
                <Field label="Nome completo" value={form.name} onChange={set('name')} error={errors.name} autoComplete="name" placeholder="Ex.: Maria Silva" />
                <Field label="E-mail" type="email" value={form.email} onChange={set('email')} error={errors.email} autoComplete="email" placeholder="nome@exemplo.com" />
                <Field label="Telefone" value={form.phone} onChange={set('phone')} error={errors.phone} autoComplete="tel" placeholder="(71) 90000-0000" />
                <Field label="Cidade" value={form.city} onChange={set('city')} error={errors.city} placeholder="Ex.: São Paulo, SP" />
              </div>
              <p className="muted small">Documentos e dados adicionais serão solicitados apenas quando o processo comercial definitivo exigir.</p>
            </section>

            <section className="step">
              <h2>Forma de pagamento</h2>
              <Segmented label="Método" value={method} onChange={(v) => setMethod(v)} options={[
                { value: 'cartao', label: <><CreditCard size={17} /> Cartão de crédito</> },
                { value: 'pix', label: <><QrCode size={17} /> Pix</> },
              ]} />
              <div className="plan-options" role="radiogroup" aria-label="Condição de pagamento">
                <label className={`plan-opt ${count === 0 ? 'is-on' : ''}`}>
                  <input type="radio" name="plan" checked={count === 0} onChange={() => setN(0)} />
                  <span><strong>À vista</strong><small>{brl(buildInstallments(total, method, terms, 0, todayIso())[0].amount)}{method === 'pix' && terms.pixDiscountPercent > 0 ? ` · ${terms.pixDiscountPercent}% de desconto` : ''}</small></span>
                </label>
                {Array.from({ length: maxN }, (_, i) => i + 1).map((k) => {
                  const pl = buildInstallments(total, method, terms, k, todayIso());
                  return (
                    <label key={k} className={`plan-opt ${count === k ? 'is-on' : ''}`}>
                      <input type="radio" name="plan" checked={count === k} onChange={() => setN(k)} />
                      <span><strong>Entrada + {k}x</strong><small>{brl(pl[0].amount)} + {k}x de {brl(pl[1].amount)}</small></span>
                    </label>
                  );
                })}
              </div>
              {method === 'cartao' ? (
                <p className="secure-note"><Lock size={15} />Na versão final, os dados do cartão serão digitados no ambiente seguro do provedor de pagamento. Esta demonstração não coleta dados de cartão.</p>
              ) : (
                <p className="secure-note"><QrCode size={15} />Um código Pix demonstrativo será exibido após a confirmação. Ele não tem valor real.</p>
              )}
            </section>

            <section className="step">
              <h2>Cronograma</h2>
              <table className="table">
                <thead><tr><th>Pagamento</th><th>Vencimento</th><th className="num">Valor</th></tr></thead>
                <tbody>
                  {plan.map((i) => <tr key={i.n}><td>{i.label}</td><td>{fmtLong(i.dueDate)}</td><td className="num">{brlExact(i.amount)}</td></tr>)}
                </tbody>
                <tfoot><tr><td colSpan={2}>Total</td><td className="num">{brlExact(planTotal)}</td></tr></tfoot>
              </table>
              {method === 'cartao' && terms.cardInterestPercentMonth > 0 && <p className="muted small">Inclui juros demonstrativos de {terms.cardInterestPercentMonth}% a.m. sobre o saldo.</p>}
            </section>
          </div>

          <aside className="summary">
            <h2>Sua reserva</h2>
            <ul className="mini-list">
              {rows.map(({ c, p }) => (
                <li key={c.id}>
                  <img src={p.photos[0].src} alt="" />
                  <span><strong>{p.title}</strong><small>{p.neighborhood} · {fmtRange(c.range)} · {c.guests} hósp.</small></span>
                  <b>{brl(quote(p, c.range, terms).total)}</b>
                </li>
              ))}
            </ul>
            <dl className="breakdown">
              <div><dt>Total do período</dt><dd>{brl(total)}</dd></div>
              <div><dt>{plan[0].label} hoje</dt><dd>{brl(plan[0].amount)}</dd></div>
              {count > 0 && <div><dt>Saldo</dt><dd>{count}x de {brl(plan[1].amount)}</dd></div>}
              <div className="total"><dt>Total a pagar</dt><dd>{brl(planTotal)}</dd></div>
            </dl>
            <label className="check agree">
              <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} />
              Entendo que esta é uma simulação: nenhum valor será cobrado e o contrato gerado é apenas demonstrativo.
            </label>
            {fail && <p className="form-error" role="alert"><AlertCircle size={16} />{fail}</p>}
            <Button type="submit" block size="lg" loading={busy}><ShieldCheck size={18} />Confirmar reserva simulada</Button>
            <p className="book-note">A reserva fica como <b>pendente</b> até a confirmação do pagamento pelo administrador.</p>
          </aside>
        </form>
      </main>
    </>
  );
}
