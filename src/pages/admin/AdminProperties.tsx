import { useMemo, useState } from 'react';
import { Lock, Trash2, AlertCircle } from 'lucide-react';
import { Button, Field, Modal, StatusBadge } from '@/components/ui';
import { DateRangeCalendar } from '@/components/DateRangeCalendar';
import { useCatalog } from '@/hooks/useCatalog';
import { useStore } from '@/store';
import { brand } from '@/config/brand';
import { busyNights } from '@/lib/availability';
import { brl } from '@/lib/format';
import { fmtRange } from '@/lib/dates';
import type { DateRange, Property } from '@/types';

export default function AdminProperties() {
  const items = useCatalog(brand.defaultRange);
  const [editing, setEditing] = useState<Property | null>(null);
  const [q, setQ] = useState('');
  const list = items.filter((i) => `${i.property.title} ${i.property.neighborhood}`.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="admin-page">
      <header className="admin-head row">
        <div><h1>Imóveis</h1><p className="muted">{items.length} imóveis demonstrativos</p></div>
        <input className="search-input" type="search" placeholder="Buscar por nome ou bairro" aria-label="Buscar imóveis" value={q} onChange={(e) => setQ(e.target.value)} />
      </header>
      <div className="table-wrap">
        <table className="table table-rows">
          <thead><tr><th>Imóvel</th><th>Bairro</th><th>Capacidade</th><th className="num">Diária</th><th className="num">Total Carnaval</th><th>Status</th><th /></tr></thead>
          <tbody>
            {list.map(({ property: p, total, status }) => (
              <tr key={p.id}>
                <td><span className="cell-prop"><img src={p.photos[0].src} alt="" /><span><strong>{p.title}</strong><small>{p.type} · {p.id}</small></span></span></td>
                <td>{p.neighborhood}</td>
                <td>{p.guests} hósp. · {p.bedrooms} qts</td>
                <td className="num">{brl(p.nightly)}</td>
                <td className="num">{brl(total)}</td>
                <td><StatusBadge status={status} size="sm" /></td>
                <td className="right"><Button size="sm" variant="secondary" onClick={() => setEditing(p)}>Gerenciar</Button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {editing && <PropertyEditor property={editing} onClose={() => setEditing(null)} />}
    </div>
  );
}

function PropertyEditor({ property: p, onClose }: { property: Property; onClose(): void }) {
  const update = useStore((s) => s.updateProperty);
  const blocks = useStore((s) => s.blocks);
  const addBlock = useStore((s) => s.addBlock);
  const removeBlock = useStore((s) => s.removeBlock);
  const reservations = useStore((s) => s.reservations);
  const clients = useStore((s) => s.clients);
  const [form, setForm] = useState({ title: p.title, nightly: p.nightly, cleaningFee: p.cleaningFee, guests: p.guests, minNights: p.minNights });
  const [range, setRange] = useState<DateRange | null>(null);
  const [note, setNote] = useState('Uso do proprietário');
  const [err, setErr] = useState('');
  const [saved, setSaved] = useState(false);
  const busy = useMemo(() => busyNights(p.id, blocks), [p.id, blocks]);
  const mine = blocks.filter((b) => b.propertyId === p.id).sort((a, b) => a.start.localeCompare(b.start));

  return (
    <Modal open onClose={onClose} title={`Gerenciar · ${p.title}`} wide footer={
      <>
        {saved && <span className="saved" role="status">Alterações salvas</span>}
        <Button variant="secondary" onClick={onClose}>Fechar</Button>
        <Button onClick={() => { update(p.id, { ...form, title: form.title.trim() || p.title }); setSaved(true); }}>Salvar dados</Button>
      </>
    }>
      <div className="editor-grid">
        <section>
          <h3>Dados do imóvel</h3>
          <div className="form-grid">
            <Field label="Título" value={form.title} onChange={(e) => { setForm({ ...form, title: e.target.value }); setSaved(false); }} className="span-2" />
            <Field label="Diária (R$)" type="number" min={0} value={form.nightly} onChange={(e) => { setForm({ ...form, nightly: Number(e.target.value) }); setSaved(false); }} />
            <Field label="Taxa de limpeza (R$)" type="number" min={0} value={form.cleaningFee} onChange={(e) => { setForm({ ...form, cleaningFee: Number(e.target.value) }); setSaved(false); }} />
            <Field label="Hóspedes" type="number" min={1} value={form.guests} onChange={(e) => { setForm({ ...form, guests: Number(e.target.value) }); setSaved(false); }} />
            <Field label="Mínimo de noites" type="number" min={1} value={form.minNights} onChange={(e) => { setForm({ ...form, minNights: Number(e.target.value) }); setSaved(false); }} />
          </div>
          <h3>Ocupação e bloqueios</h3>
          <ul className="block-list">
            {mine.length === 0 && <li className="muted">Nenhuma ocupação cadastrada.</li>}
            {mine.map((b) => {
              const r = reservations.find((x) => x.id === b.reservationId);
              const c = clients.find((x) => x.id === r?.clientId);
              return (
                <li key={b.id} className={`block-${b.kind}`}>
                  <span><strong>{fmtRange(b)}</strong><small>{b.kind === 'reserva' ? `Reserva ${r?.code} · ${c?.name} · ${r?.status}` : b.note || 'Bloqueio'}</small></span>
                  {b.kind === 'bloqueio' && <button className="link-btn with-icon danger" onClick={() => removeBlock(b.id)}><Trash2 size={14} />Liberar</button>}
                </li>
              );
            })}
          </ul>
        </section>
        <section>
          <h3>Bloquear datas</h3>
          <DateRangeCalendar value={range} onChange={(r) => { setRange(r); setErr(''); }} busy={busy} months={1} />
          <Field label="Motivo" value={note} onChange={(e) => setNote(e.target.value)} />
          {err && <p className="form-error"><AlertCircle size={15} />{err}</p>}
          <Button variant="secondary" block disabled={!range} onClick={() => {
            if (!range) return;
            const r = addBlock(p.id, range, note);
            if (!r.ok) setErr(r.error ?? ''); else setRange(null);
          }}><Lock size={15} />Bloquear período</Button>
        </section>
      </div>
    </Modal>
  );
}
