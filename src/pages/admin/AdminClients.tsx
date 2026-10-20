import { useState } from 'react';
import { Modal } from '@/components/ui';
import { useStore } from '@/store';
import { brl } from '@/lib/format';
import { fmtLong, fmtRange } from '@/lib/dates';
import type { Client } from '@/types';

export default function AdminClients() {
  const clients = useStore((s) => s.clients);
  const reservations = useStore((s) => s.reservations);
  const properties = useStore((s) => s.properties);
  const [open, setOpen] = useState<Client | null>(null);
  const [q, setQ] = useState('');
  const list = clients.filter((c) => `${c.name} ${c.email} ${c.city}`.toLowerCase().includes(q.toLowerCase()));
  const of = (id: string) => reservations.filter((r) => r.clientId === id && r.status !== 'cancelada');

  return (
    <div className="admin-page">
      <header className="admin-head row">
        <div><h1>Clientes</h1><p className="muted">Pessoas fictícias para demonstração.</p></div>
        <input className="search-input" type="search" placeholder="Buscar por nome, e-mail ou cidade" aria-label="Buscar clientes" value={q} onChange={(e) => setQ(e.target.value)} />
      </header>
      <div className="table-wrap">
        <table className="table table-rows">
          <thead><tr><th>Nome</th><th>Contato</th><th>Cidade</th><th>Cliente desde</th><th className="num">Reservas</th><th className="num">Valor</th><th /></tr></thead>
          <tbody>
            {list.map((c) => {
              const rs = of(c.id);
              return (
                <tr key={c.id}>
                  <td><span className="cell-person"><span className="avatar sm">{c.name[0]}</span><strong>{c.name}</strong></span></td>
                  <td><span className="stack-sm"><span>{c.email}</span><small className="muted">{c.phone}</small></span></td>
                  <td>{c.city}</td>
                  <td>{fmtLong(c.createdAt)}</td>
                  <td className="num">{rs.length}</td>
                  <td className="num">{brl(rs.reduce((s, r) => s + r.total, 0))}</td>
                  <td className="right"><button className="btn btn-secondary btn-sm" onClick={() => setOpen(c)}>Detalhes</button></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <Modal open={!!open} onClose={() => setOpen(null)} title={open?.name ?? ''}>
        {open && (
          <>
            <dl className="kv">
              <div><dt>E-mail</dt><dd>{open.email}</dd></div>
              <div><dt>Telefone</dt><dd>{open.phone}</dd></div>
              <div><dt>Cidade</dt><dd>{open.city}</dd></div>
              <div><dt>Documento</dt><dd>{open.document}</dd></div>
            </dl>
            <h3>Reservas</h3>
            <ul className="block-list">
              {of(open.id).map((r) => (
                <li key={r.id}><span><strong>{properties.find((p) => p.id === r.propertyId)?.title}</strong><small>{r.code} · {fmtRange(r.range)} · {brl(r.total)} · {r.status}</small></span></li>
              ))}
              {of(open.id).length === 0 && <li className="muted">Sem reservas ativas.</li>}
            </ul>
          </>
        )}
      </Modal>
    </div>
  );
}
