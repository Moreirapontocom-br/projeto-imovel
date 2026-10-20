import { useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { Button, ConfirmButton, Field } from '@/components/ui';
import { useStore } from '@/store';
import { defaultPaymentTerms } from '@/config/payment';
import { buildInstallments } from '@/lib/payment';
import { brl } from '@/lib/format';
import { todayIso } from '@/lib/dates';
import type { PaymentTerms } from '@/types';

const FIELDS: { k: keyof PaymentTerms; label: string; hint: string; min: number; max: number; step?: number }[] = [
  { k: 'downPaymentPercent', label: 'Entrada (%)', hint: 'Percentual pago na confirmação.', min: 0, max: 100 },
  { k: 'maxInstallments', label: 'Parcelas no cartão', hint: 'Máximo de parcelas do saldo.', min: 1, max: 12 },
  { k: 'cardInterestPercentMonth', label: 'Juros do cartão (% a.m.)', hint: '0 = sem juros.', min: 0, max: 10, step: 0.1 },
  { k: 'pixMaxInstallments', label: 'Parcelas no Pix', hint: 'Saldo em parcelas mensais.', min: 1, max: 6 },
  { k: 'pixDiscountPercent', label: 'Desconto Pix à vista (%)', hint: 'Aplicado só no pagamento único.', min: 0, max: 20, step: 0.5 },
  { k: 'serviceFeePercent', label: 'Taxa de serviço (%)', hint: 'Somada ao total da estadia.', min: 0, max: 20, step: 0.5 },
];

export default function AdminSettings() {
  const terms = useStore((s) => s.terms);
  const setTerms = useStore((s) => s.setTerms);
  const resetDemo = useStore((s) => s.resetDemo);
  const [form, setForm] = useState(terms);
  const [saved, setSaved] = useState(false);
  const example = buildInstallments(20000, 'cartao', form, form.maxInstallments, todayIso());

  return (
    <div className="admin-page">
      <header className="admin-head">
        <h1>Condições de pagamento</h1>
        <p className="muted">Valores demonstrativos usados no catálogo, no checkout e nos contratos.</p>
      </header>
      <div className="settings">
        <section className="panel">
          <div className="form-grid">
            {FIELDS.map((f) => (
              <Field key={f.k} label={f.label} hint={f.hint} type="number" min={f.min} max={f.max} step={f.step ?? 1} value={form[f.k]}
                onChange={(e) => { setForm({ ...form, [f.k]: Math.max(f.min, Math.min(f.max, Number(e.target.value))) }); setSaved(false); }} />
            ))}
          </div>
          <div className="res-actions">
            <Button onClick={() => { setTerms(form); setSaved(true); }}>Salvar condições</Button>
            <Button variant="ghost" onClick={() => { setForm(defaultPaymentTerms); setSaved(false); }}>Restaurar padrão</Button>
            {saved && <span className="saved" role="status">Condições salvas e aplicadas</span>}
          </div>
        </section>
        <aside className="panel example">
          <h2>Exemplo: reserva de {brl(20000)}</h2>
          <p className="muted small">Cartão, entrada + {form.maxInstallments}x</p>
          <ul className="sched">
            {example.map((i) => <li key={i.n}><span>{i.label}</span><b>{brl(i.amount)}</b></li>)}
          </ul>
        </aside>
      </div>

      <section className="panel danger-zone">
        <div>
          <h2>Restaurar demonstração</h2>
          <p className="muted small">Apaga reservas, bloqueios e edições feitas nesta sessão e volta aos dados originais.</p>
        </div>
        <ConfirmButton variant="danger" size="md" confirmLabel="Apagar alterações e restaurar?" onConfirm={() => { resetDemo(); setForm(defaultPaymentTerms); }}><RotateCcw size={15} />Restaurar dados</ConfirmButton>
      </section>
    </div>
  );
}
