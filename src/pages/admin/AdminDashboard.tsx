import { useState } from 'react';
import { Link } from 'react-router-dom';
import { PropertyMap } from '@/components/PropertyMap';
import { StatusBadge } from '@/components/ui';
import { useCatalog } from '@/hooks/useCatalog';
import { useStore } from '@/store';
import { brand } from '@/config/brand';
import { statusInfo } from '@/lib/availability';
import { brl } from '@/lib/format';
import { fmtLong } from '@/lib/dates';
import type { PropertyStatus } from '@/types';

export default function AdminDashboard() {
  const items = useCatalog(brand.defaultRange);
  const reservations = useStore((s) => s.reservations);
  const clients = useStore((s) => s.clients);
  const properties = useStore((s) => s.properties);
  const [filter, setFilter] = useState<PropertyStatus | null>(null);
  const [sel, setSel] = useState<string | null>(null);
  const [hover, setHover] = useState<string | null>(null);
  const shown = filter ? items.filter((i) => i.status === filter) : items;

  const counts = (Object.keys(statusInfo) as PropertyStatus[]).map((s) => ({ s, n: items.filter((i) => i.status === s).length }));
  const upcoming = reservations
    .filter((r) => r.status !== 'cancelada')
    .flatMap((r) => r.installments.filter((i) => i.status !== 'pago').map((i) => ({ r, i })))
    .sort((a, b) => a.i.dueDate.localeCompare(b.i.dueDate))
    .slice(0, 5);

  return (
    <div className="admin-page">
      <header className="admin-head">
        <h1>Visão geral</h1>
        <p className="muted">Situação de cada imóvel no período do Carnaval.</p>
      </header>

      <div className="status-filter" role="group" aria-label="Filtrar por status">
        <button className="sf-btn" aria-pressed={!filter} onClick={() => setFilter(null)}><b>{items.length}</b> Todos</button>
        {counts.map(({ s, n }) => (
          <button key={s} className="sf-btn" aria-pressed={filter === s} onClick={() => setFilter(filter === s ? null : s)} style={{ ['--c' as string]: statusInfo[s].color }}>
            <i aria-hidden /><b>{n}</b> {statusInfo[s].label}
          </button>
        ))}
      </div>

      <div className="admin-split">
        <ul className="unit-list" aria-label="Imóveis">
          {shown.map(({ property: p, status, total }) => (
            <li key={p.id}>
              <button className={`unit ${sel === p.id || hover === p.id ? 'is-active' : ''}`} style={{ ['--c' as string]: statusInfo[status].color }} onClick={() => setSel(p.id)} onMouseEnter={() => setHover(p.id)} onMouseLeave={() => setHover(null)}>
                <img src={p.photos[0].src} alt="" />
                <span className="unit-txt"><strong>{p.title}</strong><small>{p.neighborhood} · {p.guests} hósp. · {brl(total)}</small></span>
                <StatusBadge status={status} size="sm" />
              </button>
            </li>
          ))}
        </ul>
        <PropertyMap items={shown} mode="admin" selectedId={sel} hoverId={hover} onSelect={setSel} className="admin-map" initialCircuits={false} label="Mapa administrativo" />
      </div>

      <section className="panel">
        <header className="panel-head"><h2>Próximos vencimentos</h2><Link to="/admin/reservas" className="link-btn">Ver reservas</Link></header>
        <table className="table">
          <thead><tr><th>Cliente</th><th>Imóvel</th><th>Pagamento</th><th>Vencimento</th><th className="num">Valor</th></tr></thead>
          <tbody>
            {upcoming.map(({ r, i }) => (
              <tr key={r.id + i.n}>
                <td>{clients.find((c) => c.id === r.clientId)?.name}</td>
                <td>{properties.find((p) => p.id === r.propertyId)?.title}</td>
                <td>{i.label}</td>
                <td>{fmtLong(i.dueDate)}</td>
                <td className="num">{brl(i.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
